'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChatAnalysis, AIRecapData } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MemberDirectory from '@/components/dashboard/MemberDirectory';
import MemberManagement from '@/components/dashboard/MemberManagement';
import AIRecap from '@/components/dashboard/AIRecap';
import ResourceHub from '@/components/dashboard/ResourceHub';
import Analytics from '@/components/dashboard/Analytics';
import { ArrowLeft, Download } from 'lucide-react';

function ResultsPageContent() {
	const [analysis, setAnalysis] = useState<ChatAnalysis | null>(null);
	const [loading, setLoading] = useState(true);
	const [analysisId, setAnalysisId] = useState<string | null>(null);
	const router = useRouter();
	const searchParams = useSearchParams();

	useEffect(() => {
		const loadAnalysis = async () => {
			const currentAnalysisId = searchParams.get('id');
			setAnalysisId(currentAnalysisId);

			// If we have an analysis ID, try to load from database
			if (currentAnalysisId) {
				try {
					const response = await fetch(`/api/analysis/${currentAnalysisId}`);
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
						setLoading(false);
						return;
					} else {
						console.error('Failed to load analysis from database');
					}
				} catch (error) {
					console.error('Error loading analysis from database:', error);
				}
			}

			// Fallback to sessionStorage
			const storedData = sessionStorage.getItem('chatAnalysis');

			if (!storedData) {
				router.push('/dashboard');
				return;
			}

			try {
				const parsedData = JSON.parse(storedData, (key, value) => {
					if (key === 'timestamp' || key === 'firstActive' || key === 'lastActive' || key === 'dateShared' || key === 'start' || key === 'end') {
						return new Date(value);
					}
					return value;
				});

				setAnalysis(parsedData);
			} catch (error) {
				console.error('Error parsing stored data:', error);
				router.push('/dashboard');
			} finally {
				setLoading(false);
			}
		};

		loadAnalysis();
	}, [router, searchParams]);

	const handleBackToUpload = () => {
		sessionStorage.removeItem('chatAnalysis');
		router.push('/');
	};

	const handleExportData = () => {
		if (!analysis) return;

		const exportData = {
			summary: {
				totalMessages: analysis.totalMessages,
				totalMembers: analysis.members.length,
				activeMembersLast7Days: analysis.activeMembersLast7Days,
				dateRange: analysis.dateRange,
				averageMessagesPerDay: analysis.averageMessagesPerDay,
			},
			members: analysis.members.map((member) => ({
				name: member.name,
				totalMessages: member.totalMessages,
				messageFrequency: member.messageFrequency,
				firstActive: member.firstActive,
				lastActive: member.lastActive,
			})),
			resources: analysis.resources.length,
			dailyStats: analysis.dailyStats,
		};

		const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `whatsapp-analysis-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const handleRecapRegenerated = (newRecaps: { [key: string]: AIRecapData }) => {
		if (analysis) {
			setAnalysis({
				...analysis,
				aiRecaps: newRecaps,
			});
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
						<h2 className='text-xl font-semibold mb-4'>No Data Found</h2>
						<p className='text-gray-600 mb-4'>Please upload a WhatsApp chat export first.</p>
						<Button onClick={() => router.push('/')}>
							<ArrowLeft className='w-4 h-4 mr-2' />
							Back to Upload
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
						<div>
							<h1 className='text-2xl font-bold text-gray-900'>WhatsApp Community Analytics</h1>
							<p className='text-sm text-gray-600'>
								{analysis.totalMessages.toLocaleString()} messages • {analysis.members.length} members •
								{Math.ceil((analysis.dateRange.end.getTime() - analysis.dateRange.start.getTime()) / (1000 * 60 * 60 * 24))} days
							</p>
						</div>

						<div className='flex space-x-2'>
							<Button variant='outline' onClick={handleExportData}>
								<Download className='w-4 h-4 mr-2' />
								Export Data
							</Button>
							<Button variant='outline' onClick={handleBackToUpload}>
								<ArrowLeft className='w-4 h-4 mr-2' />
								New Analysis
							</Button>
						</div>
					</div>
				</div>
			</div>

			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				<Tabs defaultValue='analytics' className='space-y-6'>
					<TabsList className='grid w-full grid-cols-5'>
						<TabsTrigger value='analytics'>Analytics</TabsTrigger>
						<TabsTrigger value='members'>Member Directory</TabsTrigger>
						<TabsTrigger value='management'>Member Management</TabsTrigger>
						<TabsTrigger value='ai-recap'>AI Recap</TabsTrigger>
						<TabsTrigger value='resources'>Resource Hub</TabsTrigger>
					</TabsList>

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

export default function ResultsPage() {
	return (
		<Suspense
			fallback={
				<div className='min-h-screen flex items-center justify-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
				</div>
			}>
			<ResultsPageContent />
		</Suspense>
	);
}
