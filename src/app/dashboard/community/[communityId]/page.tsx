'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, ArrowLeft, Plus, Settings, ExternalLink, ClipboardList, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useUpdateCommunity } from '@/hooks/communities/useCommunity';
import { useDeleteCommunity, type Community } from '@/hooks/communities/useCommunities';

interface FormQuestion {
	id: string;
	label: string;
	type: string;
	required: boolean;
	placeholder?: string;
	options?: string[];
}

interface ApplicationForm {
	id: string;
	title: string;
	customSlug: string;
	isActive: boolean;
	isPublic: boolean;
	createdAt: string;
	questions?: FormQuestion[];
	_count?: {
		applications: number;
	};
}

interface MemberDirectory {
	id: string;
	password?: string;
	isActive: boolean;
	visibleFields?: Record<string, boolean>;
}

function CommunityPageContent() {
	const [community, setCommunity] = useState<Community | null>(null);
	const [applicationForm, setApplicationForm] = useState<ApplicationForm | null>(null);
	const [memberDirectory, setMemberDirectory] = useState<MemberDirectory | null>(null);
	const [loading, setLoading] = useState(true);
	const [isCreateDirectoryModalOpen, setIsCreateDirectoryModalOpen] = useState(false);
	const [directoryPassword, setDirectoryPassword] = useState('');
	const [isCreatingDirectory, setIsCreatingDirectory] = useState(false);
	const [isEditDirectoryModalOpen, setIsEditDirectoryModalOpen] = useState(false);
	const [editDirectoryPassword, setEditDirectoryPassword] = useState('');
	const [isUpdatingDirectory, setIsUpdatingDirectory] = useState(false);
	const [fieldVisibility, setFieldVisibility] = useState<Record<string, boolean>>({
		name: true,
		email: true,
		linkedin: false,
		phone: false,
	});
	// Community settings state
	const [isRenameCommunityModalOpen, setIsRenameCommunityModalOpen] = useState(false);
	const [newCommunityName, setNewCommunityName] = useState('');
	const [isDeleteCommunityModalOpen, setIsDeleteCommunityModalOpen] = useState(false);
	const [deleteConfirmationName, setDeleteConfirmationName] = useState('');
	const router = useRouter();
	const params = useParams();
	const communityId = params.communityId as string;

	// React Query mutations
	const updateCommunityMutation = useUpdateCommunity();
	const deleteCommunityMutation = useDeleteCommunity();

	useEffect(() => {
		const loadData = async () => {
			try {
				// Load community
				const communityResponse = await fetch(`/api/communities/${communityId}`);
				if (communityResponse.ok) {
					const result = await communityResponse.json();
					setCommunity(result.community);

					// Set application form if it exists
					if (result.community.applicationForm) {
						setApplicationForm(result.community.applicationForm);
					}

					// Set member directory if it exists (API already filters for active directories)
					if (result.community.memberDirectories && result.community.memberDirectories.length > 0) {
						console.log('Loading member directory:', result.community.memberDirectories[0]);
						setMemberDirectory(result.community.memberDirectories[0]);
					} else {
						console.log('No member directories found in API response');
						setMemberDirectory(null);
					}
				} else {
					console.error('Failed to load community');
					router.push('/dashboard');
					return;
				}
			} catch (error) {
				console.error('Error loading data:', error);
				router.push('/dashboard');
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, [router, communityId]);

	const handleBackToDashboard = () => {
		router.push('/dashboard');
	};

	const handleCreateDirectory = async () => {
		setIsCreatingDirectory(true);
		try {
			const response = await fetch('/api/directory/share', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					communityId,
					password: directoryPassword.trim() || null,
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to create directory');
			}

			// Update local state with the new directory
			setMemberDirectory({
				id: result.shareId,
				password: result.password || null,
				isActive: true,
				visibleFields: result.visibleFields || {
					name: true,
					email: true,
					linkedin: false,
					phone: false,
				},
			});

			// Close modal and reset password
			setIsCreateDirectoryModalOpen(false);
			setDirectoryPassword('');

			toast.success(result.isExisting ? 'Directory link retrieved successfully' : 'Member directory created successfully');
		} catch (error) {
			console.error('Error creating directory:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to create directory');
		} finally {
			setIsCreatingDirectory(false);
		}
	};

	const handleUpdateDirectory = async () => {
		if (!memberDirectory) return;

		setIsUpdatingDirectory(true);
		try {
			const response = await fetch(`/api/directory/${memberDirectory.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					password: editDirectoryPassword.trim() || null,
					visibleFields: fieldVisibility,
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to update directory');
			}

			// Update local state
			setMemberDirectory({
				...memberDirectory,
				password: result.password || null,
				visibleFields: result.visibleFields,
			});

			// Close modal and reset password
			setIsEditDirectoryModalOpen(false);
			setEditDirectoryPassword('');

			toast.success('Directory settings updated successfully');
		} catch (error) {
			console.error('Error updating directory:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to update directory');
		} finally {
			setIsUpdatingDirectory(false);
		}
	};

	const handleDeleteDirectory = async () => {
		if (!memberDirectory) return;

		if (!confirm('Are you sure you want to delete this member directory? This will make the public link inaccessible.')) {
			return;
		}

		try {
			const response = await fetch(`/api/directory/${memberDirectory.id}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				const result = await response.json();
				throw new Error(result.error || 'Failed to delete directory');
			}

			// Update local state
			setMemberDirectory(null);

			toast.success('Member directory deleted successfully');
		} catch (error) {
			console.error('Error deleting directory:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to delete directory');
		}
	};

	const handleEditDirectory = () => {
		if (memberDirectory) {
			setEditDirectoryPassword(memberDirectory.password || '');
			const currentVisibility = (memberDirectory.visibleFields as Record<string, boolean>) || {
				name: true,
				email: true,
				linkedin: false,
				phone: false,
			};
			setFieldVisibility(currentVisibility);
			setIsEditDirectoryModalOpen(true);
		}
	};

	const handleDeleteApplicationForm = async () => {
		if (!applicationForm) return;

		if (!confirm('Are you sure you want to delete this application form? This will also delete all submitted applications. This action cannot be undone.')) {
			return;
		}

		try {
			const response = await fetch(`/api/communities/${communityId}/form`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				const result = await response.json();
				throw new Error(result.error || 'Failed to delete application form');
			}

			// Update local state
			setApplicationForm(null);

			toast.success('Application form deleted successfully');
		} catch (error) {
			console.error('Error deleting application form:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to delete application form');
		}
	};

	const handleRenameCommunity = async () => {
		if (!community || !newCommunityName.trim()) return;

		try {
			const updatedCommunity = await updateCommunityMutation.mutateAsync({
				id: communityId,
				name: newCommunityName.trim(),
			});

			setCommunity(updatedCommunity);
			setIsRenameCommunityModalOpen(false);
			setNewCommunityName('');
			toast.success('Community renamed successfully');
		} catch (error) {
			console.error('Error renaming community:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to rename community');
		}
	};

	const handleDeleteCommunity = async () => {
		if (!community || deleteConfirmationName !== community.name) return;

		try {
			await deleteCommunityMutation.mutateAsync(communityId);
			toast.success('Community deleted successfully');
			router.push('/dashboard');
		} catch (error) {
			console.error('Error deleting community:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to delete community');
		}
	};

	const handleOpenRenameModal = () => {
		if (community) {
			setNewCommunityName(community.name);
			setIsRenameCommunityModalOpen(true);
		}
	};

	const handleOpenDeleteModal = () => {
		setDeleteConfirmationName('');
		setIsDeleteCommunityModalOpen(true);
	};

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
			</div>
		);
	}

	if (!community) {
		return (
			<div className='min-h-screen flex items-center justify-center px-4'>
				<Card className='w-full max-w-md bg-white/70 backdrop-blur-sm border-white/60 shadow-lg'>
					<CardContent className='p-6 sm:p-8 text-center'>
						<h2 className='text-lg sm:text-xl font-semibold mb-4'>Community Not Found</h2>
						<p className='text-sm sm:text-base text-gray-600 mb-4'>The requested community could not be found.</p>
						<Button onClick={handleBackToDashboard} size='sm' className='text-xs sm:text-sm'>
							<ArrowLeft className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
							Back to Dashboard
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Public Links Section */}
			{(applicationForm || memberDirectory || (!applicationForm && !memberDirectory && community)) && (
				<Card className='bg-white/70 backdrop-blur-sm border-white/60 shadow-lg mb-6'>
					<CardContent className='p-4'>
						<div className='flex items-center justify-between mb-3'>
							<h2 className='text-base font-semibold text-gray-900'>Public Links</h2>
							<Badge variant='secondary' className='text-xs'>
								Shareable
							</Badge>
						</div>
						<div className='space-y-3'>
							{applicationForm && (
								<div className='flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200'>
									<div className='flex items-center space-x-3'>
										<div
											className={`w-8 h-8 rounded-full flex items-center justify-center ${
												applicationForm.isActive && applicationForm.isPublic ? 'bg-blue-100' : 'bg-gray-200'
											}`}>
											<ClipboardList className={`w-4 h-4 ${applicationForm.isActive && applicationForm.isPublic ? 'text-blue-600' : 'text-gray-500'}`} />
										</div>
										<div className='flex-1'>
											<div className='flex items-center gap-2'>
												<h3 className='font-medium text-gray-900 text-sm'>Application Form</h3>
												{(!applicationForm.isActive || !applicationForm.isPublic) && (
													<Badge variant='secondary' className='text-xs'>
														{!applicationForm.isActive ? 'Inactive' : 'Private'}
													</Badge>
												)}
											</div>
											<p className='text-xs text-gray-500'>
												{applicationForm.isActive && applicationForm.isPublic ? 'Public form' : 'Currently unavailable'}
											</p>
										</div>
									</div>
									<div className='flex gap-1'>
										<Button variant='ghost' size='sm' onClick={() => window.open(`/apply/${applicationForm.customSlug}`, '_blank')} className='h-8 w-8 p-0'>
											<ExternalLink className='w-4 h-4' />
										</Button>
										<Button variant='ghost' size='sm' onClick={() => router.push(`/dashboard/community/${communityId}/form-builder`)} className='h-8 w-8 p-0'>
											<Edit className='w-4 h-4' />
										</Button>
										<Button variant='ghost' size='sm' onClick={handleDeleteApplicationForm} className='h-8 w-8 p-0 text-red-600 hover:text-red-700'>
											<Trash2 className='w-4 h-4' />
										</Button>
									</div>
								</div>
							)}
							{memberDirectory && (
								<div className='flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200'>
									<div className='flex items-center space-x-3'>
										<div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
											<Users className='w-4 h-4 text-green-600' />
										</div>
										<div className='flex-1'>
											<h3 className='font-medium text-gray-900 text-sm'>Member Directory</h3>
											<p className='text-xs text-gray-500'>{memberDirectory.password ? 'Password protected' : 'Public access'}</p>
										</div>
									</div>
									<div className='flex gap-1'>
										<Button variant='ghost' size='sm' onClick={() => window.open(`/directory/${memberDirectory.id}`, '_blank')} className='h-8 w-8 p-0'>
											<ExternalLink className='w-4 h-4' />
										</Button>
										<Button variant='ghost' size='sm' onClick={handleEditDirectory} className='h-8 w-8 p-0'>
											<Edit className='w-4 h-4' />
										</Button>
										<Button variant='ghost' size='sm' onClick={handleDeleteDirectory} className='h-8 w-8 p-0 text-red-600 hover:text-red-700'>
											<Trash2 className='w-4 h-4' />
										</Button>
									</div>
								</div>
							)}
							{!memberDirectory && community && (
								<div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200'>
									<div className='flex items-center space-x-3'>
										<div className='w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center'>
											<Users className='w-4 h-4 text-gray-600' />
										</div>
										<div className='flex-1'>
											<h3 className='font-medium text-gray-700 text-sm'>Member Directory</h3>
											<p className='text-xs text-gray-500'>Create shareable directory</p>
										</div>
									</div>
									<Dialog open={isCreateDirectoryModalOpen} onOpenChange={setIsCreateDirectoryModalOpen}>
										<DialogTrigger asChild>
											<Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
												<Plus className='w-4 h-4' />
											</Button>
										</DialogTrigger>
										<DialogContent className='sm:max-w-lg'>
											<DialogHeader>
												<DialogTitle>Create Member Directory</DialogTitle>
												<DialogDescription>
													Create a shareable public link for your community member directory. This will show members from your chat analyses.
												</DialogDescription>
											</DialogHeader>
											<div className='space-y-4 py-4'>
												<div className='space-y-2'>
													<label htmlFor='directory-password' className='text-sm font-medium'>
														Password (Optional)
													</label>
													<Input
														id='directory-password'
														type='password'
														placeholder='Leave empty for no password protection'
														value={directoryPassword}
														onChange={(e) => setDirectoryPassword(e.target.value)}
													/>
													<p className='text-xs text-gray-500'>Add a password to restrict access to your member directory</p>
												</div>
												<div className='bg-blue-50 p-3 rounded-lg'>
													<p className='text-sm text-blue-800'>
														<strong>What&apos;s included:</strong> Member names, message counts, and activity data from your uploaded chat analyses
													</p>
												</div>
											</div>
											<div className='flex justify-end gap-2'>
												<Button
													variant='outline'
													onClick={() => {
														setIsCreateDirectoryModalOpen(false);
														setDirectoryPassword('');
													}}
													disabled={isCreatingDirectory}>
													Cancel
												</Button>
												<Button onClick={handleCreateDirectory} disabled={isCreatingDirectory}>
													{isCreatingDirectory ? (
														<>
															<div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
															Creating...
														</>
													) : (
														<>
															<Users className='w-4 h-4 mr-2' />
															Create Directory
														</>
													)}
												</Button>
											</div>
										</DialogContent>
									</Dialog>
								</div>
							)}
							{!applicationForm && (
								<div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200'>
									<div className='flex items-center space-x-3'>
										<div className='w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center'>
											<ClipboardList className='w-4 h-4 text-gray-600' />
										</div>
										<div className='flex-1'>
											<h3 className='font-medium text-gray-700 text-sm'>Application Form</h3>
											<p className='text-xs text-gray-500'>Create application form</p>
										</div>
									</div>
									<Button variant='ghost' size='sm' onClick={() => router.push(`/dashboard/community/${communityId}/form-builder`)} className='h-8 w-8 p-0'>
										<Plus className='w-4 h-4' />
									</Button>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Community Overview */}
			<Card className='bg-white/70 backdrop-blur-sm border-white/60 shadow-lg'>
				<CardContent className='p-6'>
					<h2 className='text-xl font-semibold text-gray-900 mb-4'>Overview</h2>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
						<div className='text-center p-4 bg-blue-50 rounded-lg'>
							<div className='text-2xl font-bold text-blue-600'>{community._count.chatAnalyses}</div>
							<div className='text-sm text-blue-700'>Chat Analyses</div>
						</div>
						<div className='text-center p-4 bg-green-50 rounded-lg'>
							<div className='text-2xl font-bold text-green-600'>{applicationForm?._count?.applications || 0}</div>
							<div className='text-sm text-green-700'>Form Applications</div>
						</div>
						<div className='text-center p-4 bg-purple-50 rounded-lg'>
							<div className='text-2xl font-bold text-purple-600'>{memberDirectory ? 1 : 0}</div>
							<div className='text-sm text-purple-700'>Member Directories</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Edit Directory Modal */}
			<Dialog open={isEditDirectoryModalOpen} onOpenChange={setIsEditDirectoryModalOpen}>
				<DialogContent className='sm:max-w-lg'>
					<DialogHeader>
						<DialogTitle>Edit Directory Settings</DialogTitle>
						<DialogDescription>Update the password and field visibility settings for your member directory.</DialogDescription>
					</DialogHeader>
					<div className='space-y-4 py-4'>
						<div className='space-y-2'>
							<label htmlFor='edit-directory-password' className='text-sm font-medium'>
								Password
							</label>
							<Input
								id='edit-directory-password'
								type='password'
								placeholder='Leave empty to remove password protection'
								value={editDirectoryPassword}
								onChange={(e) => setEditDirectoryPassword(e.target.value)}
							/>
							<p className='text-xs text-gray-500'>
								{editDirectoryPassword.trim()
									? 'Visitors will need this password to view the directory'
									: 'Directory will be publicly accessible without a password'}
							</p>
						</div>

						{/* Field Visibility Settings */}
						<div className='space-y-3'>
							<div className='space-y-2'>
								<label className='text-sm font-medium'>Member Information Visibility</label>
								<p className='text-xs text-gray-500'>Choose which member information to display in the public directory</p>
							</div>
							<div className='space-y-3'>
								{[
									{ key: 'name', label: 'Name', description: 'Display member names' },
									{ key: 'email', label: 'Email', description: 'Display email addresses' },
									{ key: 'linkedin', label: 'LinkedIn', description: 'Display LinkedIn profiles' },
									{ key: 'phone', label: 'Phone', description: 'Display phone numbers' },
								].map((field) => (
									<div key={field.key} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
										<div className='flex items-center space-x-3'>
											{fieldVisibility[field.key] ? <Eye className='w-4 h-4 text-green-600' /> : <EyeOff className='w-4 h-4 text-gray-400' />}
											<div>
												<p className='text-sm font-medium text-gray-900'>{field.label}</p>
												<p className='text-xs text-gray-500'>{field.description}</p>
											</div>
										</div>
										<Button
											variant={fieldVisibility[field.key] ? 'default' : 'outline'}
											size='sm'
											onClick={() =>
												setFieldVisibility((prev) => ({
													...prev,
													[field.key]: !prev[field.key],
												}))
											}>
											{fieldVisibility[field.key] ? 'Visible' : 'Hidden'}
										</Button>
									</div>
								))}
							</div>
						</div>
						{memberDirectory && (
							<div className='bg-blue-50 p-3 rounded-lg'>
								<p className='text-sm text-blue-800'>
									<strong>Current status:</strong> {memberDirectory.password ? 'Password protected' : 'Public access'}
								</p>
							</div>
						)}
					</div>
					<div className='flex justify-end gap-2'>
						<Button
							variant='outline'
							onClick={() => {
								setIsEditDirectoryModalOpen(false);
								setEditDirectoryPassword('');
							}}
							disabled={isUpdatingDirectory}>
							Cancel
						</Button>
						<Button onClick={handleUpdateDirectory} disabled={isUpdatingDirectory}>
							{isUpdatingDirectory ? (
								<>
									<div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
									Updating...
								</>
							) : (
								<>
									<Settings className='w-4 h-4 mr-2' />
									Update Settings
								</>
							)}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Community Settings Section */}
			<Card className='bg-white/70 backdrop-blur-sm border-white/60 shadow-lg'>
				<CardContent className='p-6'>
					<h2 className='text-xl font-semibold text-gray-900 mb-4'>Settings</h2>
					<div className='space-y-4'>
						{/* Rename Community */}
						<div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200'>
							<div>
								<h3 className='font-medium text-gray-900'>Name</h3>
								<p className='text-sm text-gray-600'>Current name: {community?.name}</p>
							</div>
							<Button variant='outline' onClick={handleOpenRenameModal}>
								<Edit className='w-4 h-4 mr-2' />
								Rename
							</Button>
						</div>

						{/* Delete Community */}
						<div className='flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200'>
							<div>
								<h3 className='font-medium text-red-900'>Delete Community</h3>
								<p className='text-sm text-red-600'>This action cannot be undone. All data will be permanently deleted.</p>
							</div>
							<Button variant='outline' onClick={handleOpenDeleteModal} className='text-red-600 hover:text-red-700 hover:border-red-300'>
								<Trash2 className='w-4 h-4 mr-2' />
								Delete
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Rename Community Modal */}
			<Dialog open={isRenameCommunityModalOpen} onOpenChange={setIsRenameCommunityModalOpen}>
				<DialogContent className='sm:max-w-lg'>
					<DialogHeader>
						<DialogTitle>Rename Community</DialogTitle>
						<DialogDescription>Enter a new name for your community. This will update the name everywhere it appears.</DialogDescription>
					</DialogHeader>
					<div className='space-y-4 py-4'>
						<div>
							<label htmlFor='community-name' className='text-sm font-medium'>
								Name
							</label>
							<Input
								id='community-name'
								value={newCommunityName}
								onChange={(e) => setNewCommunityName(e.target.value)}
								placeholder='Enter new community name'
								className='mt-1'
								disabled={updateCommunityMutation.isPending}
							/>
						</div>
					</div>
					<div className='flex justify-end gap-2'>
						<Button
							variant='outline'
							onClick={() => {
								setIsRenameCommunityModalOpen(false);
								setNewCommunityName('');
							}}
							disabled={updateCommunityMutation.isPending}>
							Cancel
						</Button>
						<Button onClick={handleRenameCommunity} disabled={updateCommunityMutation.isPending || !newCommunityName.trim() || newCommunityName === community?.name}>
							{updateCommunityMutation.isPending ? (
								<>
									<div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
									Renaming...
								</>
							) : (
								<>
									<Edit className='w-4 h-4 mr-2' />
									Rename Community
								</>
							)}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Delete Community Modal */}
			<Dialog open={isDeleteCommunityModalOpen} onOpenChange={setIsDeleteCommunityModalOpen}>
				<DialogContent className='sm:max-w-lg'>
					<DialogHeader>
						<DialogTitle>Delete Community</DialogTitle>
						<DialogDescription>
							This action cannot be undone. This will permanently delete the community, all its data, chat analyses, forms, and applications.
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-4 py-4'>
						<div className='bg-red-50 p-3 rounded-lg border border-red-200'>
							<p className='text-sm text-red-800'>
								<strong>Warning:</strong> This will delete:
							</p>
							<ul className='text-sm text-red-700 mt-2 list-disc list-inside'>
								<li>All chat analyses and data</li>
								<li>Application forms and submissions</li>
								<li>Member directories</li>
								<li>All community settings</li>
							</ul>
						</div>
						<div>
							<label htmlFor='delete-confirmation' className='text-sm font-medium'>
								Type <strong>{community?.name}</strong> to confirm deletion
							</label>
							<Input
								id='delete-confirmation'
								value={deleteConfirmationName}
								onChange={(e) => setDeleteConfirmationName(e.target.value)}
								placeholder={community?.name}
								className='mt-1'
								disabled={deleteCommunityMutation.isPending}
							/>
						</div>
					</div>
					<div className='flex justify-end gap-2'>
						<Button
							variant='outline'
							onClick={() => {
								setIsDeleteCommunityModalOpen(false);
								setDeleteConfirmationName('');
							}}
							disabled={deleteCommunityMutation.isPending}>
							Cancel
						</Button>
						<Button variant='destructive' onClick={handleDeleteCommunity} disabled={deleteCommunityMutation.isPending || deleteConfirmationName !== community?.name}>
							{deleteCommunityMutation.isPending ? (
								<>
									<div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
									Deleting...
								</>
							) : (
								<>
									<Trash2 className='w-4 h-4 mr-2' />
									Delete Community
								</>
							)}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default function CommunityPage() {
	return (
		<Suspense
			fallback={
				<div className='flex items-center justify-center py-8'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
				</div>
			}>
			<CommunityPageContent />
		</Suspense>
	);
}
