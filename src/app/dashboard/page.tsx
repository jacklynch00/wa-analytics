'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, Users, Calendar, Trash2, Share2, Eye, EyeOff, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import FileUpload from '@/components/upload/FileUpload';
import LoadingScreen from '@/components/upload/LoadingScreen';
import { CopyButton } from '@/components/ui/copy-button';

interface ChatAnalysis {
	id: string;
	title: string;
	fileName: string;
	totalMessages: number;
	totalMembers: number;
	createdAt: string;
	shareLink?: {
		id: string;
		shareUrl: string;
		password: string | null;
		expiresAt: string;
	};
}

export default function DashboardPage() {
	const [user, setUser] = useState<{ name: string; email: string } | null>(null);
	const [analyses, setAnalyses] = useState<ChatAnalysis[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
	const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const router = useRouter();

	const togglePasswordVisibility = (analysisId: string) => {
		setShowPasswords((prev) => ({
			...prev,
			[analysisId]: !prev[analysisId],
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

				// Fetch user's analyses from database
				const response = await fetch('/api/analyses');
				if (response.ok) {
					const result = await response.json();
					setAnalyses(result.analyses);
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

	const handleFileSelect = async (file: File) => {
		// Check if user has reached the upload limit
		if (analyses.length >= 3) {
			toast.error('Upload limit reached. You can only have 3 analyses per account. Please delete an existing analysis to upload a new one.');
			return;
		}

		setIsProcessing(true);

		try {
			// Create form data for file upload
			const formData = new FormData();
			formData.append('file', file);

			// Upload file to API
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
			router.push(`/dashboard/${result.analysisId}`);
		} catch (error) {
			console.error('Error uploading file:', error);
			setIsProcessing(false);

			if (error instanceof Error) {
				if (error.message.includes('limit')) {
					toast.error('Upload limit reached. You can only have 3 analyses per account. Please delete an existing analysis from your dashboard to upload a new one.');
				} else {
					toast.error(`Error: ${error.message}`);
				}
			} else {
				toast.error('Error uploading file. Please try again.');
			}
		}
	};

	const handleDeleteAnalysis = async (analysisId: string) => {
		if (!confirm('Are you sure you want to delete this analysis? This action cannot be undone.')) {
			return;
		}

		try {
			const response = await fetch(`/api/analysis/${analysisId}`, {
				method: 'DELETE',
			});

			if (response.ok) {
				// Remove from local state
				setAnalyses((prev) => prev.filter((analysis) => analysis.id !== analysisId));
				toast.success('Analysis deleted successfully');
			} else {
				toast.error('Failed to delete analysis. Please try again.');
			}
		} catch (error) {
			console.error('Error deleting analysis:', error);
			toast.error('Failed to delete analysis. Please try again.');
		}
	};

	const handleShareAnalysis = async (analysisId: string, existingShare?: ChatAnalysis['shareLink']) => {
		// If share already exists, show the existing link details
		if (existingShare) {
			await navigator.clipboard.writeText(existingShare.shareUrl);
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
					analysisId,
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
				setAnalyses((prev) =>
					prev.map((analysis) =>
						analysis.id === analysisId
							? {
									...analysis,
									shareLink: {
										id: result.shareId,
										shareUrl: result.shareUrl,
										password: result.password,
										expiresAt: result.expiresAt,
									},
								}
							: analysis
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

	if (isProcessing) {
		return <LoadingScreen onComplete={() => {}} />;
	}

	return (
		<div className='min-h-screen bg-gray-50'>
			<div className='bg-white'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex justify-between items-center py-4'>
						<div>
							<h1 className='text-2xl font-bold text-gray-900'>Dashboard</h1>
							<p className='text-sm text-gray-600'>Welcome back, {user.name}</p>
						</div>
						<div className='flex space-x-2'>
							<Button onClick={handleSignOut} variant='outline'>
								Sign Out
							</Button>
						</div>
					</div>
				</div>
			</div>

			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
					<Card>
						<CardContent className='p-6'>
							<div className='flex items-center'>
								<FileText className='h-8 w-8 text-blue-600' />
								<div className='ml-4'>
									<p className='text-sm font-medium text-gray-600'>Total Analyses</p>
									<p className='text-2xl font-bold text-gray-900'>{analyses.length}</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-6'>
							<div className='flex items-center'>
								<Upload className='h-8 w-8 text-green-600' />
								<div className='ml-4'>
									<p className='text-sm font-medium text-gray-600'>{analyses.length >= 3 ? 'Upload Status' : 'Uploads Remaining'}</p>
									<p className={`text-2xl font-bold ${analyses.length >= 3 ? 'text-orange-600' : 'text-gray-900'}`}>
										{analyses.length >= 3 ? 'Limit Reached' : `${3 - analyses.length}`}
									</p>
									{analyses.length >= 3 && <p className='text-xs text-gray-500 mt-1'>Delete an analysis to upload more</p>}
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-6'>
							<div className='flex items-center'>
								<Users className='h-8 w-8 text-purple-600' />
								<div className='ml-4'>
									<p className='text-sm font-medium text-gray-600'>Shared Directories</p>
									<p className='text-2xl font-bold text-gray-900'>{analyses.filter((analysis) => analysis.shareLink).length}</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className='space-y-6'>
					<div className='flex justify-between items-center'>
						<h2 className='text-xl font-semibold text-gray-900'>Your Analyses</h2>
						{analyses.length >= 3 ? (
							<Button disabled variant='outline' className='cursor-not-allowed'>
								<Upload className='w-4 h-4 mr-2' />
								Upload Limit Reached
							</Button>
						) : (
							<Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
								<DialogTrigger asChild>
									<Button>
										<Upload className='w-4 h-4 mr-2' />
										New Analysis
									</Button>
								</DialogTrigger>
								<DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
									<DialogHeader>
										<DialogTitle>Upload WhatsApp Chat Export</DialogTitle>
										<DialogDescription>
											Upload your WhatsApp chat export file to create a new analysis. We&apos;ll process your data and provide comprehensive insights about
											your group dynamics.
										</DialogDescription>
									</DialogHeader>
									<div className='py-4'>
										<FileUpload onFileSelect={handleFileSelect} />
									</div>
									<DialogFooter>
										<p className='text-xs text-gray-500 text-center'>Supported formats: .txt files exported from WhatsApp</p>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						)}
					</div>

					{analyses.length === 0 ? (
						<Card>
							<CardContent className='p-12 text-center'>
								<FileText className='mx-auto h-12 w-12 text-gray-400' />
								<h3 className='mt-4 text-lg font-medium text-gray-900'>No analyses yet</h3>
								<p className='mt-2 text-sm text-gray-600'>Upload your first WhatsApp chat export to get started.</p>
								<div className='mt-6'>
									<Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
										<DialogTrigger asChild>
											<Button>
												<Upload className='w-4 h-4 mr-2' />
												Upload WhatsApp Export
											</Button>
										</DialogTrigger>
										<DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
											<DialogHeader>
												<DialogTitle>Upload WhatsApp Chat Export</DialogTitle>
											</DialogHeader>
											<div className='py-4'>
												<FileUpload onFileSelect={handleFileSelect} />
											</div>
											<DialogFooter>
												<p className='text-xs text-gray-500 text-center'>Supported formats: .txt files exported from WhatsApp</p>
											</DialogFooter>
										</DialogContent>
									</Dialog>
								</div>
							</CardContent>
						</Card>
					) : (
						<div className='space-y-4'>
							<div className='grid gap-4'>
								{analyses.map((analysis) => (
									<Card key={analysis.id}>
										<CardContent className='p-6'>
											<div className='flex justify-between items-start'>
												<div>
													<h3 className='font-semibold text-lg text-gray-900'>{analysis.title}</h3>
													<p className='text-sm text-gray-600 mt-1'>{analysis.fileName}</p>
													<div className='flex items-center space-x-4 mt-2 text-sm text-gray-500'>
														<span className='flex items-center'>
															<FileText className='w-4 h-4 mr-1' />
															{analysis.totalMessages.toLocaleString()} messages
														</span>
														<span className='flex items-center'>
															<Users className='w-4 h-4 mr-1' />
															{analysis.totalMembers} members
														</span>
														<span className='flex items-center'>
															<Calendar className='w-4 h-4 mr-1' />
															{new Date(analysis.createdAt).toLocaleDateString()}
														</span>
														{analysis.shareLink && (
															<div className='flex items-center gap-2'>
																<a
																	href={analysis.shareLink.shareUrl}
																	target='_blank'
																	rel='noopener noreferrer'
																	className='flex items-center text-blue-600 hover:text-blue-800 hover:underline transition-colors'>
																	<Share2 className='w-4 h-4 mr-1' />
																	Share link
																</a>
																{analysis.shareLink.password && (
																	<div className='flex items-center gap-1'>
																		<div className='flex items-center gap-1'>
																			<span className='text-xs flex flex-row items-center gap-2 bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono'>
																				{showPasswords[analysis.id]
																					? analysis.shareLink.password
																					: '•'.repeat(analysis.shareLink.password.length)}
																				<CopyButton
																					text={analysis.shareLink.password}
																					size='icon'
																					className='h-5 w-5 p-0 border-none bg-transparent'
																				/>
																			</span>
																		</div>
																		<button
																			onClick={() => togglePasswordVisibility(analysis.id)}
																			className='text-gray-500 hover:text-gray-700 transition-colors p-1'>
																			{showPasswords[analysis.id] ? <EyeOff className='w-3 h-3' /> : <Eye className='w-3 h-3' />}
																		</button>
																	</div>
																)}
															</div>
														)}
													</div>
												</div>
												<div className='flex space-x-2'>
													<Button variant='outline' size='sm' onClick={() => router.push(`/dashboard/${analysis.id}`)}>
														<Eye className='w-4 h-4 mr-1' />
														View
													</Button>
													{analysis.shareLink ? (
														<Button size='sm' onClick={() => handleShareAnalysis(analysis.id, analysis.shareLink)}>
															<Share2 className='w-4 h-4 mr-1' />
															Copy Directory Link
														</Button>
													) : (
														<Button size='sm' onClick={() => handleShareAnalysis(analysis.id)}>
															<Share2 className='w-4 h-4 mr-1' />
															Create Member Directory
														</Button>
													)}
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button variant='outline' size='sm'>
																<MoreVertical className='w-4 h-4' />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align='end'>
															<DropdownMenuItem onClick={() => handleDeleteAnalysis(analysis.id)} className='text-red-600 focus:text-red-600'>
																<Trash2 className='w-4 h-4 mr-2' />
																Delete
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
