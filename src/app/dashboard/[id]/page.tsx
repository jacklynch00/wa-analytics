'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChatAnalysis, AIRecapData } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import MemberDirectory from '@/components/dashboard/MemberDirectory';
import MemberManagement from '@/components/dashboard/MemberManagement';
import AIRecap from '@/components/dashboard/AIRecap';
import ResourceHub from '@/components/dashboard/ResourceHub';
import Analytics from '@/components/dashboard/Analytics';
import { ArrowLeft, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

function AnalysisPageContent() {
	const [analysis, setAnalysis] = useState<ChatAnalysis | null>(null);
	const [loading, setLoading] = useState(true);
	const [isEditingTitle, setIsEditingTitle] = useState(false);
	const [editTitle, setEditTitle] = useState('');
	const router = useRouter();
	const params = useParams();
	const analysisId = params.id as string;

	useEffect(() => {
		const loadAnalysis = async () => {
			try {
				const response = await fetch(`/api/analysis/${analysisId}`);
				if (response.ok) {
					const result = await response.json();
					// Convert date strings back to Date objects
					const analysisWithDates = JSON.parse(JSON.stringify(result.analysis), (key, value) => {
						if (key === 'timestamp' || key === 'firstActive' || key === 'lastActive' || key === 'dateShared' || key === 'start' || key === 'end') {
							return new Date(value);
						}
						return value;
					});
					setAnalysis(analysisWithDates);
					setEditTitle(analysisWithDates.title);
				} else {
					console.error('Failed to load analysis from database');
					router.push('/dashboard');
				}
			} catch (error) {
				console.error('Error loading analysis from database:', error);
				router.push('/dashboard');
			} finally {
				setLoading(false);
			}
		};

		loadAnalysis();
	}, [router, analysisId]);

	const handleBackToDashboard = () => {
		router.push('/dashboard');
	};

	const handleRecapRegenerated = (newRecaps: { [key: string]: AIRecapData }) => {
		if (analysis) {
			setAnalysis({
				...analysis,
				aiRecaps: newRecaps,
			});
		}
	};

	const handleStartEditTitle = () => {
		setIsEditingTitle(true);
		setEditTitle(analysis?.title || '');
	};

	const handleCancelEditTitle = () => {
		setIsEditingTitle(false);
		setEditTitle(analysis?.title || '');
	};

	const handleSaveTitle = async () => {
		if (!editTitle.trim() || editTitle === analysis?.title) {
			setIsEditingTitle(false);
			return;
		}

		try {
			const response = await fetch(`/api/analysis/${analysisId}/title`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ title: editTitle.trim() }),
			});

			if (response.ok) {
				setAnalysis(prev => prev ? { ...prev, title: editTitle.trim() } : null);
				setIsEditingTitle(false);
				toast.success('Title updated successfully');
			} else {
				toast.error('Failed to update title');
			}
		} catch (error) {
			console.error('Error updating title:', error);
			toast.error('Failed to update title');
		}
	};

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
			</div>
		);
	}

	if (!analysis) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<Card>
					<CardContent className='p-8 text-center'>
						<h2 className='text-xl font-semibold mb-4'>Analysis Not Found</h2>
						<p className='text-gray-600 mb-4'>The requested analysis could not be found.</p>
						<Button onClick={handleBackToDashboard}>
							<ArrowLeft className='w-4 h-4 mr-2' />
							Back to Dashboard
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-gray-50'>
			<div className='bg-white'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex justify-between items-center py-4'>
						<Button variant='outline' onClick={handleBackToDashboard}>
							<ArrowLeft className='w-4 h-4 mr-2' />
							Back to Dashboard
						</Button>
						<div className='text-right'>
							{isEditingTitle ? (
								<div className='flex items-center justify-end gap-2 mb-2'>
									<Input
										value={editTitle}
										onChange={(e) => setEditTitle(e.target.value)}
										className='text-2xl font-bold text-gray-900 text-right h-auto py-1 px-2'
										onKeyDown={(e) => {
											if (e.key === 'Enter') handleSaveTitle();
											if (e.key === 'Escape') handleCancelEditTitle();
										}}
										autoFocus
									/>
									<Button size='sm' variant='outline' onClick={handleSaveTitle}>
										<Check className='w-4 h-4' />
									</Button>
									<Button size='sm' variant='outline' onClick={handleCancelEditTitle}>
										<X className='w-4 h-4' />
									</Button>
								</div>
							) : (
								<div className='flex items-center justify-end gap-2 mb-2'>
									<h1 className='text-2xl font-bold text-gray-900'>{analysis.title}</h1>
									<Button size='sm' variant='ghost' onClick={handleStartEditTitle}>
										<Edit2 className='w-4 h-4' />
									</Button>
								</div>
							)}
							<p className='text-sm text-gray-600'>
								{analysis.totalMessages.toLocaleString()} messages • {analysis.members.length} members •
								{Math.ceil((analysis.dateRange.end.getTime() - analysis.dateRange.start.getTime()) / (1000 * 60 * 60 * 24))} days
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				<Tabs defaultValue='analytics' className='space-y-6'>
					<div className='w-full overflow-x-auto'>
						<TabsList className='inline-flex w-auto min-w-full justify-start'>
							<TabsTrigger value='analytics' className='min-w-[100px] flex-shrink-0'>
								Analytics
							</TabsTrigger>
							<TabsTrigger value='members' className='min-w-[120px] flex-shrink-0'>
								Member Directory
							</TabsTrigger>
							<TabsTrigger value='management' className='min-w-[140px] flex-shrink-0'>
								Member Management
							</TabsTrigger>
							<TabsTrigger value='ai-recap' className='min-w-[100px] flex-shrink-0'>
								AI Recap
							</TabsTrigger>
							<TabsTrigger value='resources' className='min-w-[120px] flex-shrink-0'>
								Resource Hub
							</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent value='analytics' className='space-y-6'>
						<Analytics analysis={analysis} />
					</TabsContent>

					<TabsContent value='members' className='space-y-6'>
						<MemberDirectory members={analysis.members} />
					</TabsContent>

					<TabsContent value='management' className='space-y-6'>
						<MemberManagement members={analysis.members} />
					</TabsContent>

					<TabsContent value='ai-recap' className='space-y-6'>
						<AIRecap aiRecaps={analysis.aiRecaps || {}} analysisId={analysisId || undefined} onRecapRegenerated={handleRecapRegenerated} />
					</TabsContent>

					<TabsContent value='resources' className='space-y-6'>
						<ResourceHub resources={analysis.resources} />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}

export default function AnalysisPage() {
	return (
		<Suspense
			fallback={
				<div className='min-h-screen flex items-center justify-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
				</div>
			}>
			<AnalysisPageContent />
		</Suspense>
	);
}
