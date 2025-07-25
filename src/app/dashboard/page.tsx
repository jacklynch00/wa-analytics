'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Users, Calendar, Trash2, Share2, Eye, EyeOff, MoreVertical, Plus, ChevronDown, ChevronRight, Lock, LockOpen, MessageCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CopyButton } from '@/components/ui/copy-button';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';

interface ChatAnalysis {
	id: string;
	title: string;
	totalMessages: number;
	totalMembers: number;
	createdAt: string;
}

interface Community {
	id: string;
	name: string;
	description: string | null;
	createdAt: string;
	chatAnalyses: ChatAnalysis[];
	memberDirectories: {
		id: string;
		password: string | null;
		expiresAt: string;
		createdAt: string;
	}[];
	_count: {
		chatAnalyses: number;
	};
}

export default function DashboardPage() {
	const [user, setUser] = useState<{ name: string; email: string } | null>(null);
	const [communities, setCommunities] = useState<Community[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [openCommunities, setOpenCommunities] = useState<{ [key: string]: boolean }>({});
	const [newCommunity, setNewCommunity] = useState({ name: '', description: '' });
	const [shareMessageModal, setShareMessageModal] = useState<{ open: boolean; directory: Community['memberDirectories'][0] | null; communityName: string }>({
		open: false,
		directory: null,
		communityName: '',
	});
	const router = useRouter();

	const togglePasswordVisibility = (directoryId: string) => {
		setShowPasswords((prev) => ({
			...prev,
			[directoryId]: !prev[directoryId],
		}));
	};

	const toggleCommunity = (communityId: string) => {
		setOpenCommunities((prev) => ({
			...prev,
			[communityId]: !prev[communityId],
		}));
	};

	useEffect(() => {
		const checkAuth = async () => {
			try {
				const session = await authClient.getSession();
				if (!session.data) {
					router.push('/sign-in');
					return;
				}
				setUser(session.data.user);

				// Fetch user's communities from database
				const response = await fetch('/api/communities');
				if (response.ok) {
					const result = await response.json();
					setCommunities(result.communities);
				}
			} catch (error) {
				console.error('Auth check failed:', error);
				router.push('/sign-in');
			} finally {
				setIsLoading(false);
			}
		};

		checkAuth();
	}, [router]);

	const handleSignOut = async () => {
		await authClient.signOut();
		router.push('/');
	};

	const handleCreateCommunity = async () => {
		if (!newCommunity.name.trim()) {
			toast.error('Community name is required');
			return;
		}

		// Check if user has reached the limit
		if (communities.length >= 10) {
			toast.error('Maximum number of communities reached (10)');
			return;
		}

		try {
			const response = await fetch('/api/communities', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: newCommunity.name,
					description: newCommunity.description,
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to create community');
			}

			// Add to communities list
			setCommunities((prev) => [result.community, ...prev]);
			setNewCommunity({ name: '', description: '' });
			setIsCreateModalOpen(false);
			toast.success('Community created successfully');
		} catch (error) {
			console.error('Error creating community:', error);
			if (error instanceof Error) {
				toast.error(`Error: ${error.message}`);
			} else {
				toast.error('Error creating community. Please try again.');
			}
		}
	};

	const handleDeleteCommunity = async (communityId: string) => {
		if (!confirm('Are you sure you want to delete this community? This will also delete all associated analyses. This action cannot be undone.')) {
			return;
		}

		try {
			const response = await fetch(`/api/communities/${communityId}`, {
				method: 'DELETE',
			});

			if (response.ok) {
				// Remove from local state
				setCommunities((prev) => prev.filter((community) => community.id !== communityId));
				toast.success('Community deleted successfully');
			} else {
				toast.error('Failed to delete community. Please try again.');
			}
		} catch (error) {
			console.error('Error deleting community:', error);
			toast.error('Failed to delete community. Please try again.');
		}
	};

	const handleAddPassword = async (communityId: string, directoryId: string) => {
		const password = prompt('Enter a password for the shared directory:');
		if (!password || !password.trim()) {
			return;
		}

		try {
			const response = await fetch('/api/directory/password', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					directoryId,
					password: password.trim(),
				}),
			});

			if (response.ok) {
				// Update local state
				setCommunities((prev) =>
					prev.map((community) =>
						community.id === communityId
							? {
									...community,
									memberDirectories: community.memberDirectories.map((dir) => (dir.id === directoryId ? { ...dir, password: password.trim() } : dir)),
								}
							: community
					)
				);
				toast.success('Password added successfully');
			} else {
				const error = await response.json();
				toast.error(error.error || 'Failed to add password');
			}
		} catch (error) {
			console.error('Error adding password:', error);
			toast.error('Failed to add password. Please try again.');
		}
	};

	const handleRemovePassword = async (communityId: string, directoryId: string) => {
		if (!confirm('Are you sure you want to remove the password? This will make the directory publicly accessible.')) {
			return;
		}

		try {
			const response = await fetch('/api/directory/password', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					directoryId,
					password: null,
				}),
			});

			if (response.ok) {
				// Update local state
				setCommunities((prev) =>
					prev.map((community) =>
						community.id === communityId
							? {
									...community,
									memberDirectories: community.memberDirectories.map((dir) => (dir.id === directoryId ? { ...dir, password: null } : dir)),
								}
							: community
					)
				);
				toast.success('Password removed successfully');
			} else {
				const error = await response.json();
				toast.error(error.error || 'Failed to remove password');
			}
		} catch (error) {
			console.error('Error removing password:', error);
			toast.error('Failed to remove password. Please try again.');
		}
	};

	const handleOpenShareMessage = (directory: Community['memberDirectories'][0], communityName: string) => {
		setShareMessageModal({
			open: true,
			directory,
			communityName,
		});
	};

	const generateShareMessage = () => {
		if (!shareMessageModal.directory) return '';

		const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
		const directoryUrl = `${baseUrl}/directory/${shareMessageModal.directory.id}`;

		let message = `Hey everyone, check out the member directory of people in our WhatsApp group chat here: ${directoryUrl}`;

		if (shareMessageModal.directory.password) {
			message += `. Password to view it is "${shareMessageModal.directory.password}"`;
		}

		return message;
	};

	const handleCopyShareMessage = async () => {
		const message = generateShareMessage();
		try {
			await navigator.clipboard.writeText(message);
			toast.success('Share message copied to clipboard!');
			setShareMessageModal({ open: false, directory: null, communityName: '' });
		} catch (error) {
			console.error('Failed to copy message:', error);
			toast.error('Failed to copy message. Please try again.');
		}
	};

	const handleShareCommunity = async (communityId: string, existingShare?: Community['memberDirectories'][0]) => {
		// If share already exists, show the existing link details
		if (existingShare) {
			await navigator.clipboard.writeText(`${window.location.origin}/directory/${existingShare.id}`);
			toast.success('Share link copied to clipboard!', {
				description: `${existingShare.password ? 'Password: ' + existingShare.password + ' • ' : ''}Expires: ${new Date(existingShare.expiresAt).toLocaleDateString()}`,
				duration: 5000,
			});
			return;
		}

		const password = prompt('Enter an optional password for the shared directory (leave empty for no password):');

		try {
			const response = await fetch('/api/directory/share', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					communityId,
					password: password || undefined,
					expiresInDays: 30,
				}),
			});

			if (response.ok) {
				const result = await response.json();

				// Copy to clipboard and show success message
				await navigator.clipboard.writeText(result.shareUrl);

				if (result.isExisting) {
					toast.success('Existing share link copied to clipboard!', {
						description: `${result.password ? 'Password: ' + result.password + ' • ' : ''}Expires: ${new Date(result.expiresAt).toLocaleDateString()}`,
						duration: 5000,
					});
				} else {
					toast.success('Share link created and copied to clipboard!', {
						description: `${result.password ? 'Password: ' + result.password + ' • ' : ''}Expires: ${new Date(result.expiresAt).toLocaleDateString()}`,
						duration: 5000,
					});
				}

				// Update the local state to include the new share link
				setCommunities((prev) =>
					prev.map((community) =>
						community.id === communityId
							? {
									...community,
									memberDirectories: [
										...community.memberDirectories,
										{
											id: result.shareId,
											password: result.password,
											expiresAt: result.expiresAt,
											createdAt: new Date().toISOString(),
										},
									],
								}
							: community
					)
				);
			} else {
				const error = await response.json();
				toast.error('Failed to create share link', {
					description: error.error || 'Please try again',
				});
			}
		} catch (error) {
			console.error('Error creating share link:', error);
			toast.error('Failed to create share link. Please try again.');
		}
	};

	if (isLoading) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
			</div>
		);
	}

	if (!user) {
		return null;
	}

	const totalAnalyses = communities.reduce((sum, community) => sum + community._count.chatAnalyses, 0);
	const totalSharedDirectories = communities.reduce((sum, community) => sum + community.memberDirectories.length, 0);

	return (
		<div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
			{/* Subtle Animated Background */}
			<div className='absolute inset-0 overflow-hidden pointer-events-none'>
				<div className='absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse'></div>
				<div className='absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000'></div>
			</div>

			<div className='relative z-10 bg-white/80 backdrop-blur-sm border-b border-white/50'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-3 sm:gap-0'>
						<div className='flex items-center space-x-3'>
							<div className='w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-400 rounded-lg flex items-center justify-center'>
								<MessageCircle className='w-5 h-5 text-white' />
							</div>
							<div>
								<h1 className='text-xl sm:text-2xl font-bold text-gray-900'>Dashboard</h1>
								<p className='text-sm text-gray-600'>Welcome back, {user.name}</p>
							</div>
						</div>
						<div className='flex space-x-2'>
							<Button onClick={handleSignOut} variant='outline' size='sm' className='sm:size-default'>
								Sign Out
							</Button>
						</div>
					</div>
				</div>
			</div>

			<div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				<div className='grid grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8'>
					<Card className='bg-white/70 backdrop-blur-sm border-white/60 shadow-lg hover:shadow-xl transition-all duration-200'>
						<CardContent className='p-3 md:p-6'>
							<div className='flex flex-col md:flex-row items-center md:items-start'>
								<Users className='h-6 w-6 md:h-8 md:w-8 text-blue-600 mb-2 md:mb-0' />
								<div className='md:ml-4 text-center md:text-left'>
									<p className='text-xs md:text-sm font-medium text-gray-600'>Communities</p>
									<p className='text-lg md:text-2xl font-bold text-gray-900'>{communities.length}</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className='bg-white/70 backdrop-blur-sm border-white/60 shadow-lg hover:shadow-xl transition-all duration-200'>
						<CardContent className='p-3 md:p-6'>
							<div className='flex flex-col md:flex-row items-center md:items-start'>
								<FileText className='h-6 w-6 md:h-8 md:w-8 text-green-600 mb-2 md:mb-0' />
								<div className='md:ml-4 text-center md:text-left'>
									<p className='text-xs md:text-sm font-medium text-gray-600'>Analyses</p>
									<p className='text-lg md:text-2xl font-bold text-gray-900'>{totalAnalyses}</p>
									<p className='text-xs text-gray-500 mt-1 hidden md:block'>{totalAnalyses < 3 ? `${3 - totalAnalyses} remaining` : 'Limit reached'}</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className='bg-white/70 backdrop-blur-sm border-white/60 shadow-lg hover:shadow-xl transition-all duration-200'>
						<CardContent className='p-3 md:p-6'>
							<div className='flex flex-col md:flex-row items-center md:items-start'>
								<Share2 className='h-6 w-6 md:h-8 md:w-8 text-purple-600 mb-2 md:mb-0' />
								<div className='md:ml-4 text-center md:text-left'>
									<p className='text-xs md:text-sm font-medium text-gray-600'>Shared</p>
									<p className='text-lg md:text-2xl font-bold text-gray-900'>{totalSharedDirectories}</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className='space-y-4 sm:space-y-6'>
					<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0'>
						<h2 className='text-lg sm:text-xl font-semibold text-gray-900'>Your Communities</h2>
						{communities.length >= 10 ? (
							<Button disabled variant='outline' size='sm' className='cursor-not-allowed text-xs sm:text-sm'>
								<Plus className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
								<span className='hidden sm:inline'>Community </span>Limit Reached
							</Button>
						) : (
							<Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
								<DialogTrigger asChild>
									<Button size='sm' className='text-xs sm:text-sm'>
										<Plus className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
										<span className='hidden sm:inline'>Create </span>Community
									</Button>
								</DialogTrigger>
								<DialogContent className='sm:max-w-lg'>
									<DialogHeader>
										<DialogTitle>Create New Community</DialogTitle>
										<DialogDescription>Create a community to organize your WhatsApp chat analyses and share insights with others.</DialogDescription>
									</DialogHeader>
									<div className='space-y-4 py-4'>
										<div>
											<label className='text-sm font-medium text-gray-700 mb-2 block'>Community Name *</label>
											<Input
												value={newCommunity.name}
												onChange={(e) => setNewCommunity((prev) => ({ ...prev, name: e.target.value }))}
												placeholder='Enter community name'
											/>
										</div>
										<div>
											<label className='text-sm font-medium text-gray-700 mb-2 block'>Description (optional)</label>
											<Textarea
												value={newCommunity.description}
												onChange={(e) => setNewCommunity((prev) => ({ ...prev, description: e.target.value }))}
												placeholder='Describe your community'
												rows={3}
											/>
										</div>
									</div>
									<DialogFooter>
										<Button variant='outline' onClick={() => setIsCreateModalOpen(false)}>
											Cancel
										</Button>
										<Button onClick={handleCreateCommunity}>Create Community</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						)}
					</div>

					{communities.length === 0 ? (
						<Card className='bg-white/70 backdrop-blur-sm border-white/60 shadow-lg'>
							<CardContent className='p-6 sm:p-12 text-center'>
								<Users className='mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400' />
								<h3 className='mt-4 text-base sm:text-lg font-medium text-gray-900'>No communities yet</h3>
								<p className='mt-2 text-sm text-gray-600'>Create your first community to start organizing your WhatsApp chat analyses.</p>
								<div className='mt-4 sm:mt-6'>
									<Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
										<DialogTrigger asChild>
											<Button size='sm' className='text-xs sm:text-sm'>
												<Plus className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
												Create Your First Community
											</Button>
										</DialogTrigger>
										<DialogContent className='sm:max-w-lg'>
											<DialogHeader>
												<DialogTitle>Create New Community</DialogTitle>
												<DialogDescription>Create a community to organize your WhatsApp chat analyses and share insights with others.</DialogDescription>
											</DialogHeader>
											<div className='space-y-4 py-4'>
												<div>
													<label className='text-sm font-medium text-gray-700 mb-2 block'>Community Name *</label>
													<Input
														value={newCommunity.name}
														onChange={(e) => setNewCommunity((prev) => ({ ...prev, name: e.target.value }))}
														placeholder='Enter community name'
													/>
												</div>
												<div>
													<label className='text-sm font-medium text-gray-700 mb-2 block'>Description (optional)</label>
													<Textarea
														value={newCommunity.description}
														onChange={(e) => setNewCommunity((prev) => ({ ...prev, description: e.target.value }))}
														placeholder='Describe your community'
														rows={3}
													/>
												</div>
											</div>
											<DialogFooter>
												<Button variant='outline' onClick={() => setIsCreateModalOpen(false)}>
													Cancel
												</Button>
												<Button onClick={handleCreateCommunity}>Create Community</Button>
											</DialogFooter>
										</DialogContent>
									</Dialog>
								</div>
							</CardContent>
						</Card>
					) : (
						<div className='space-y-4'>
							<div className='grid gap-4'>
								{communities.map((community) => (
									<Card key={community.id} className='bg-white/70 backdrop-blur-sm border-white/60 shadow-lg hover:shadow-xl transition-all duration-200'>
										<CardContent className='p-0'>
											<Collapsible open={openCommunities[community.id] || false} onOpenChange={() => toggleCommunity(community.id)}>
												<div className='p-4 sm:p-6 cursor-pointer' onClick={() => toggleCommunity(community.id)}>
													<div className='flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0'>
														<div className='flex-1 min-w-0 w-full sm:w-auto'>
															<div className='flex items-center space-x-2 mb-2'>
																<h3 className='font-semibold text-base sm:text-lg text-gray-900 truncate'>{community.name}</h3>
																<div className='ml-2 flex-shrink-0'>
																	{openCommunities[community.id] ? (
																		<ChevronDown className='w-4 h-4 text-gray-400' />
																	) : (
																		<ChevronRight className='w-4 h-4 text-gray-400' />
																	)}
																</div>
															</div>
															{community.description && <p className='text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2'>{community.description}</p>}
															<div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500'>
																<div className='flex items-center gap-3 sm:gap-4'>
																	<span className='flex items-center'>
																		<FileText className='w-3 h-3 sm:w-4 sm:h-4 mr-1' />
																		{community._count.chatAnalyses} analyses
																	</span>
																	<span className='flex items-center'>
																		<Calendar className='w-3 h-3 sm:w-4 sm:h-4 mr-1' />
																		<span className='hidden sm:inline'>Created </span>
																		{new Date(community.createdAt).toLocaleDateString()}
																	</span>
																</div>
																{community.memberDirectories.length > 0 && (
																	<div className='flex items-center gap-2'>
																		<Share2 className='w-3 h-3 sm:w-4 sm:h-4 text-blue-600' />
																		<button
																			onClick={(e) => {
																				e.stopPropagation();
																				handleOpenShareMessage(community.memberDirectories[0], community.name);
																			}}
																			className='text-blue-600 hover:text-blue-800 hover:underline transition-colors text-xs sm:text-sm'>
																			Share with community
																		</button>
																		{community.memberDirectories[0].password && (
																			<div className='flex items-center gap-1'>
																				<span className='text-xs flex flex-row items-center gap-1 sm:gap-2 bg-gray-100 text-gray-700 px-1.5 sm:px-2 py-1 rounded font-mono'>
																					{showPasswords[community.memberDirectories[0].id]
																						? community.memberDirectories[0].password
																						: '•'.repeat(Math.min(community.memberDirectories[0].password.length, 4))}
																					<CopyButton
																						text={community.memberDirectories[0].password}
																						size='icon'
																						className='h-3 w-3 sm:h-4 sm:w-4 p-0 border-none bg-transparent'
																					/>
																				</span>
																				<button
																					onClick={(e) => {
																						e.stopPropagation();
																						togglePasswordVisibility(community.memberDirectories[0].id);
																					}}
																					className='text-gray-500 hover:text-gray-700 transition-colors p-0.5 sm:p-1'>
																					{showPasswords[community.memberDirectories[0].id] ? (
																						<EyeOff className='w-3 h-3' />
																					) : (
																						<Eye className='w-3 h-3' />
																					)}
																				</button>
																			</div>
																		)}
																	</div>
																)}
															</div>
														</div>
														<div className='flex flex-col sm:flex-row gap-2 sm:space-x-2 w-full sm:w-auto' onClick={(e) => e.stopPropagation()}>
															<div className='flex gap-2 sm:gap-0 sm:space-x-2'>
																<Button
																	variant='outline'
																	size='sm'
																	onClick={() => router.push(`/dashboard/community/${community.id}`)}
																	className='text-xs flex-1 sm:flex-initial'>
																	<Eye className='w-3 h-3 sm:w-4 sm:h-4 mr-1' />
																	View
																</Button>
																{community.memberDirectories.length > 0 ? (
																	<Button
																		size='sm'
																		onClick={() => handleShareCommunity(community.id, community.memberDirectories[0])}
																		className='text-xs flex-1 sm:flex-initial'>
																		<Share2 className='w-3 h-3 sm:w-4 sm:h-4 mr-1' />
																		<span className='hidden sm:inline'>Copy Directory </span>Link
																	</Button>
																) : (
																	<Button size='sm' onClick={() => handleShareCommunity(community.id)} className='text-xs flex-1 sm:flex-initial'>
																		<Share2 className='w-3 h-3 sm:w-4 sm:h-4 mr-1' />
																		<span className='hidden sm:inline'>Create </span>Directory
																	</Button>
																)}
															</div>
															<DropdownMenu>
																<DropdownMenuTrigger asChild>
																	<Button variant='outline' size='sm' className='w-full sm:w-auto'>
																		<MoreVertical className='w-3 h-3 sm:w-4 sm:h-4' />
																		<span className='ml-1 sm:hidden text-xs'>More</span>
																	</Button>
																</DropdownMenuTrigger>
																<DropdownMenuContent align='end'>
																	{community.memberDirectories.length > 0 && (
																		<>
																			{community.memberDirectories[0].password ? (
																				<DropdownMenuItem
																					onClick={() => handleRemovePassword(community.id, community.memberDirectories[0].id)}>
																					<LockOpen className='w-4 h-4 mr-2' />
																					Remove Password
																				</DropdownMenuItem>
																			) : (
																				<DropdownMenuItem
																					onClick={() => handleAddPassword(community.id, community.memberDirectories[0].id)}>
																					<Lock className='w-4 h-4 mr-2' />
																					Add Password
																				</DropdownMenuItem>
																			)}
																		</>
																	)}
																	<DropdownMenuItem
																		onClick={() => handleDeleteCommunity(community.id)}
																		className='text-red-600 focus:text-red-600'>
																		<Trash2 className='w-4 h-4 mr-2' />
																		Delete Community
																	</DropdownMenuItem>
																</DropdownMenuContent>
															</DropdownMenu>
														</div>
													</div>
												</div>
												<CollapsibleContent>
													<div className='px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-100'>
														<div className='pt-3 sm:pt-4'>
															<h4 className='text-sm font-medium text-gray-900 mb-3'>Chat Analyses ({community.chatAnalyses.length})</h4>
															{community.chatAnalyses.length === 0 ? (
																<div className='text-center py-6 sm:py-8 text-gray-500'>
																	<FileText className='mx-auto h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mb-2' />
																	<p className='text-xs sm:text-sm'>No analyses yet</p>
																	<p className='text-xs'>Upload your first WhatsApp chat export to this community</p>
																</div>
															) : (
																<div className='space-y-2 sm:space-y-3'>
																	{community.chatAnalyses.map((analysis) => (
																		<div
																			key={analysis.id}
																			className='flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2 sm:gap-0'>
																			<div className='flex-1 min-w-0'>
																				<p className='font-medium text-xs sm:text-sm text-gray-900 truncate'>{analysis.title}</p>
																				<div className='flex items-center space-x-2 sm:space-x-4 text-xs text-gray-500 mt-1'>
																					<span>{analysis.totalMessages.toLocaleString()} msgs</span>
																					<span>{analysis.totalMembers} members</span>
																					<span className='hidden sm:inline'>{new Date(analysis.createdAt).toLocaleDateString()}</span>
																				</div>
																			</div>
																			<Button
																				variant='outline'
																				size='sm'
																				onClick={() => router.push(`/dashboard/community/${community.id}/analysis/${analysis.id}`)}
																				className='text-xs w-full sm:w-auto'>
																				<Eye className='w-3 h-3 mr-1' />
																				View
																			</Button>
																		</div>
																	))}
																</div>
															)}
														</div>
													</div>
												</CollapsibleContent>
											</Collapsible>
										</CardContent>
									</Card>
								))}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Share Message Modal */}
			<Dialog open={shareMessageModal.open} onOpenChange={(open) => setShareMessageModal({ open, directory: null, communityName: '' })}>
				<DialogContent className='sm:max-w-lg max-w-[95vw] w-full mx-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200'>
					<DialogHeader>
						<DialogTitle>Share Directory Message</DialogTitle>
						<DialogDescription>Copy this message to share the &quot;{shareMessageModal.communityName}&quot; member directory with others.</DialogDescription>
					</DialogHeader>
					<div className='py-4'>
						<div className='bg-gray-50 rounded-lg border'>
							<p className='text-sm p-1 text-gray-900 leading-relaxed'>{generateShareMessage()}</p>
						</div>
					</div>
					<DialogFooter>
						<Button variant='outline' onClick={() => setShareMessageModal({ open: false, directory: null, communityName: '' })}>
							Cancel
						</Button>
						<Button onClick={handleCopyShareMessage}>Copy Message</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
