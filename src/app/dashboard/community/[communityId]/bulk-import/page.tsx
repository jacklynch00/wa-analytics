'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Upload, FileText, Users, AlertTriangle, Check, X, Clock, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface FormQuestion {
	id: string;
	label: string;
	type: string;
	required: boolean;
}

interface ApplicationForm {
	id: string;
	title: string;
	questions: FormQuestion[];
}

interface Community {
	id: string;
	name: string;
	applicationForm?: ApplicationForm;
}

interface CSVRow {
	[key: string]: string;
}

interface ParsedMember {
	id: string;
	data: { [questionId: string]: string };
	status: 'PENDING' | 'ACCEPTED' | 'DENIED';
	isDuplicate: boolean;
	isSelected: boolean;
	duplicateEmail?: string;
}

interface FieldMapping {
	[csvColumn: string]: string; // maps to question ID or 'new:fieldName'
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'processing' | 'complete';

export default function BulkImportPage() {
	const params = useParams();
	const router = useRouter();
	const communityId = params.communityId as string;

	const [community, setCommunity] = useState<Community | null>(null);
	const [loading, setLoading] = useState(true);
	const [currentStep, setCurrentStep] = useState<ImportStep>('upload');

	// CSV Upload state
	const [csvFile, setCsvFile] = useState<File | null>(null);
	const [csvData, setCsvData] = useState<CSVRow[]>([]);
	const [csvHeaders, setCsvHeaders] = useState<string[]>([]);

	// Field mapping state
	const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});

	// Preview state
	const [parsedMembers, setParsedMembers] = useState<ParsedMember[]>([]);
	const [existingEmails, setExistingEmails] = useState<Set<string>>(new Set());
	const [defaultStatus] = useState<'PENDING' | 'ACCEPTED' | 'DENIED'>('PENDING');

	// Bulk actions state
	const [selectAll, setSelectAll] = useState(true);
	const [bulkStatus, setBulkStatus] = useState<'PENDING' | 'ACCEPTED' | 'DENIED'>('PENDING');

	const loadCommunity = useCallback(async () => {
		try {
			const response = await fetch(`/api/communities/${communityId}`);
			if (!response.ok) throw new Error('Failed to load community');

			const result = await response.json();
			console.log('Loaded community:', result.community);
			setCommunity(result.community);

			if (!result.community.applicationForm) {
				toast.error('This community does not have an application form. Please create one first.');
				router.push(`/dashboard/community/${communityId}`);
				return;
			}

			console.log('Application form:', result.community.applicationForm);
			console.log('Form questions:', result.community.applicationForm.questions);
		} catch (error) {
			console.error('Error loading community:', error);
			toast.error('Failed to load community');
			router.push(`/dashboard/community/${communityId}`);
		} finally {
			setLoading(false);
		}
	}, [communityId, router]);

	const loadExistingEmails = useCallback(async () => {
		try {
			const response = await fetch(`/api/communities/${communityId}/applications`);
			if (response.ok) {
				const result = await response.json();
				const emails = new Set<string>(result.applications.map((app: { email: string }) => app.email.toLowerCase()));
				setExistingEmails(emails);
			}
		} catch (error) {
			console.error('Error loading existing emails:', error);
		}
	}, [communityId]);

	useEffect(() => {
		loadCommunity();
		loadExistingEmails();
	}, [loadCommunity, loadExistingEmails]);

	const generateTemplate = () => {
		if (!community?.applicationForm?.questions) return;

		const headers = ['name', 'email', 'phone', 'linkedin', 'status'];
		// Add form-specific questions
		community.applicationForm.questions.forEach((q) => {
			if (!headers.includes(q.label.toLowerCase())) {
				headers.push(q.label);
			}
		});

		const csvContent = [
			headers.map((h) => `"${h}"`).join(','),
			// Sample data row
			'"John Doe","john@example.com","555-123-4567","https://linkedin.com/in/johndoe","PENDING"',
		].join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		const url = URL.createObjectURL(blob);
		link.setAttribute('href', url);
		link.setAttribute('download', `member-import-template-${community.name.replace(/\s+/g, '-').toLowerCase()}.csv`);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);

		toast.success('Template downloaded successfully');
	};

	const parseCSV = (text: string): { headers: string[]; data: CSVRow[] } => {
		const lines = text.split('\n').filter((line) => line.trim());
		if (lines.length < 2) throw new Error('CSV must have at least a header row and one data row');

		// More robust CSV parsing that handles quoted fields with commas
		const parseCSVLine = (line: string): string[] => {
			const result: string[] = [];
			let current = '';
			let inQuotes = false;
			let i = 0;

			while (i < line.length) {
				const char = line[i];
				const nextChar = line[i + 1];

				if (char === '"') {
					if (inQuotes && nextChar === '"') {
						// Escaped quote
						current += '"';
						i += 2;
					} else {
						// Start or end of quoted field
						inQuotes = !inQuotes;
						i++;
					}
				} else if (char === ',' && !inQuotes) {
					// Field separator
					result.push(current.trim());
					current = '';
					i++;
				} else {
					current += char;
					i++;
				}
			}

			// Add the last field
			result.push(current.trim());
			return result;
		};

		const headers = parseCSVLine(lines[0]);
		const data: CSVRow[] = [];

		console.log('Parsed headers:', headers);
		console.log('Total lines:', lines.length);

		for (let i = 1; i < lines.length; i++) {
			const values = parseCSVLine(lines[i]);
			console.log(`Row ${i}:`, values);

			if (values.length > 0 && values.some((v) => v.trim())) {
				const row: CSVRow = {};
				headers.forEach((header, index) => {
					row[header] = values[index] || '';
				});
				data.push(row);
			}
		}

		console.log('Parsed data:', data);
		return { headers, data };
	};

	const autoDetectMapping = (headers: string[]): FieldMapping => {
		if (!community?.applicationForm?.questions) {
			console.log('No questions available for auto-detection');
			return {};
		}

		const mapping: FieldMapping = {};
		const questions = community.applicationForm.questions;

		console.log('Available questions:', questions);
		console.log('CSV headers to map:', headers);

		headers.forEach((header) => {
			const lowerHeader = header.toLowerCase();

			// Find matching question
			const matchingQuestion = questions.find((q) => {
				const lowerLabel = q.label.toLowerCase();
				return (
					lowerLabel.includes(lowerHeader) ||
					lowerHeader.includes(lowerLabel) ||
					(lowerHeader === 'email' && lowerLabel.includes('email')) ||
					(lowerHeader === 'name' && lowerLabel.includes('name')) ||
					(lowerHeader === 'phone' && lowerLabel.includes('phone')) ||
					(lowerHeader === 'linkedin' && lowerLabel.includes('linkedin'))
				);
			});

			if (matchingQuestion) {
				mapping[header] = matchingQuestion.id;
				console.log(`Mapped "${header}" to question "${matchingQuestion.label}"`);
			} else {
				// Default to skip for unmapped columns - user can manually choose to create new fields
				console.log(`No match found for header "${header}" - defaulting to skip`);
			}
		});

		console.log('Final mapping:', mapping);
		return mapping;
	};

	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		if (!file.name.endsWith('.csv')) {
			toast.error('Please upload a CSV file');
			return;
		}

		setCsvFile(file);

		try {
			const text = await file.text();
			const { headers, data } = parseCSV(text);

			setCsvHeaders(headers);
			setCsvData(data);

			// Auto-detect field mapping
			const detectedMapping = autoDetectMapping(headers);
			setFieldMapping(detectedMapping);

			setCurrentStep('mapping');
			toast.success(`CSV parsed successfully: ${data.length} rows found`);
		} catch (error) {
			console.error('Error parsing CSV:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to parse CSV file');
		}
	};

	const proceedToPreview = () => {
		if (!community?.applicationForm?.questions) return;

		const members: ParsedMember[] = csvData.map((row, index) => {
			const data: { [questionId: string]: string } = {};

			// Map CSV data to form questions (existing and new fields)
			Object.entries(fieldMapping).forEach(([csvColumn, questionId]) => {
				if (questionId && row[csvColumn]) {
					data[questionId] = row[csvColumn];
				}
			});

			// Get email for duplicate detection (check both existing questions and new fields)
			const emailQuestion = community.applicationForm!.questions.find((q) => q.label.toLowerCase().includes('email'));
			let email = emailQuestion ? data[emailQuestion.id] : '';

			// Also check if email is mapped as a new field
			if (!email) {
				const emailMapping = Object.entries(fieldMapping).find(([csvCol, mapping]) => csvCol.toLowerCase().includes('email') && mapping.startsWith('new:'));
				if (emailMapping) {
					email = data[emailMapping[1]] || '';
				}
			}

			// Check for status in CSV data
			let status: 'PENDING' | 'ACCEPTED' | 'DENIED' = defaultStatus;
			if (row.status) {
				const csvStatus = row.status.toUpperCase();
				if (['PENDING', 'ACCEPTED', 'DENIED'].includes(csvStatus)) {
					status = csvStatus as 'PENDING' | 'ACCEPTED' | 'DENIED';
				}
			}

			return {
				id: `temp-${index}`,
				data,
				status,
				isDuplicate: email ? existingEmails.has(email.toLowerCase()) : false,
				isSelected: true,
				duplicateEmail: email || undefined,
			};
		});

		setParsedMembers(members);
		setCurrentStep('preview');
	};

	const handleBulkStatusChange = (status: 'PENDING' | 'ACCEPTED' | 'DENIED') => {
		setParsedMembers((prev) => prev?.map((member) => (member.isSelected ? { ...member, status } : member)) || []);
		setBulkStatus(status);
	};

	const handleSelectAll = (checked: boolean) => {
		setSelectAll(checked);
		setParsedMembers((prev) => prev?.map((member) => ({ ...member, isSelected: checked })) || []);
	};

	const removeSelected = () => {
		setParsedMembers((prev) => prev?.filter((member) => !member.isSelected) || []);
		setSelectAll(false);
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

	const submitImport = async () => {
		const selectedMembers = parsedMembers?.filter((m) => m.isSelected) || [];
		if (selectedMembers.length === 0) {
			toast.error('Please select at least one member to import');
			return;
		}

		setCurrentStep('processing');

		try {
			const response = await fetch(`/api/communities/${communityId}/bulk-import`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					members: selectedMembers.map((m) => ({
						responses: m.data,
						status: m.status,
					})),
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to import members');
			}

			const result = await response.json();
			setCurrentStep('complete');
			toast.success(`Successfully imported ${result.imported} members`);
		} catch (error) {
			console.error('Error importing members:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to import members');
			setCurrentStep('preview');
		}
	};

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
			</div>
		);
	}

	return (
		<div className='min-h-screen'>
			<div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				{/* Step Indicator */}
				<div className='mb-8'>
					<div className='flex items-center justify-center space-x-4'>
						{[
							{ key: 'upload', label: 'Upload CSV', icon: Upload },
							{ key: 'mapping', label: 'Map Fields', icon: FileText },
							{ key: 'preview', label: 'Preview & Configure', icon: Users },
						].map((step, index) => {
							const StepIcon = step.icon;
							const isActive = currentStep === step.key;
							const isCompleted = ['upload', 'mapping', 'preview'].indexOf(currentStep) > index;

							return (
								<div key={step.key} className='flex items-center'>
									<div
										className={`flex items-center justify-center w-10 h-10 rounded-full ${
											isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
										}`}>
										<StepIcon className='w-5 h-5' />
									</div>
									<span className={`ml-2 text-sm font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
										{step.label}
									</span>
									{index < 2 && <div className='w-8 h-px bg-gray-300 mx-4' />}
								</div>
							);
						})}
					</div>
				</div>

				{/* Step Content */}
				{currentStep === 'upload' && (
					<Card className='bg-white/70 backdrop-blur-sm border-white/60 shadow-lg'>
						<CardHeader>
							<CardTitle>Upload Member Data</CardTitle>
							<p className='text-sm text-gray-600'>Upload a CSV file with your member information, or download our template to get started.</p>
						</CardHeader>
						<CardContent className='space-y-6'>
							<div className='flex gap-4'>
								<Button variant='outline' onClick={generateTemplate}>
									<Download className='w-4 h-4 mr-2' />
									Download Template
								</Button>
							</div>

							<div className='border-2 border-dashed flex flex-col items-center justify-center border-gray-300 rounded-lg p-8 text-center'>
								<Upload className='mx-auto h-12 w-12 text-gray-400 mb-4' />
								<div className='space-y-2'>
									<Label htmlFor='csv-upload' className='text-base font-medium cursor-pointer'>
										Upload your CSV file
									</Label>
									<p className='text-sm text-gray-500'>CSV files only. Maximum file size: 10MB</p>
								</div>
								<Input id='csv-upload' type='file' accept='.csv' onChange={handleFileUpload} className='mt-4 max-w-xs' />
							</div>

							{csvFile && (
								<div className='bg-green-50 p-4 rounded-lg'>
									<div className='flex items-center'>
										<Check className='w-5 h-5 text-green-600 mr-2' />
										<span className='text-green-800 font-medium'>{csvFile.name} uploaded successfully</span>
									</div>
									<p className='text-sm text-green-700 mt-1'>{csvData.length} rows found. Ready to proceed to field mapping.</p>
								</div>
							)}
						</CardContent>
					</Card>
				)}

				{currentStep === 'mapping' &&
					(!community?.applicationForm?.questions ? (
						<Card className='bg-white/70 backdrop-blur-sm border-white/60 shadow-lg'>
							<CardContent className='p-12 text-center'>
								<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
								<p className='text-gray-600'>Loading application form...</p>
							</CardContent>
						</Card>
					) : (
						<Card className='bg-white/70 backdrop-blur-sm border-white/60 shadow-lg'>
							<CardHeader>
								<CardTitle>Map CSV Fields to Application Questions</CardTitle>
								<p className='text-sm text-gray-600'>Match your CSV columns to the corresponding application form questions.</p>
							</CardHeader>
							<CardContent className='space-y-6'>
								<div className='grid gap-4'>
									{csvHeaders?.map((header) => (
										<div key={header} className='flex items-center justify-between p-4 border rounded-lg'>
											<div className='flex-1'>
												<div className='font-medium'>{header}</div>
												<div className='text-sm text-gray-500'>Sample: {csvData[0]?.[header] || 'No data'}</div>
											</div>
											<div className='flex-1 max-w-xs'>
												<Select
													value={fieldMapping[header] || 'skip'}
													onValueChange={(value) =>
														setFieldMapping((prev) => ({
															...prev,
															[header]: value === 'skip' ? '' : value,
														}))
													}>
													<SelectTrigger>
														<SelectValue placeholder='Select question' />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value='skip'>Skip this field</SelectItem>
														<SelectItem value={`new:${header}`}>
															<div className='flex items-center'>
																<Plus className='w-3 h-3 mr-2 text-green-600' />
																Create new field: &quot;{header}&quot;
															</div>
														</SelectItem>
														{community.applicationForm?.questions?.map((q) => (
															<SelectItem key={q.id} value={q.id}>
																{q.label} {q.required && <span className='text-red-500'>*</span>}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
										</div>
									))}
								</div>

								<div className='flex justify-between'>
									<Button variant='outline' onClick={() => setCurrentStep('upload')}>
										Back
									</Button>
									<Button onClick={proceedToPreview}>Continue to Preview</Button>
								</div>
							</CardContent>
						</Card>
					))}

				{currentStep === 'preview' && (
					<Card className='bg-white/70 backdrop-blur-sm border-white/60 shadow-lg'>
						<CardHeader>
							<CardTitle className='flex items-center justify-between'>
								<span>Preview & Configure Import</span>
								<Badge variant='outline'>
									{parsedMembers?.filter((m) => m.isSelected).length || 0} of {parsedMembers?.length || 0} selected
								</Badge>
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-6'>
							{/* Bulk Actions */}
							<div className='flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg'>
								<div className='flex items-center space-x-2'>
									<Checkbox checked={selectAll} onCheckedChange={handleSelectAll} />
									<Label>Select All</Label>
								</div>

								<Select value={bulkStatus} onValueChange={handleBulkStatusChange}>
									<SelectTrigger className='w-40'>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='PENDING'>Mark as Pending</SelectItem>
										<SelectItem value='ACCEPTED'>Mark as Accepted</SelectItem>
										<SelectItem value='DENIED'>Mark as Denied</SelectItem>
									</SelectContent>
								</Select>

								<Button variant='outline' onClick={removeSelected} size='sm'>
									Remove Selected
								</Button>

								<div className='text-sm text-gray-600 flex items-center'>
									<AlertTriangle className='w-4 h-4 mr-1 text-amber-500' />
									{parsedMembers?.filter((m) => m.isDuplicate).length || 0} duplicate emails found
								</div>
							</div>

							{/* Data Preview Table */}
							<div className='border rounded-lg overflow-hidden'>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className='w-12'>
												<Checkbox checked={selectAll} onCheckedChange={handleSelectAll} />
											</TableHead>
											<TableHead>Email</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Info</TableHead>
											<TableHead>Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{parsedMembers?.slice(0, 10).map((member) => {
											const emailQuestion = community?.applicationForm?.questions.find((q) => q.label.toLowerCase().includes('email'));
											const email = emailQuestion ? member.data[emailQuestion.id] : 'No email';

											return (
												<TableRow key={member.id} className={member.isDuplicate ? 'bg-amber-50' : ''}>
													<TableCell>
														<Checkbox
															checked={member.isSelected}
															onCheckedChange={(checked) => {
																setParsedMembers((prev) => prev?.map((m) => (m.id === member.id ? { ...m, isSelected: !!checked } : m)) || []);
															}}
														/>
													</TableCell>
													<TableCell>
														<div className='flex items-center'>
															{email}
															{member.isDuplicate && <AlertTriangle className='w-4 h-4 ml-2 text-amber-500' />}
														</div>
													</TableCell>
													<TableCell>{getStatusBadge(member.status)}</TableCell>
													<TableCell className='text-sm text-gray-600'>
														<div>
															{Object.keys(member.data).length} fields mapped
															{Object.keys(member.data).some((key) => key.startsWith('new:')) && (
																<div className='text-green-600 text-xs flex items-center mt-1'>
																	<Plus className='w-3 h-3 mr-1' />
																	{Object.keys(member.data).filter((key) => key.startsWith('new:')).length} new fields
																</div>
															)}
														</div>
														{member.isDuplicate && <div className='text-amber-600 text-xs mt-1'>Duplicate email detected</div>}
													</TableCell>
													<TableCell>
														<Select
															value={member.status}
															onValueChange={(status: 'PENDING' | 'ACCEPTED' | 'DENIED') => {
																setParsedMembers((prev) => prev?.map((m) => (m.id === member.id ? { ...m, status } : m)) || []);
															}}>
															<SelectTrigger className='w-32'>
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value='PENDING'>Pending</SelectItem>
																<SelectItem value='ACCEPTED'>Accepted</SelectItem>
																<SelectItem value='DENIED'>Denied</SelectItem>
															</SelectContent>
														</Select>
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
								{(parsedMembers?.length || 0) > 10 && (
									<div className='p-4 text-center text-sm text-gray-600 border-t'>Showing first 10 of {parsedMembers?.length || 0} members</div>
								)}
							</div>

							<div className='flex justify-between'>
								<Button variant='outline' onClick={() => setCurrentStep('mapping')}>
									Back to Mapping
								</Button>
								<Button onClick={submitImport}>Import {parsedMembers?.filter((m) => m.isSelected).length || 0} Members</Button>
							</div>
						</CardContent>
					</Card>
				)}

				{currentStep === 'processing' && (
					<Card className='bg-white/70 backdrop-blur-sm border-white/60 shadow-lg'>
						<CardContent className='p-12 text-center'>
							<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
							<h3 className='text-lg font-medium text-gray-900 mb-2'>Importing Members...</h3>
							<p className='text-gray-600'>Please wait while we process your member data.</p>
						</CardContent>
					</Card>
				)}

				{currentStep === 'complete' && (
					<Card className='bg-white/70 backdrop-blur-sm border-white/60 shadow-lg'>
						<CardContent className='p-12 text-center'>
							<Check className='mx-auto h-12 w-12 text-green-600 mb-4' />
							<h3 className='text-lg font-medium text-gray-900 mb-2'>Import Complete!</h3>
							<p className='text-gray-600 mb-6'>Your members have been successfully imported.</p>
							<div className='flex gap-4 justify-center'>
								<Button onClick={() => router.push(`/dashboard/community/${communityId}`)}>Back to Community</Button>
								<Button
									variant='outline'
									onClick={() => {
										setCurrentStep('upload');
										setCsvFile(null);
										setCsvData([]);
										setCsvHeaders([]);
										setFieldMapping({});
										setParsedMembers([]);
									}}>
									Import More Members
								</Button>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
