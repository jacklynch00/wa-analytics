'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Search, Filter, Eye, Check, X, Clock, Users, Mail, FileText, MoreVertical, Send, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { ApplicationForm, MemberApplication } from '@prisma/client';

interface FormQuestion {
	id: string;
	label: string;
	type: string;
	required: boolean;
	placeholder?: string;
	options?: string[];
}

interface FormResponsesTabProps {
	communityId: string;
	applicationForm: (ApplicationForm & { questions: FormQuestion[] }) | null;
}

export default function FormResponsesTab({ communityId, applicationForm }: FormResponsesTabProps) {
	const handleBulkImport = () => {
		window.location.href = `/dashboard/community/${communityId}/bulk-import`;
	};
	const [applications, setApplications] = useState<MemberApplication[]>([]);
	const [loading, setLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [selectedApplication, setSelectedApplication] = useState<MemberApplication | null>(null);
	const [fullFormData, setFullFormData] = useState<(ApplicationForm & { questions: FormQuestion[] }) | null>(null);
	const [updatingApplications, setUpdatingApplications] = useState<Set<string>>(new Set());
	const [resendingEmails, setResendingEmails] = useState<Set<string>>(new Set());

	const loadApplications = useCallback(async () => {
		if (!applicationForm) return;

		setLoading(true);
		try {
			const params = new URLSearchParams();
			if (searchTerm) params.append('search', searchTerm);
			if (statusFilter !== 'all') params.append('status', statusFilter);

			const response = await fetch(`/api/communities/${communityId}/applications?${params}`);
			if (!response.ok) throw new Error('Failed to load applications');

			const result = await response.json();
			setApplications(result.applications);
		} catch (error) {
			console.error('Error loading applications:', error);
			toast.error('Failed to load applications');
		} finally {
			setLoading(false);
		}
	}, [applicationForm, searchTerm, statusFilter, communityId]);

	const loadFullFormData = useCallback(async () => {
		if (!applicationForm) return;

		try {
			const response = await fetch(`/api/communities/${communityId}/form`);
			if (!response.ok) throw new Error('Failed to load form data');

			const result = await response.json();
			setFullFormData(result.form);
		} catch (error) {
			console.error('Error loading form data:', error);
		}
	}, [applicationForm, communityId]);

	const updateApplicationStatus = async (applicationId: string, newStatus: 'ACCEPTED' | 'DENIED') => {
		// Add to updating set
		setUpdatingApplications((prev) => new Set(prev).add(applicationId));

		// Optimistic update for applications list
		setApplications((prev) =>
			prev.map((app) =>
				app.id === applicationId
					? {
							...app,
							status: newStatus,
							// reviewedAt should remain a Date, not a string
							reviewedAt: new Date(),
						}
					: app
			)
		);

		// Optimistic update for selected application in dialog
		if (selectedApplication?.id === applicationId) {
			setSelectedApplication((prev) =>
				prev
					? {
							...prev,
							status: newStatus,
							reviewedAt: new Date(),
						}
					: null
			);
		}

		try {
			const response = await fetch(`/api/applications/${applicationId}/status`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: newStatus }),
			});

			if (!response.ok) throw new Error('Failed to update status');

			toast.success(`Application ${newStatus.toLowerCase()} successfully`);
		} catch (error) {
			console.error('Error updating status:', error);
			toast.error('Failed to update application status');
			// Revert optimistic update on error
			await loadApplications();
			// Also reload the selected application if it's the one that failed
			if (selectedApplication?.id === applicationId) {
				const originalApp = applications.find((app) => app.id === applicationId);
				if (originalApp) {
					setSelectedApplication(originalApp);
				}
			}
		} finally {
			// Remove from updating set
			setUpdatingApplications((prev) => {
				const newSet = new Set(prev);
				newSet.delete(applicationId);
				return newSet;
			});
		}
	};

	const resendEmail = async (applicationId: string, emailType: 'confirmation' | 'acceptance' | 'denial') => {
		const emailKey = `${applicationId}-${emailType}`;
		setResendingEmails((prev) => new Set(prev).add(emailKey));

		try {
			const response = await fetch(`/api/applications/${applicationId}/resend-email`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ emailType }),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to resend email');
			}

			toast.success(result.message || 'Email sent successfully');
		} catch (error) {
			console.error('Error resending email:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to resend email');
		} finally {
			setResendingEmails((prev) => {
				const newSet = new Set(prev);
				newSet.delete(emailKey);
				return newSet;
			});
		}
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case 'PENDING':
				return (
					<Badge variant='outline' className='text-yellow-600 border-yellow-300'>
						<Clock className='w-3 h-3 mr-1' />
						Pending
					</Badge>
				);
			case 'ACCEPTED':
				return (
					<Badge variant='default' className='bg-green-600'>
						<Check className='w-3 h-3 mr-1' />
						Accepted
					</Badge>
				);
			case 'DENIED':
				return (
					<Badge variant='destructive'>
						<X className='w-3 h-3 mr-1' />
						Denied
					</Badge>
				);
			default:
				return <Badge variant='outline'>{status}</Badge>;
		}
	};

	const exportToCSV = () => {
		if (!fullFormData?.questions || applications.length === 0) {
			toast.error('No data to export');
			return;
		}

		// Create CSV headers
		const headers = ['Email', 'Status', 'Submitted Date', 'Reviewed Date'];
		fullFormData.questions?.forEach((question) => {
			headers.push(question.label);
		});

		// Create CSV rows
		const rows = applications.map((application) => {
			const row = [
				application.email,
				application.status,
				new Date(application.createdAt).toLocaleDateString(),
				application.reviewedAt ? new Date(application.reviewedAt).toLocaleDateString() : 'Not reviewed',
			];

			// Add responses for each question
			fullFormData.questions?.forEach((question) => {
				const response = (application.responses as Record<string, unknown>)?.[question.id];
				if (Array.isArray(response)) {
					row.push(response.join('; '));
				} else {
					row.push(String(response || ''));
				}
			});

			return row;
		});

		// Convert to CSV format
		const csvContent = [headers.map((header) => `"${header}"`).join(','), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join(
			'\n'
		);

		// Create and download file
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		const url = URL.createObjectURL(blob);
		link.setAttribute('href', url);
		link.setAttribute('download', `applications-${applicationForm?.title || 'export'}-${new Date().toISOString().split('T')[0]}.csv`);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);

		toast.success('Applications exported to CSV successfully');
	};

	useEffect(() => {
		if (applicationForm) {
			loadApplications();
			loadFullFormData();
		}
	}, [applicationForm, loadApplications, loadFullFormData]);

	if (!applicationForm) {
		return (
			<Card className='bg-white/70 backdrop-blur-sm border-white/60 shadow-lg'>
				<CardContent className='p-6 sm:p-12 text-center'>
					<FileText className='mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400' />
					<h3 className='mt-4 text-base sm:text-lg font-medium text-gray-900'>No Application Form</h3>
					<p className='mt-2 text-sm text-gray-600'>Create an application form to start receiving and managing member applications.</p>
					<div className='mt-4 sm:mt-6'>
						<Button onClick={() => (window.location.href = `/dashboard/community/${communityId}/form-builder`)}>
							<Plus className='w-4 h-4 mr-2' />
							Create Application Form
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Filters and Search */}
			<Card className='bg-white/70 backdrop-blur-sm border-white/60 shadow-lg'>
				<CardContent className='p-4'>
					<div className='flex flex-col sm:flex-row gap-4'>
						<div className='flex-1'>
							<div className='relative'>
								<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
								<Input placeholder='Search by email...' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className='pl-10' />
							</div>
						</div>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className='w-full sm:w-[180px]'>
								<Filter className='w-4 h-4 mr-2' />
								<SelectValue placeholder='Filter by status' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>All Status</SelectItem>
								<SelectItem value='PENDING'>Pending</SelectItem>
								<SelectItem value='ACCEPTED'>Accepted</SelectItem>
								<SelectItem value='DENIED'>Denied</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Applications Table */}
			<Card className='bg-white/70 backdrop-blur-sm border-white/60 shadow-lg'>
				<CardHeader>
					<div className='flex justify-between items-center'>
						<CardTitle className='text-lg'>Applications</CardTitle>
						<div className='flex items-center gap-2'>
							<Button variant='outline' size='sm' onClick={handleBulkImport} disabled={!applicationForm}>
								<Upload className='w-4 h-4 mr-2' />
								Bulk Import
							</Button>
							<Button variant='outline' size='sm' onClick={exportToCSV} disabled={applications.length === 0}>
								<Download className='w-4 h-4 mr-2' />
								Export CSV
							</Button>
							<Badge variant='outline'>{applications.length} total</Badge>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className='flex justify-center py-8'>
							<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
						</div>
					) : applications.length === 0 ? (
						<div className='text-center py-8'>
							<Users className='mx-auto h-12 w-12 text-gray-400' />
							<h3 className='mt-4 text-lg font-medium text-gray-900'>No Applications Yet</h3>
							<p className='mt-2 text-sm text-gray-600'>
								{statusFilter === 'all' ? 'No applications have been submitted yet.' : `No ${statusFilter.toLowerCase()} applications found.`}
							</p>
						</div>
					) : (
						<div className='overflow-x-auto'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Email</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Submitted</TableHead>
										<TableHead className='text-right'>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{applications.map((application) => (
										<TableRow key={application.id}>
											<TableCell>
												<div className='flex items-center gap-2'>
													<Mail className='w-4 h-4 text-gray-400' />
													<span className='font-medium'>{application.email}</span>
												</div>
											</TableCell>
											<TableCell>{getStatusBadge(application.status)}</TableCell>
											<TableCell>
												<span className='text-sm text-gray-600'>{new Date(application.createdAt).toLocaleDateString()}</span>
											</TableCell>
											<TableCell className='text-right'>
												<div className='flex items-center gap-2 justify-end'>
													<Dialog>
														<DialogTrigger asChild>
															<Button variant='outline' size='sm' onClick={() => setSelectedApplication(application)}>
																<Eye className='w-4 h-4 mr-1' />
																View
															</Button>
														</DialogTrigger>
														<DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
															<DialogHeader>
																<DialogTitle>Application Details</DialogTitle>
																<DialogDescription>Review the application and take action</DialogDescription>
															</DialogHeader>
															{selectedApplication && (
																<div className='space-y-4'>
																	<div className='flex items-center justify-between'>
																		<div>
																			<p className='font-medium'>{selectedApplication.email}</p>
																			<p className='text-sm text-gray-600'>
																				Submitted {new Date(selectedApplication.createdAt).toLocaleDateString()}
																			</p>
																		</div>
																		{getStatusBadge(selectedApplication.status)}
																	</div>

																	<div className='border rounded-lg p-4 space-y-4'>
																		<h4 className='font-medium'>Responses</h4>
																		{fullFormData?.questions?.map((question) => {
																			const answer = (selectedApplication.responses as Record<string, unknown>)?.[question.id];
																			if (!answer) return null;

																			return (
																				<div key={question.id} className='space-y-2'>
																					<p className='text-sm font-medium text-gray-900'>{question.label}</p>
																					<p className='text-sm text-gray-700 bg-gray-50 p-3 rounded-md'>
																						{Array.isArray(answer) ? answer.join(', ') : String(answer)}
																					</p>
																				</div>
																			);
																		}) || <div className='text-sm text-gray-500'>Loading form questions...</div>}
																	</div>

																	<div className='flex flex-col gap-4 pt-4'>
																		{selectedApplication.status === 'PENDING' && (
																			<div className='flex gap-2'>
																				<Button
																					onClick={() => updateApplicationStatus(selectedApplication.id, 'ACCEPTED')}
																					className='flex-1 bg-green-600 hover:bg-green-700'
																					disabled={updatingApplications.has(selectedApplication.id)}>
																					{updatingApplications.has(selectedApplication.id) ? (
																						<div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
																					) : (
																						<Check className='w-4 h-4 mr-2' />
																					)}
																					Accept
																				</Button>
																				<Button
																					variant='outline'
																					onClick={() => updateApplicationStatus(selectedApplication.id, 'DENIED')}
																					className='flex-1'
																					disabled={updatingApplications.has(selectedApplication.id)}>
																					{updatingApplications.has(selectedApplication.id) ? (
																						<div className='w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2' />
																					) : (
																						<X className='w-4 h-4 mr-2' />
																					)}
																					Deny
																				</Button>
																			</div>
																		)}

																		<div className='border-t pt-4'>
																			<h5 className='text-sm font-medium text-gray-700 mb-2'>Email Actions</h5>
																			<div className='flex flex-wrap gap-2'>
																				<Button
																					variant='outline'
																					size='sm'
																					onClick={() => resendEmail(selectedApplication.id, 'confirmation')}
																					disabled={resendingEmails.has(`${selectedApplication.id}-confirmation`)}>
																					{resendingEmails.has(`${selectedApplication.id}-confirmation`) ? (
																						<div className='w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2' />
																					) : (
																						<Send className='w-4 h-4 mr-2' />
																					)}
																					Resend Confirmation
																				</Button>
																				{selectedApplication.status === 'ACCEPTED' && (
																					<Button
																						variant='outline'
																						size='sm'
																						onClick={() => resendEmail(selectedApplication.id, 'acceptance')}
																						disabled={resendingEmails.has(`${selectedApplication.id}-acceptance`)}>
																						{resendingEmails.has(`${selectedApplication.id}-acceptance`) ? (
																							<div className='w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2' />
																						) : (
																							<Send className='w-4 h-4 mr-2' />
																						)}
																						Resend Acceptance
																					</Button>
																				)}
																				{selectedApplication.status === 'DENIED' && (
																					<Button
																						variant='outline'
																						size='sm'
																						onClick={() => resendEmail(selectedApplication.id, 'denial')}
																						disabled={resendingEmails.has(`${selectedApplication.id}-denial`)}>
																						{resendingEmails.has(`${selectedApplication.id}-denial`) ? (
																							<div className='w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2' />
																						) : (
																							<Send className='w-4 h-4 mr-2' />
																						)}
																						Resend Denial
																					</Button>
																				)}
																			</div>
																		</div>
																	</div>
																</div>
															)}
														</DialogContent>
													</Dialog>

													{application.status === 'PENDING' && (
														<>
															<Button
																size='sm'
																onClick={() => updateApplicationStatus(application.id, 'ACCEPTED')}
																disabled={updatingApplications.has(application.id)}
																className='bg-green-600 hover:bg-green-700'>
																{updatingApplications.has(application.id) ? (
																	<div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
																) : (
																	<Check className='w-4 h-4' />
																)}
															</Button>
															<Button
																variant='outline'
																size='sm'
																onClick={() => updateApplicationStatus(application.id, 'DENIED')}
																disabled={updatingApplications.has(application.id)}>
																{updatingApplications.has(application.id) ? (
																	<div className='w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin' />
																) : (
																	<X className='w-4 h-4' />
																)}
															</Button>
														</>
													)}

													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button variant='outline' size='sm'>
																<MoreVertical className='w-4 h-4' />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align='end'>
															<DropdownMenuItem
																onClick={() => resendEmail(application.id, 'confirmation')}
																disabled={resendingEmails.has(`${application.id}-confirmation`)}>
																{resendingEmails.has(`${application.id}-confirmation`) ? (
																	<div className='w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2' />
																) : (
																	<Send className='w-4 h-4 mr-2' />
																)}
																Resend Confirmation Email
															</DropdownMenuItem>
															{application.status === 'ACCEPTED' && (
																<DropdownMenuItem
																	onClick={() => resendEmail(application.id, 'acceptance')}
																	disabled={resendingEmails.has(`${application.id}-acceptance`)}>
																	{resendingEmails.has(`${application.id}-acceptance`) ? (
																		<div className='w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2' />
																	) : (
																		<Send className='w-4 h-4 mr-2' />
																	)}
																	Resend Acceptance Email
																</DropdownMenuItem>
															)}
															{application.status === 'DENIED' && (
																<DropdownMenuItem
																	onClick={() => resendEmail(application.id, 'denial')}
																	disabled={resendingEmails.has(`${application.id}-denial`)}>
																	{resendingEmails.has(`${application.id}-denial`) ? (
																		<div className='w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2' />
																	) : (
																		<Send className='w-4 h-4 mr-2' />
																	)}
																	Resend Denial Email
																</DropdownMenuItem>
															)}
														</DropdownMenuContent>
													</DropdownMenu>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
