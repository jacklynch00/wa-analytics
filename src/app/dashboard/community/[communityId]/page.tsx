'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, Users, Calendar, ArrowLeft, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import FileUpload from '@/components/upload/FileUpload';
import LoadingScreen from '@/components/upload/LoadingScreen';

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

function CommunityPageContent() {
	const [community, setCommunity] = useState<Community | null>(null);
	const [loading, setLoading] = useState(true);
	const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const router = useRouter();
	const params = useParams();
	const communityId = params.communityId as string;

	useEffect(() => {
		const loadCommunity = async () => {
			try {
				const response = await fetch(`/api/communities/${communityId}`);
				if (response.ok) {
					const result = await response.json();
					setCommunity(result.community);
				} else {
					console.error('Failed to load community');
					router.push('/dashboard');
				}
			} catch (error) {
				console.error('Error loading community:', error);
				router.push('/dashboard');
			} finally {
				setLoading(false);
			}
		};

		loadCommunity();
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

			// Add a minimum delay to show the progress bar properly
			const uploadPromise = fetch('/api/upload', {
				method: 'POST',
				body: formData,
			});

			// Wait at least 3 seconds to show progress
			const [response] = await Promise.all([
				uploadPromise,
				new Promise(resolve => setTimeout(resolve, 3000))
			]);

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
				<Card className='w-full max-w-md'>
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
		<div className='min-h-screen bg-gray-50'>
			<div className='bg-white'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-3 sm:gap-0'>
						<Button variant='outline' size='sm' onClick={handleBackToDashboard} className='text-xs sm:text-sm'>
							<ArrowLeft className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
							<span className='hidden sm:inline'>Back to </span>Dashboard
						</Button>
						<div className='text-left sm:text-right w-full sm:w-auto'>
							<h1 className='text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate'>{community.name}</h1>
							{community.description && (
								<p className='text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2'>{community.description}</p>
							)}
							<div className='text-xs sm:text-sm text-gray-500 mt-1 flex flex-wrap items-center gap-1 sm:gap-2'>
								<span>{community._count.chatAnalyses} analyses</span>
								<span>•</span>
								<span>Created {new Date(community.createdAt).toLocaleDateString()}</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
				<div className='space-y-4 sm:space-y-6'>
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
										Upload your WhatsApp chat export file to create a new analysis for this community. We&apos;ll process your data and provide comprehensive insights about your group dynamics.
									</DialogDescription>
								</DialogHeader>
								<div className='py-4'>
									<FileUpload onFileSelect={handleFileSelect} />
								</div>
							</DialogContent>
						</Dialog>
					</div>

					{community.chatAnalyses.length === 0 ? (
						<Card>
							<CardContent className='p-6 sm:p-12 text-center'>
								<Upload className='mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400' />
								<h3 className='mt-4 text-base sm:text-lg font-medium text-gray-900'>No analyses yet</h3>
								<p className='mt-2 text-sm text-gray-600'>
									Upload your first WhatsApp chat export to start analyzing your community dynamics.
								</p>
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
												<DialogDescription>
													Upload your WhatsApp chat export file to create a new analysis for this community.
												</DialogDescription>
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
									<Card key={analysis.id}>
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
															<span className='hidden sm:inline'>Created </span>{new Date(analysis.createdAt).toLocaleDateString()}
														</span>
													</div>
												</div>
												<div className='flex space-x-2 w-full sm:w-auto'>
													<Button variant='outline' size='sm' onClick={() => router.push(`/dashboard/community/${communityId}/analysis/${analysis.id}`)} className='text-xs sm:text-sm w-full sm:w-auto'>
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
				</div>
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