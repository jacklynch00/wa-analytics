'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MemberProfile } from '@/types';
import { Users, MessageCircle, Calendar, Lock, Eye, EyeOff, Search } from 'lucide-react';
import { format } from 'date-fns';
import { Pagination, usePagination } from '@/components/ui/pagination';

interface SharedDirectoryData {
	members: MemberProfile[];
	title: string;
	isPasswordProtected: boolean;
	password?: string;
	expiresAt: string;
	totalMessages: number;
	totalMembers: number;
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

	const loadDirectory = useCallback(async (passwordAttempt?: string) => {
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
	}, [shareId]);

	useEffect(() => {
		loadDirectory();
	}, [shareId, loadDirectory]);

	const handlePasswordSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (password.trim()) {
			loadDirectory(password);
		}
	};

	// Filter members based on search query
	const filteredMembers = directoryData?.members?.filter(member =>
		member.name.toLowerCase().includes(searchQuery.toLowerCase())
	) || [];

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
					<div className='py-6'>
						<h1 className='text-3xl font-bold text-gray-900'>{directoryData.title}</h1>
						<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2'>
							<p className='text-sm text-gray-600'>
								Public Member Directory • Expires {format(new Date(directoryData.expiresAt), 'MMM dd, yyyy')}
								{directoryData.password && (
									<span className='ml-2'>• Password: <span className='font-mono bg-gray-100 px-2 py-1 rounded'>{directoryData.password}</span></span>
								)}
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				{/* Summary */}
				<div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
					<Card>
						<CardContent className='p-6'>
							<div className='flex items-center'>
								<Users className='h-8 w-8 text-blue-600' />
								<div className='ml-4'>
									<p className='text-sm font-medium text-gray-600'>Total Members</p>
									<p className='text-2xl font-bold text-gray-900'>{directoryData.totalMembers}</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-6'>
							<div className='flex items-center'>
								<MessageCircle className='h-8 w-8 text-green-600' />
								<div className='ml-4'>
									<p className='text-sm font-medium text-gray-600'>Total Messages</p>
									<p className='text-2xl font-bold text-gray-900'>{directoryData.totalMessages.toLocaleString()}</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-6'>
							<div className='flex items-center'>
								<Calendar className='h-8 w-8 text-purple-600' />
								<div className='ml-4'>
									<p className='text-sm font-medium text-gray-600'>Average Messages</p>
									<p className='text-2xl font-bold text-gray-900'>{Math.round(directoryData.totalMessages / directoryData.totalMembers)}</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Member Directory */}
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center justify-between'>
							<span>Member Directory</span>
							<Badge variant='secondary'>{totalItems} {searchQuery ? 'filtered' : 'total'} members</Badge>
						</CardTitle>
						<div className='relative mt-4'>
							<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
							<Input
								placeholder='Search members...'
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className='pl-10'
							/>
						</div>
					</CardHeader>
					<CardContent>
						{filteredMembers.length === 0 && searchQuery ? (
							<div className='text-center py-8'>
								<Search className='mx-auto h-12 w-12 text-gray-400' />
								<h3 className='mt-4 text-lg font-medium text-gray-900'>No members found</h3>
								<p className='mt-2 text-sm text-gray-600'>
									No members match your search for &ldquo;{searchQuery}&rdquo;. Try a different search term.
								</p>
							</div>
						) : (
							<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
								{paginatedMembers.map((member) => (
								<div key={member.name} className='p-4 rounded-lg hover:bg-gray-50 transition-colors bg-white shadow-sm'>
									<div className='flex items-center space-x-3'>
										<div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
											<span className='text-blue-600 font-semibold'>{member.name.charAt(0).toUpperCase()}</span>
										</div>
										<div className='flex-1 min-w-0'>
											<h3 className='font-medium text-gray-900 truncate'>{member.name}</h3>
											<div className='text-sm text-gray-500'>
												<div className='flex items-center space-x-1'>
													<MessageCircle className='w-3 h-3' />
													<span>{member.totalMessages} messages</span>
												</div>
												<div className='flex items-center space-x-1 mt-1'>
													<Calendar className='w-3 h-3' />
													<span>Last active: {format(member.lastActive, 'MMM dd')}</span>
												</div>
											</div>
										</div>
									</div>
								</div>
								))}
							</div>
						)}

						{totalPages > 1 && !searchQuery && (
							<div className='mt-6'>
								<Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} itemsPerPage={itemsPerPage} totalItems={totalItems} />
							</div>
						)}
					</CardContent>
				</Card>

				{/* Footer */}
				<div className='mt-8 text-center text-sm text-gray-500'>
					<p>Generated by WhatsApp Community Analytics</p>
				</div>
			</div>
		</div>
	);
}
