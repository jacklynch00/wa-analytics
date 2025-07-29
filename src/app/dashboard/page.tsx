'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Users, Share2, Calendar, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { useCommunities, useCommunityStats } from '@/hooks';

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
		createdAt: string;
	}[];
	applicationForm?: {
		id: string;
		title: string;
		customSlug: string;
		isActive: boolean;
		isPublic: boolean;
		createdAt: string;
	};
	_count: {
		chatAnalyses: number;
	};
}

export default function DashboardPage() {
	const [user, setUser] = useState<{ name: string; email: string } | null>(null);
	const [authLoading, setAuthLoading] = useState(true);
	const [shareMessageModal, setShareMessageModal] = useState<{ open: boolean; directory: Community['memberDirectories'][0] | null; communityName: string }>({
		open: false,
		directory: null,
		communityName: '',
	});
	const router = useRouter();

	// Use new hooks for data fetching
	const { data: communities = [], isLoading: communitiesLoading } = useCommunities();
	const { totalCommunities, totalAnalyses, totalSharedDirectories } = useCommunityStats();

	useEffect(() => {
		const checkAuth = async () => {
			try {
				const session = await authClient.getSession();
				if (!session.data) {
					router.push('/sign-in');
					return;
				}
				setUser(session.data.user);
			} catch (error) {
				console.error('Auth check failed:', error);
				router.push('/sign-in');
			} finally {
				setAuthLoading(false);
			}
		};

		checkAuth();
	}, [router]);


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

	const handleShareApplication = async (applicationForm: Community['applicationForm']) => {
		if (!applicationForm) return;

		const applicationUrl = `${window.location.origin}/apply/${applicationForm.customSlug}`;

		try {
			await navigator.clipboard.writeText(applicationUrl);
			toast.success('Application form link copied to clipboard!', {
				description: `Status: ${applicationForm.isActive && applicationForm.isPublic ? 'Active & Public' : applicationForm.isActive ? 'Active but Private' : 'Inactive'}`,
				duration: 5000,
			});
		} catch (error) {
			console.error('Failed to copy application link:', error);
			toast.error('Failed to copy application link. Please try again.');
		}
	};

	const isLoading = authLoading || communitiesLoading;

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

	return (
		<div className='space-y-6'>
				<div className='grid grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8'>
					<Card className='bg-white/70 backdrop-blur-sm border-white/60 shadow-lg hover:shadow-xl transition-all duration-200'>
						<CardContent className='p-3 md:p-6'>
							<div className='flex flex-col md:flex-row items-center md:items-start'>
								<Users className='h-6 w-6 md:h-8 md:w-8 text-blue-600 mb-2 md:mb-0' />
								<div className='md:ml-4 text-center md:text-left'>
									<p className='text-xs md:text-sm font-medium text-gray-600'>Communities</p>
									<p className='text-lg md:text-2xl font-bold text-gray-900'>{totalCommunities}</p>
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
					</div>

					{communities.length === 0 ? (
						<Card className='bg-white/70 backdrop-blur-sm border-white/60 shadow-lg'>
							<CardContent className='p-6 sm:p-12 text-center'>
								<Users className='mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400' />
								<h3 className='mt-4 text-base sm:text-lg font-medium text-gray-900'>No communities yet</h3>
								<p className='mt-2 text-sm text-gray-600'>
									Create your first community using the <strong>+ button</strong> in the sidebar to start organizing your WhatsApp chat analyses.
								</p>
							</CardContent>
						</Card>
					) : (
						<div className='space-y-4'>
							<div className='grid gap-4'>
								{communities.map((community) => (
									<Card
										key={community.id}
										className='bg-white/70 backdrop-blur-sm border-white/60 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer'
										onClick={() => router.push(`/dashboard/community/${community.id}`)}>
										<CardContent className='p-4 sm:p-6'>
											<div className='flex items-center space-x-2 mb-2'>
												<h3 className='font-semibold text-base sm:text-lg text-gray-900 truncate'>{community.name}</h3>
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
												<div className='flex items-center gap-4'>
													{community.memberDirectories && community.memberDirectories.length > 0 && (
														<div className='flex items-center gap-2'>
															<Share2 className='w-3 h-3 sm:w-4 sm:h-4 text-blue-600' />
															<button
																onClick={(e) => {
																	e.stopPropagation();
																	handleOpenShareMessage(community.memberDirectories![0], community.name);
																}}
																className='text-blue-600 hover:text-blue-800 hover:underline transition-colors text-xs sm:text-sm'>
																Share directory
															</button>
														</div>
													)}
													{community.applicationForm && (
														<div className='flex items-center gap-2'>
															<ClipboardList className='w-3 h-3 sm:w-4 sm:h-4 text-green-600' />
															<button
																onClick={(e) => {
																	e.stopPropagation();
																	handleShareApplication(community.applicationForm);
																}}
																className='text-green-600 hover:text-green-800 hover:underline transition-colors text-xs sm:text-sm'>
																Share application
															</button>
														</div>
													)}
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Share Message Modal */}
				<Dialog open={shareMessageModal.open} onOpenChange={(open) => setShareMessageModal({ open, directory: null, communityName: '' })}>
					<DialogContent className='sm:max-w-lg max-w-[95vw] w-full mx-4'>
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
