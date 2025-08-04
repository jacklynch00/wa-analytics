'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, MessageCircle, Calendar, Lock, Eye, EyeOff, Search, FileText, Lightbulb, Sparkles, Link, Mail, User } from 'lucide-react';
import { getFileUrl } from '@/lib/utils';
import { format } from 'date-fns';
import { Pagination, usePagination } from '@/components/ui/pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MemberProfile, AIRecapData } from '@/types';

interface FormQuestion {
	id: string;
	label: string;
	type: string;
}

interface MemberData {
	id: string;
	email: string;
	joinedAt: string;
	appliedAt: string;
	[key: string]: unknown;
}

interface Analysis {
	id: string;
	title: string;
	totalMessages: number;
	totalMembers: number;
	createdAt: string;
	members: MemberProfile[];
	resources: { type?: string; url?: string; description?: string; sharedBy?: string }[];
	aiRecaps: { [key: string]: AIRecapData };
}

interface SharedDirectoryData {
	communityName: string;
	communityDescription: string | null;
	communityImageUrl?: string;
	members: MemberData[];
	totalMembers: number;
	analyses?: Analysis[];
	isPasswordProtected: boolean;
	password?: string;
	formQuestions: FormQuestion[];
	visibleFields?: Record<string, boolean>;
}

export default function SharedDirectoryPage() {
	const params = useParams();
	const shareId = params.id as string;

	const [directoryData, setDirectoryData] = useState<SharedDirectoryData | null>(null);
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [isPasswordRequired, setIsPasswordRequired] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedTimeRange, setSelectedTimeRange] = useState(7);
	const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>('');

	const timeRangeOptions = [
		{ label: 'Last 1 Day', value: 1 },
		{ label: 'Last 3 Days', value: 3 },
		{ label: 'Last 7 Days', value: 7 },
		{ label: 'Last 30 Days', value: 30 },
	];

	const loadDirectory = useCallback(
		async (passwordAttempt?: string) => {
			try {
				setLoading(true);
				setError(null);

				const body: { password?: string } = {};
				if (passwordAttempt) {
					body.password = passwordAttempt;
				}

				const response = await fetch(`/api/directory/${shareId}`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(body),
				});

				const result = await response.json();

				if (response.status === 401) {
					setIsPasswordRequired(true);
					setLoading(false);
					return;
				}

				if (!response.ok) {
					setError(result.error || 'Failed to load directory');
					setLoading(false);
					return;
				}

				setDirectoryData(result);
				setIsPasswordRequired(false);
			} catch {
				setError('Failed to load directory');
			} finally {
				setLoading(false);
			}
		},
		[shareId]
	);

	useEffect(() => {
		loadDirectory();
	}, [shareId, loadDirectory]);

	const handlePasswordSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (password.trim()) {
			loadDirectory(password);
		}
	};

	// Set default to first analysis if not set and data is available
	if (!selectedAnalysisId && directoryData?.analyses && directoryData.analyses.length > 0) {
		setSelectedAnalysisId(directoryData.analyses[0].id);
	}

	// Get members from directory data (application members)
	const allMembers = directoryData?.members || [];

	// Helper function to get display name for a member
	const getMemberDisplayName = (member: MemberData): string => {
		// Try to find name in various common field names
		const nameFields = ['name', 'full_name', 'first_name', 'last_name'];
		for (const field of nameFields) {
			if (member[field] && typeof member[field] === 'string') {
				return member[field] as string;
			}
		}
		// Fallback to email username
		return member.email.split('@')[0];
	};

	// Filter analyses based on selection
	const filteredAnalyses = directoryData?.analyses?.filter((analysis) => analysis.id === selectedAnalysisId) || [];

	// Aggregate resources from filtered analyses
	const allResources = filteredAnalyses.flatMap((analysis) => analysis.resources || []) || [];

	// Aggregate AI recaps from filtered analyses - group by time range
	const allAIRecaps =
		filteredAnalyses.reduce(
			(acc, analysis) => {
				if (analysis.aiRecaps) {
					Object.entries(analysis.aiRecaps).forEach(([timeRange, recapData]) => {
						if (!acc[timeRange]) {
							acc[timeRange] = [];
						}
						acc[timeRange].push({
							analysisTitle: analysis.title,
							recapData: recapData as AIRecapData,
						});
					});
				}
				return acc;
			},
			{} as { [key: string]: { analysisTitle: string; recapData: AIRecapData }[] }
		) || {};

	// Get recaps for selected time range
	const selectedRecaps = allAIRecaps[selectedTimeRange.toString()] || [];

	// Filter members based on search query
	const filteredMembers = allMembers.filter((member) => {
		const displayName = getMemberDisplayName(member);
		return displayName.toLowerCase().includes(searchQuery.toLowerCase()) || member.email.toLowerCase().includes(searchQuery.toLowerCase());
	});

	const { currentItems: paginatedMembers, currentPage, totalPages, totalItems, itemsPerPage, handlePageChange } = usePagination(filteredMembers, 12);

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<Card className='max-w-md'>
					<CardContent className='p-8 text-center'>
						<h2 className='text-xl font-semibold mb-4 text-red-600'>Error</h2>
						<p className='text-gray-600 mb-4'>{error}</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (isPasswordRequired) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gray-50'>
				<Card className='max-w-md w-full mx-4'>
					<CardHeader className='text-center'>
						<div className='mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4'>
							<Lock className='w-6 h-6 text-blue-600' />
						</div>
						<CardTitle>Password Required</CardTitle>
						<p className='text-sm text-gray-600'>This member directory is password protected</p>
					</CardHeader>
					<CardContent>
						<form onSubmit={handlePasswordSubmit} className='space-y-4'>
							<div className='relative'>
								<Input
									type={showPassword ? 'text' : 'password'}
									placeholder='Enter password'
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className='pr-10'
								/>
								<button
									type='button'
									onClick={() => setShowPassword(!showPassword)}
									className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'>
									{showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
								</button>
							</div>
							<Button type='submit' className='w-full' disabled={!password.trim()}>
								Access Directory
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!directoryData) {
		return null;
	}

	return (
		<div className='min-h-screen bg-gray-50'>
			{/* Header */}
			<div className='bg-white'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='py-4 sm:py-6'>
						<div className='flex flex-col lg:flex-row justify-between items-start gap-4 lg:gap-6'>
							<div className='flex-1 min-w-0'>
								<div className='flex items-center gap-4'>
									{directoryData.communityImageUrl && (
										<div className='w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0'>
											<img
												src={getFileUrl(directoryData.communityImageUrl)}
												alt={`${directoryData.communityName} logo`}
												className='w-auto h-auto max-w-full max-h-full object-contain'
											/>
										</div>
									)}
									<div className='flex-1 min-w-0'>
										<h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate'>{directoryData.communityName}</h1>
										{directoryData.communityDescription && (
											<p className='text-sm sm:text-base lg:text-lg text-gray-700 mt-2 line-clamp-2'>{directoryData.communityDescription}</p>
										)}
									</div>
								</div>
							</div>

							{/* Analysis Selector */}
							{directoryData.analyses && directoryData.analyses.length > 0 && (
								<div className='w-full lg:w-auto lg:min-w-[250px]'>
									<label className='block text-sm font-medium text-gray-700 mb-2'>View Analysis</label>
									<Select value={selectedAnalysisId} onValueChange={setSelectedAnalysisId}>
										<SelectTrigger className='w-full'>
											<SelectValue placeholder='Select analysis' />
										</SelectTrigger>
										<SelectContent>
											{directoryData.analyses.map((analysis) => (
												<SelectItem key={analysis.id} value={analysis.id}>
													{analysis.title}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							)}
						</div>

						<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 sm:mt-4 gap-2 sm:gap-0'>
							<div className='text-xs sm:text-sm text-gray-600'>
								<div className='flex flex-wrap items-center gap-1 sm:gap-2'>
									<span>Public Member Directory</span>
									{directoryData.password && (
										<>
											<span>•</span>
											<span className='flex items-center gap-1'>
												Password: <span className='font-mono bg-gray-100 px-1.5 sm:px-2 py-1 rounded text-xs'>{directoryData.password}</span>
											</span>
										</>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
				{/* Content Tabs */}
				<Tabs defaultValue='members' className='space-y-4 sm:space-y-6'>
					<div className='w-full overflow-x-auto'>
						<TabsList className='inline-flex w-auto min-w-full justify-start'>
							<TabsTrigger value='members' className='flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4'>
								<Users className='w-3 h-3 sm:w-4 sm:h-4' />
								<span className='hidden sm:inline'>Members </span>({directoryData?.totalMembers || 0})
							</TabsTrigger>
							{directoryData?.analyses && directoryData.analyses.length > 0 && (
								<>
									<TabsTrigger value='resources' className='flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4'>
										<FileText className='w-3 h-3 sm:w-4 sm:h-4' />
										<span className='hidden sm:inline'>Resources </span>({allResources.length})
									</TabsTrigger>
									<TabsTrigger value='ai-recap' className='flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4'>
										<Lightbulb className='w-3 h-3 sm:w-4 sm:h-4' />
										<span className='hidden sm:inline'>AI Recap </span>({Object.keys(allAIRecaps).length})
									</TabsTrigger>
								</>
							)}
						</TabsList>
					</div>

					<TabsContent value='members'>
						<Card>
							<CardHeader className='pb-4'>
								<CardTitle className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0'>
									<span className='text-base sm:text-lg'>Member Directory</span>
									<Badge variant='secondary' className='text-xs'>
										{totalItems} {searchQuery ? 'filtered' : 'total'} members
									</Badge>
								</CardTitle>
								<div className='relative mt-3 sm:mt-4'>
									<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
									<Input placeholder='Search members...' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className='pl-10' />
								</div>
							</CardHeader>
							<CardContent className='pt-0'>
								{filteredMembers.length === 0 && searchQuery ? (
									<div className='text-center py-6 sm:py-8'>
										<Search className='mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400' />
										<h3 className='mt-4 text-base sm:text-lg font-medium text-gray-900'>No members found</h3>
										<p className='mt-2 text-sm text-gray-600'>No members match your search for &ldquo;{searchQuery}&rdquo;. Try a different search term.</p>
									</div>
								) : (
									<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'>
										{paginatedMembers.map((member) => {
											const displayName = getMemberDisplayName(member);
											const visibleFields = directoryData?.visibleFields || {
												name: true,
												email: true,
												linkedin: false,
												phone: false,
											};
											return (
												<div key={member.id} className='p-3 sm:p-4 rounded-lg hover:bg-gray-50 transition-colors bg-white shadow-sm'>
													<div className='flex items-start space-x-3'>
														<div className='w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0'>
															<span className='text-blue-600 font-semibold text-sm sm:text-base'>{displayName.charAt(0).toUpperCase()}</span>
														</div>
														<div className='flex-1 min-w-0'>
															{visibleFields.name && <h3 className='font-medium text-sm sm:text-base text-gray-900 truncate'>{displayName}</h3>}
															<div className='text-xs sm:text-sm text-gray-500 space-y-1'>
																{visibleFields.email && (
																	<div className='flex items-center space-x-1'>
																		<Mail className='w-3 h-3 flex-shrink-0' />
																		<span className='truncate'>{member.email}</span>
																	</div>
																)}
																{member.joinedAt && (
																	<div className='flex items-center space-x-1'>
																		<Calendar className='w-3 h-3 flex-shrink-0' />
																		<span className='truncate'>Joined {format(new Date(member.joinedAt), 'MMM dd, yyyy')}</span>
																	</div>
																)}
																{/* Display additional form fields based on visibility settings */}
																{directoryData.formQuestions.map((question) => {
																	const value = member[question.id];
																	const label = question.label.toLowerCase();

																	// Skip if no value
																	if (!value) return null;

																	// Skip name and email as they're handled separately
																	if (label.includes('name') || label.includes('email')) {
																		return null;
																	}

																	// Only show fields that are explicitly set to visible
																	let shouldShow = false;

																	// Check if this is a LinkedIn field
																	if (label.includes('linkedin')) {
																		shouldShow = visibleFields.linkedin;
																	}
																	// Check if this is a phone field
																	else if (label.includes('phone') || label.includes('mobile') || label.includes('cell')) {
																		shouldShow = visibleFields.phone;
																	}
																	// For any other field, don't show it (only show the 4 configured field types)
																	else {
																		shouldShow = false;
																	}

																	if (!shouldShow) return null;

																	return (
																		<div key={question.id} className='flex items-start space-x-1'>
																			<User className='w-3 h-3 flex-shrink-0 mt-0.5' />
																			<span className='truncate text-xs'>
																				{question.label}: {String(value).substring(0, 50)}
																				{String(value).length > 50 ? '...' : ''}
																			</span>
																		</div>
																	);
																})}
															</div>
														</div>
													</div>
												</div>
											);
										})}
									</div>
								)}

								{totalPages > 1 && !searchQuery && (
									<div className='mt-6'>
										<Pagination
											currentPage={currentPage}
											totalPages={totalPages}
											onPageChange={handlePageChange}
											itemsPerPage={itemsPerPage}
											totalItems={totalItems}
										/>
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value='resources'>
						<div className='space-y-4 sm:space-y-6'>
							{/* Time Range Selector for Resources */}
							<div className='w-full max-w-xs'>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									<Calendar className='w-4 h-4 inline mr-2' />
									Time Range
								</label>
								<Select value={selectedTimeRange.toString()} onValueChange={(value) => setSelectedTimeRange(parseInt(value))}>
									<SelectTrigger>
										<SelectValue placeholder='Select time range' />
									</SelectTrigger>
									<SelectContent>
										{timeRangeOptions.map((option) => (
											<SelectItem key={option.value} value={option.value.toString()}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<Card>
								<CardHeader className='pb-4'>
									<CardTitle className='text-base sm:text-lg'>Resources</CardTitle>
									<p className='text-xs sm:text-sm text-gray-600'>Shared links, documents, and media from community conversations</p>
								</CardHeader>
								<CardContent className='pt-0'>
									{allResources.length === 0 ? (
										<div className='text-center py-8 sm:py-12'>
											<FileText className='mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400' />
											<h3 className='mt-4 text-base sm:text-lg font-medium text-gray-900'>No resources found</h3>
											<p className='mt-2 text-sm text-gray-600'>This community hasn&apos;t shared any resources yet.</p>
										</div>
									) : (
										<div className='space-y-3 sm:space-y-4'>
											{allResources.map((resource, index) => (
												<div key={index} className='p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors'>
													<div className='flex items-start space-x-3'>
														<div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0'>
															<FileText className='w-4 h-4 text-green-600' />
														</div>
														<div className='flex-1 min-w-0'>
															<h4 className='font-medium text-sm sm:text-base text-gray-900 truncate'>{resource.type || 'Shared Resource'}</h4>
															{resource.url && (
																<a
																	href={resource.url}
																	target='_blank'
																	rel='noopener noreferrer'
																	className='text-blue-600 hover:text-blue-800 text-xs sm:text-sm truncate block break-all'>
																	{resource.url}
																</a>
															)}
															{resource.description && <p className='text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2'>{resource.description}</p>}
															{resource.sharedBy && <p className='text-xs text-gray-500 mt-2'>Shared by {resource.sharedBy}</p>}
														</div>
													</div>
												</div>
											))}
										</div>
									)}
								</CardContent>
							</Card>
						</div>
					</TabsContent>

					<TabsContent value='ai-recap'>
						<div className='space-y-4 sm:space-y-6'>
							{/* Time Range Selector */}
							<div className='w-full max-w-xs'>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									<Calendar className='w-4 h-4 inline mr-2' />
									Time Range
								</label>
								<Select value={selectedTimeRange.toString()} onValueChange={(value) => setSelectedTimeRange(parseInt(value))}>
									<SelectTrigger>
										<SelectValue placeholder='Select time range' />
									</SelectTrigger>
									<SelectContent>
										{timeRangeOptions.map((option) => (
											<SelectItem key={option.value} value={option.value.toString()}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Selected Time Range Content */}
							{selectedRecaps.length === 0 ? (
								<Card>
									<CardContent className='p-8 sm:p-12 text-center'>
										<Lightbulb className='mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400' />
										<h3 className='mt-4 text-base sm:text-lg font-medium text-gray-900'>No AI insights available</h3>
										<p className='mt-2 text-sm text-gray-600'>No AI analysis found for the selected time range.</p>
									</CardContent>
								</Card>
							) : (
								<div className='space-y-6 sm:space-y-8'>
									{selectedRecaps.map((recap, index) => (
										<div key={index} className='space-y-4 sm:space-y-6'>
											{/* Executive Summary */}
											<Card>
												<CardHeader className='pb-3 sm:pb-4'>
													<CardTitle className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:space-x-2 text-base sm:text-lg'>
														<div className='flex items-center space-x-2'>
															<Sparkles className='w-4 h-4 sm:w-5 sm:h-5' />
															<span>Executive Summary</span>
														</div>
														<Badge variant='secondary' className='text-xs w-fit'>
															{recap.recapData.timeRange}
														</Badge>
													</CardTitle>
												</CardHeader>
												<CardContent className='pt-0'>
													<p className='text-sm sm:text-base text-gray-900 leading-relaxed'>{recap.recapData.summary}</p>
												</CardContent>
											</Card>

											{/* Content Grid */}
											<div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
												{/* Top Discussion Topics */}
												<Card>
													<CardHeader className='pb-3'>
														<CardTitle className='flex items-center space-x-2 text-sm sm:text-base'>
															<MessageCircle className='w-4 h-4 sm:w-5 sm:h-5' />
															<span>Top Discussion Topics</span>
														</CardTitle>
													</CardHeader>
													<CardContent className='pt-0'>
														{recap.recapData.topTopics.length > 0 ? (
															<ul className='space-y-2'>
																{recap.recapData.topTopics.map((topic, topicIndex) => (
																	<li key={topicIndex} className='flex items-start space-x-2'>
																		<div className='w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0' />
																		<span className='text-xs sm:text-sm text-gray-900 leading-relaxed'>{topic}</span>
																	</li>
																))}
															</ul>
														) : (
															<p className='text-xs sm:text-sm text-gray-600 italic'>No significant topics identified</p>
														)}
													</CardContent>
												</Card>

												{/* Active Contributors */}
												<Card>
													<CardHeader className='pb-3'>
														<CardTitle className='flex items-center space-x-2 text-sm sm:text-base'>
															<Users className='w-4 h-4 sm:w-5 sm:h-5' />
															<span>Active Contributors</span>
														</CardTitle>
													</CardHeader>
													<CardContent className='pt-0'>
														{recap.recapData.activeContributors.length > 0 ? (
															<div className='flex flex-wrap gap-1.5 sm:gap-2'>
																{recap.recapData.activeContributors.map((contributor, contributorIndex) => (
																	<Badge key={contributorIndex} variant='outline' className='text-xs'>
																		{contributor}
																	</Badge>
																))}
															</div>
														) : (
															<p className='text-xs sm:text-sm text-gray-600 italic'>No active contributors identified</p>
														)}
													</CardContent>
												</Card>

												{/* Key Decisions & Announcements */}
												<Card>
													<CardHeader className='pb-3'>
														<CardTitle className='flex items-center space-x-2 text-sm sm:text-base'>
															<Calendar className='w-4 h-4 sm:w-5 sm:h-5' />
															<span className='hidden sm:inline'>Key Decisions & Announcements</span>
															<span className='sm:hidden'>Key Decisions</span>
														</CardTitle>
													</CardHeader>
													<CardContent className='pt-0'>
														{recap.recapData.keyDecisions.length > 0 ? (
															<ul className='space-y-2'>
																{recap.recapData.keyDecisions.map((decision, decisionIndex) => (
																	<li key={decisionIndex} className='flex items-start space-x-2'>
																		<div className='w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0' />
																		<span className='text-xs sm:text-sm text-gray-900 leading-relaxed'>{decision}</span>
																	</li>
																))}
															</ul>
														) : (
															<p className='text-xs sm:text-sm text-gray-600 italic'>No key decisions identified</p>
														)}
													</CardContent>
												</Card>

												{/* Important Resources */}
												<Card>
													<CardHeader className='pb-3'>
														<CardTitle className='flex items-center space-x-2 text-sm sm:text-base'>
															<Link className='w-4 h-4 sm:w-5 sm:h-5' />
															<span>Important Resources</span>
														</CardTitle>
													</CardHeader>
													<CardContent className='pt-0'>
														{recap.recapData.importantResources.length > 0 ? (
															<ul className='space-y-2'>
																{recap.recapData.importantResources.map((resource, resourceIndex) => (
																	<li key={resourceIndex} className='flex items-start space-x-2'>
																		<div className='w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0' />
																		<span className='text-xs sm:text-sm text-gray-900 leading-relaxed'>{resource}</span>
																	</li>
																))}
															</ul>
														) : (
															<p className='text-xs sm:text-sm text-gray-600 italic'>No important resources identified</p>
														)}
													</CardContent>
												</Card>
											</div>

											{index !== selectedRecaps.length - 1 && <hr className='border-gray-200' />}
										</div>
									))}
								</div>
							)}
						</div>
					</TabsContent>
				</Tabs>

				{/* Footer */}
				<div className='mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-500'>
					<a href='https://usewaly.com' target='_blank' rel='noopener noreferrer' className='hover:text-gray-700 transition-colors'>
						Powered by Waly
					</a>
				</div>
			</div>
		</div>
	);
}
