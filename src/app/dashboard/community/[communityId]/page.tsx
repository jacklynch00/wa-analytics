'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Upload, FileText, Users, Calendar, ArrowLeft, Plus, Settings, ExternalLink, ClipboardList, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import FileUpload from '@/components/upload/FileUpload';
import LoadingScreen from '@/components/upload/LoadingScreen';
import FormResponsesTab from '@/components/community/FormResponsesTab';

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
	_count: {
		chatAnalyses: number;
	};
}

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
	const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [activeTab, setActiveTab] = useState('applications');
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
	const router = useRouter();
	const params = useParams();
	const communityId = params.communityId as string;

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

	const handleFileSelect = async (file: File) => {
		setIsProcessing(true);

		try {
			// Create form data for file upload
			const formData = new FormData();
			formData.append('file', file);
			formData.append('communityId', communityId);

			const response = await fetch('/api/upload', {
				method: 'POST',
				body: formData,
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Upload failed');
			}

			// Store analysis in sessionStorage for immediate use
			sessionStorage.setItem(
				'chatAnalysis',
				JSON.stringify(result.analysis, (key, value) => {
					if (key === 'timestamp' || key === 'firstActive' || key === 'lastActive' || key === 'dateShared' || key === 'start' || key === 'end') {
						return value instanceof Date ? value.toISOString() : value;
					}
					return value;
				})
			);

			// Close modal and navigate to results
			setIsUploadModalOpen(false);
			router.push(`/dashboard/community/${communityId}/analysis/${result.analysisId}`);
		} catch (error) {
			console.error('Error uploading file:', error);
			setIsProcessing(false);

			if (error instanceof Error) {
				if (error.message.includes('limit')) {
					toast.error('Upload limit reached. You can only have 3 analyses per account. Please delete an existing analysis to upload a new one.');
				} else {
					toast.error(`Error: ${error.message}`);
				}
			} else {
				toast.error('Error uploading file. Please try again.');
			}
		}
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
			const currentVisibility = memberDirectory.visibleFields as Record<string, boolean> || {
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

	if (isProcessing) {
		return <LoadingScreen onComplete={() => {}} />;
	}

	return (
		<div className='min-h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
			{/* Subtle Animated Background */}
			<div className='fixed inset-0 overflow-hidden pointer-events-none -z-10'>
				<div className='absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse'></div>
				<div className='absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000'></div>
			</div>

			<div className='relative z-10 bg-white/80 backdrop-blur-sm border-b border-white/50'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex flex-col gap-4 py-4'>
						{/* Top Row: Navigation and Actions */}
						<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3'>
							<div className='flex items-center space-x-3'>
								<Button variant='outline' size='sm' onClick={handleBackToDashboard} className='text-xs sm:text-sm'>
									<ArrowLeft className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
									<span className='hidden sm:inline'>Back to </span>Dashboard
								</Button>
							</div>
						</div>

						{/* Community Info */}
						<div className='text-left'>
							<div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4'>
								<h1 className='text-lg sm:text-xl lg:text-2xl font-bold text-gray-900'>{community.name}</h1>
								{applicationForm && (
									<div className='flex items-center gap-2'>
										<Badge variant={applicationForm.isActive ? 'default' : 'secondary'}>{applicationForm.isActive ? 'Form Active' : 'Form Inactive'}</Badge>
										<Badge variant={applicationForm.isPublic ? 'outline' : 'secondary'}>{applicationForm.isPublic ? 'Public' : 'Private'}</Badge>
									</div>
								)}
							</div>
							{community.description && <p className='text-xs sm:text-sm text-gray-600 mt-1'>{community.description}</p>}
							<div className='text-xs sm:text-sm text-gray-500 mt-1 flex flex-wrap items-center gap-1 sm:gap-2'>
								<span>{community._count.chatAnalyses} analyses</span>
								{applicationForm && (
									<>
										<span>•</span>
										<span>{applicationForm._count?.applications || 0} applications</span>
									</>
								)}
								<span>•</span>
								<span>Created {new Date(community.createdAt).toLocaleDateString()}</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
				{/* Public Links Section */}
				{(applicationForm || memberDirectory || (!applicationForm && !memberDirectory && community && community.chatAnalyses.length > 0)) && (
					<Card className='bg-white/70 backdrop-blur-sm border-white/60 shadow-lg mb-6'>
						<CardContent className='p-4 sm:p-6'>
							<div className='flex items-center justify-between mb-4'>
								<h2 className='text-lg font-semibold text-gray-900'>Public Links</h2>
								<Badge variant='secondary' className='text-xs'>
									Share these with your community
								</Badge>
							</div>
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
								{applicationForm && (
									<div className='p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors'>
										<div className='flex items-center justify-between mb-3'>
											<div className='flex items-center space-x-3'>
												<div
													className={`w-10 h-10 rounded-full flex items-center justify-center ${
														applicationForm.isActive && applicationForm.isPublic ? 'bg-blue-100' : 'bg-gray-200'
													}`}>
													<ClipboardList
														className={`w-5 h-5 ${applicationForm.isActive && applicationForm.isPublic ? 'text-blue-600' : 'text-gray-500'}`}
													/>
												</div>
												<div>
													<div className='flex items-center gap-2'>
														<h3 className='font-medium text-gray-900'>Application Form</h3>
														{(!applicationForm.isActive || !applicationForm.isPublic) && (
															<Badge variant='secondary' className='text-xs'>
																{!applicationForm.isActive ? 'Inactive' : 'Private'}
															</Badge>
														)}
													</div>
													<p className='text-sm text-gray-600'>
														{applicationForm.isActive && applicationForm.isPublic ? 'Public application form' : 'Form currently unavailable to public'}
													</p>
												</div>
											</div>
										</div>
										<div className='flex gap-2 flex-wrap'>
											<Button
												variant='outline'
												size='sm'
												onClick={() => window.open(`/apply/${applicationForm.customSlug}`, '_blank')}
												className='flex items-center gap-2'>
												<ExternalLink className='w-4 h-4' />
												<span className='hidden sm:inline'>Open</span>
											</Button>
											<Button
												variant='outline'
												size='sm'
												onClick={() => router.push(`/dashboard/community/${communityId}/form-builder`)}
												className='flex items-center gap-2'>
												<Edit className='w-4 h-4' />
												<span className='hidden sm:inline'>Settings</span>
											</Button>
											<Button
												variant='outline'
												size='sm'
												onClick={handleDeleteApplicationForm}
												className='flex items-center gap-2 text-red-600 hover:text-red-700 hover:border-red-300'>
												<Trash2 className='w-4 h-4' />
												<span className='hidden sm:inline'>Delete</span>
											</Button>
										</div>
									</div>
								)}
								{memberDirectory && (
									<div className='p-4 bg-white rounded-lg border border-gray-200 hover:border-green-300 transition-colors'>
										<div className='flex items-center justify-between mb-3'>
											<div className='flex items-center space-x-3'>
												<div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center'>
													<Users className='w-5 h-5 text-green-600' />
												</div>
												<div>
													<h3 className='font-medium text-gray-900'>Member Directory</h3>
													<p className='text-sm text-gray-600'>{memberDirectory.password ? 'Password protected' : 'Public access'}</p>
												</div>
											</div>
										</div>
										<div className='flex gap-2 flex-wrap'>
											<Button
												variant='outline'
												size='sm'
												onClick={() => window.open(`/directory/${memberDirectory.id}`, '_blank')}
												className='flex items-center gap-2'>
												<ExternalLink className='w-4 h-4' />
												<span className='hidden sm:inline'>Open</span>
											</Button>
											<Button variant='outline' size='sm' onClick={handleEditDirectory} className='flex items-center gap-2'>
												<Edit className='w-4 h-4' />
												<span className='hidden sm:inline'>Settings</span>
											</Button>
											<Button
												variant='outline'
												size='sm'
												onClick={handleDeleteDirectory}
												className='flex items-center gap-2 text-red-600 hover:text-red-700 hover:border-red-300'>
												<Trash2 className='w-4 h-4' />
												<span className='hidden sm:inline'>Delete</span>
											</Button>
										</div>
									</div>
								)}
								{!memberDirectory && community && community.chatAnalyses.length > 0 && (
									<div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200'>
										<div className='flex items-center space-x-3'>
											<div className='w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center'>
												<Users className='w-5 h-5 text-gray-600' />
											</div>
											<div>
												<h3 className='font-medium text-gray-700'>Member Directory</h3>
												<p className='text-sm text-gray-500'>Create shareable member directory</p>
											</div>
										</div>
										<Dialog open={isCreateDirectoryModalOpen} onOpenChange={setIsCreateDirectoryModalOpen}>
											<DialogTrigger asChild>
												<Button variant='outline' size='sm' className='flex items-center gap-2'>
													<Plus className='w-4 h-4' />
													<span className='hidden sm:inline'>Create</span>
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
									<div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200'>
										<div className='flex items-center space-x-3'>
											<div className='w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center'>
												<ClipboardList className='w-5 h-5 text-gray-600' />
											</div>
											<div>
												<h3 className='font-medium text-gray-700'>Application Form</h3>
												<p className='text-sm text-gray-500'>Create member application form</p>
											</div>
										</div>
										<Button
											variant='outline'
											size='sm'
											onClick={() => router.push(`/dashboard/community/${communityId}/form-builder`)}
											className='flex items-center gap-2'>
											<Plus className='w-4 h-4' />
											<span className='hidden sm:inline'>Create</span>
										</Button>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				)}

				<Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-6'>
					<TabsList className='grid w-full grid-cols-2'>
						<TabsTrigger value='applications' className='flex items-center gap-2'>
							<ClipboardList className='w-4 h-4' />
							<span className='hidden sm:inline'>Form </span>Responses
							{applicationForm?._count?.applications ? (
								<Badge variant='secondary' className='ml-1'>
									{applicationForm._count.applications}
								</Badge>
							) : null}
						</TabsTrigger>
						<TabsTrigger value='analytics' className='flex items-center gap-2'>
							<FileText className='w-4 h-4' />
							<span className='hidden sm:inline'>Chat </span>Analytics
						</TabsTrigger>
					</TabsList>

					<TabsContent value='applications' className='space-y-4'>
						<FormResponsesTab communityId={communityId} applicationForm={applicationForm} />
					</TabsContent>

					<TabsContent value='analytics' className='space-y-4'>
						<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0'>
							<h2 className='text-lg sm:text-xl font-semibold text-gray-900'>Chat Analyses</h2>
							<Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
								<DialogTrigger asChild>
									<Button size='sm' className='text-xs sm:text-sm w-full sm:w-auto'>
										<Plus className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
										<span className='hidden sm:inline'>New </span>Analysis
									</Button>
								</DialogTrigger>
								<DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
									<DialogHeader>
										<DialogTitle>Upload WhatsApp Chat Export</DialogTitle>
										<DialogDescription>
											Upload your WhatsApp chat export file to create a new analysis for this community. We&apos;ll process your data and provide
											comprehensive insights about your group dynamics.
										</DialogDescription>
									</DialogHeader>
									<div className='py-4'>
										<FileUpload onFileSelect={handleFileSelect} />
									</div>
								</DialogContent>
							</Dialog>
						</div>

						{/* Chat Analytics Content */}
						{community.chatAnalyses.length === 0 ? (
							<Card className='bg-white/70 backdrop-blur-sm border-white/60 shadow-lg'>
								<CardContent className='p-6 sm:p-12 text-center'>
									<Upload className='mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400' />
									<h3 className='mt-4 text-base sm:text-lg font-medium text-gray-900'>No analyses yet</h3>
									<p className='mt-2 text-sm text-gray-600'>Upload your first WhatsApp chat export to start analyzing your community dynamics.</p>
									<div className='mt-4 sm:mt-6'>
										<Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
											<DialogTrigger asChild>
												<Button size='sm' className='text-xs sm:text-sm'>
													<Upload className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
													<span className='hidden sm:inline'>Upload WhatsApp Export</span>
													<span className='sm:hidden'>Upload Export</span>
												</Button>
											</DialogTrigger>
											<DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
												<DialogHeader>
													<DialogTitle>Upload WhatsApp Chat Export</DialogTitle>
													<DialogDescription>Upload your WhatsApp chat export file to create a new analysis for this community.</DialogDescription>
												</DialogHeader>
												<div className='py-4'>
													<FileUpload onFileSelect={handleFileSelect} />
												</div>
											</DialogContent>
										</Dialog>
									</div>
								</CardContent>
							</Card>
						) : (
							<div className='space-y-3 sm:space-y-4'>
								<div className='grid gap-3 sm:gap-4'>
									{community.chatAnalyses.map((analysis) => (
										<Card key={analysis.id} className='bg-white/70 backdrop-blur-sm border-white/60 shadow-lg hover:shadow-xl transition-all duration-200'>
											<CardContent className='p-4 sm:p-6'>
												<div className='flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0'>
													<div className='flex-1 min-w-0 w-full sm:w-auto'>
														<h3 className='font-semibold text-base sm:text-lg text-gray-900 truncate'>{analysis.title}</h3>
														<div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-500'>
															<div className='flex items-center gap-3 sm:gap-4'>
																<span className='flex items-center'>
																	<FileText className='w-3 h-3 sm:w-4 sm:h-4 mr-1' />
																	{analysis.totalMessages.toLocaleString()} msgs
																</span>
																<span className='flex items-center'>
																	<Users className='w-3 h-3 sm:w-4 sm:h-4 mr-1' />
																	{analysis.totalMembers} members
																</span>
															</div>
															<span className='flex items-center'>
																<Calendar className='w-3 h-3 sm:w-4 sm:h-4 mr-1' />
																<span className='hidden sm:inline'>Created </span>
																{new Date(analysis.createdAt).toLocaleDateString()}
															</span>
														</div>
													</div>
													<div className='flex space-x-2 w-full sm:w-auto'>
														<Button
															variant='outline'
															size='sm'
															onClick={() => router.push(`/dashboard/community/${communityId}/analysis/${analysis.id}`)}
															className='text-xs sm:text-sm w-full sm:w-auto'>
															<FileText className='w-3 h-3 sm:w-4 sm:h-4 mr-1' />
															<span className='hidden sm:inline'>View </span>Analysis
														</Button>
													</div>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							</div>
						)}
					</TabsContent>
				</Tabs>

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
												{fieldVisibility[field.key] ? (
													<Eye className='w-4 h-4 text-green-600' />
												) : (
													<EyeOff className='w-4 h-4 text-gray-400' />
												)}
												<div>
													<p className='text-sm font-medium text-gray-900'>{field.label}</p>
													<p className='text-xs text-gray-500'>{field.description}</p>
												</div>
											</div>
											<Button
												variant={fieldVisibility[field.key] ? 'default' : 'outline'}
												size='sm'
												onClick={() =>
													setFieldVisibility(prev => ({
														...prev,
														[field.key]: !prev[field.key]
													}))
												}
											>
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
			</div>
		</div>
	);
}

export default function CommunityPage() {
	return (
		<Suspense
			fallback={
				<div className='min-h-screen flex items-center justify-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
				</div>
			}>
			<CommunityPageContent />
		</Suspense>
	);
}
