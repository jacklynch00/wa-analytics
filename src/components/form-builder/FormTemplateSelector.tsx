'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Copy, FileText, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { FormQuestion } from '@/types';

interface FormTemplate {
	communityId: string;
	communityName: string;
	form: {
		id: string;
		title: string;
		description?: string;
		questions: FormQuestion[];
		customSlug: string;
		createdAt: string;
	};
}

interface FormTemplateSelectorProps {
	communityId: string;
	onTemplateSelected: (template: FormTemplate) => void;
}

export default function FormTemplateSelector({ communityId, onTemplateSelected }: FormTemplateSelectorProps) {
	const [templates, setTemplates] = useState<FormTemplate[]>([]);
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);

	const loadTemplates = useCallback(async () => {
		setLoading(true);
		try {
			const response = await fetch(`/api/communities/${communityId}/form/templates`);
			if (response.ok) {
				const data = await response.json();
				setTemplates(data.templates || []);
			} else {
				console.error('Failed to load templates');
				toast.error('Failed to load form templates');
			}
		} catch (error) {
			console.error('Error loading templates:', error);
			toast.error('Failed to load form templates');
		} finally {
			setLoading(false);
		}
	}, [communityId]);

	useEffect(() => {
		if (open) {
			loadTemplates();
		}
	}, [open, loadTemplates]);

	const handleTemplateSelect = (template: FormTemplate) => {
		onTemplateSelected(template);
		setOpen(false);
		toast.success(`Form template copied from ${template.communityName}`);
	};

	const getQuestionTypeCounts = (questions: FormQuestion[]) => {
		const counts = {
			text: 0,
			multiple_choice: 0,
			multiple_select: 0,
		};

		questions.forEach((question) => {
			if (question.type in counts) {
				counts[question.type as keyof typeof counts]++;
			}
		});

		return counts;
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant='outline' className='gap-2'>
					<Copy className='w-4 h-4' />
					Copy from Template
				</Button>
			</DialogTrigger>
			<DialogContent className='max-w-4xl max-h-[80vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle>Copy Form from Template</DialogTitle>
					<DialogDescription>Select a form from another community to use as a starting template.</DialogDescription>
				</DialogHeader>

				{loading ? (
					<div className='flex items-center justify-center py-8'>
						<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
					</div>
				) : templates.length === 0 ? (
					<div className='text-center py-8'>
						<FileText className='mx-auto h-12 w-12 text-gray-400 mb-4' />
						<h3 className='text-lg font-medium text-gray-900 mb-2'>No templates available</h3>
						<p className='text-gray-500'>You don&apos;t have any other communities with forms to use as templates.</p>
					</div>
				) : (
					<div className='grid gap-4'>
						{templates.map((template) => {
							const questionCounts = getQuestionTypeCounts(template.form.questions);
							const totalQuestions = template.form.questions.length;

							return (
								<Card key={template.form.id} className='hover:shadow-md transition-shadow'>
									<CardHeader className='pb-3'>
										<div className='flex items-start justify-between'>
											<div className='flex-1'>
												<CardTitle className='text-lg'>{template.form.title}</CardTitle>
												<div className='flex items-center gap-2 mt-1'>
													<Users className='w-4 h-4 text-gray-500' />
													<span className='text-sm text-gray-600'>{template.communityName}</span>
												</div>
											</div>
											<Badge variant='secondary' className='ml-2'>
												{totalQuestions} question{totalQuestions !== 1 ? 's' : ''}
											</Badge>
										</div>
										{template.form.description && <p className='text-sm text-gray-600 mt-2'>{template.form.description}</p>}
									</CardHeader>
									<CardContent className='pt-0'>
										<div className='flex items-center justify-between'>
											<div className='flex items-center gap-4 text-sm text-gray-500'>
												<div className='flex items-center gap-1'>
													<Calendar className='w-4 h-4' />
													{formatDate(template.form.createdAt)}
												</div>
												<div className='flex items-center gap-2'>
													{questionCounts.text > 0 && (
														<Badge variant='outline' className='text-xs'>
															{questionCounts.text} text
														</Badge>
													)}
													{questionCounts.multiple_choice > 0 && (
														<Badge variant='outline' className='text-xs'>
															{questionCounts.multiple_choice} choice
														</Badge>
													)}
													{questionCounts.multiple_select > 0 && (
														<Badge variant='outline' className='text-xs'>
															{questionCounts.multiple_select} multi-select
														</Badge>
													)}
												</div>
											</div>
											<Button onClick={() => handleTemplateSelect(template)} size='sm' className='gap-2'>
												<Copy className='w-4 h-4' />
												Use Template
											</Button>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
