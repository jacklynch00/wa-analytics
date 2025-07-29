'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, FileText, Users, Calendar, Plus } from 'lucide-react';
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

export default function CommunityAnalyticsPage() {
	const params = useParams();
	const router = useRouter();
	const communityId = params.communityId as string;
	const [community, setCommunity] = useState<Community | null>(null);
	const [loading, setLoading] = useState(true);
	const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);

	useEffect(() => {
		const loadData = async () => {
			try {
				const communityResponse = await fetch(`/api/communities/${communityId}`);
				if (communityResponse.ok) {
					const result = await communityResponse.json();
					setCommunity(result.community);
				}
			} catch (error) {
				console.error('Error loading community data:', error);
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, [communityId]);

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
					toast.error('Upload failed due to server limits. Please try again.');
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
			<div className='flex items-center justify-center py-8'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
			</div>
		);
	}

	if (isProcessing) {
		return <LoadingScreen onComplete={() => {}} />;
	}

	return (
		<div className='space-y-6'>
				<div className='flex flex-col sm:flex-row justify-end items-start sm:items-center gap-3 sm:gap-0'>
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
									Upload your WhatsApp chat export file to create a new analysis for this community. We&apos;ll process your data and provide comprehensive
									insights about your group dynamics.
								</DialogDescription>
							</DialogHeader>
							<div className='py-4'>
								<FileUpload onFileSelect={handleFileSelect} />
							</div>
						</DialogContent>
					</Dialog>
				</div>

				{/* Chat Analytics Content */}
				{!community || community.chatAnalyses.length === 0 ? (
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
		</div>
	);
}
