'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { ApplicationFormData, FormQuestion } from '@/types';

interface FormPreviewModalProps {
	isOpen: boolean;
	onClose: () => void;
	form: ApplicationFormData;
}

export default function FormPreviewModal({ isOpen, onClose, form }: FormPreviewModalProps) {
	const renderQuestion = (question: FormQuestion) => {
		const questionId = `preview-question-${question.id}`;

		switch (question.type) {
			case 'text':
				return (
					<div key={question.id} className='space-y-2'>
						<Label htmlFor={questionId} className='text-sm font-medium'>
							{question.label}
							{question.required && <span className='text-red-500 ml-1'>*</span>}
						</Label>
						<Input id={questionId} placeholder={question.placeholder || 'Enter your answer...'} disabled className='bg-gray-50' />
					</div>
				);

			case 'multiple_choice':
				return (
					<div key={question.id} className='space-y-3'>
						<Label className='text-sm font-medium'>
							{question.label}
							{question.required && <span className='text-red-500 ml-1'>*</span>}
						</Label>
						<RadioGroup disabled className='space-y-2'>
							{question.options?.map((option, optionIndex) => (
								<div key={optionIndex} className='flex items-center space-x-2'>
									<RadioGroupItem value={option} id={`${questionId}-${optionIndex}`} disabled />
									<Label htmlFor={`${questionId}-${optionIndex}`} className='text-sm text-gray-600'>
										{option}
									</Label>
								</div>
							)) || []}
						</RadioGroup>
					</div>
				);

			case 'multiple_select':
				return (
					<div key={question.id} className='space-y-3'>
						<Label className='text-sm font-medium'>
							{question.label}
							{question.required && <span className='text-red-500 ml-1'>*</span>}
						</Label>
						<div className='space-y-2'>
							{question.options?.map((option, optionIndex) => (
								<div key={optionIndex} className='flex items-center space-x-2'>
									<Checkbox id={`${questionId}-${optionIndex}`} disabled />
									<Label htmlFor={`${questionId}-${optionIndex}`} className='text-sm text-gray-600'>
										{option}
									</Label>
								</div>
							)) || []}
						</div>
					</div>
				);

			default:
				return null;
		}
	};

	const hasValidSlug = form.customSlug && form.customSlug.length >= 3;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle className='text-xl'>Form Preview</DialogTitle>
				</DialogHeader>

				{/* Preview Content */}
				<div className='mt-4'>
					{/* Preview Mode Banner */}
					<div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6'>
						<p className='text-sm text-yellow-800 text-center'>
							<strong>Preview Mode:</strong> This is how applicants will see your form
						</p>
					</div>

					{/* Form Header */}
					<div className='text-center mb-8'>
						<h1 className='text-3xl font-bold text-gray-900 mb-3'>{form.title || 'Untitled Form'}</h1>
						{form.description && <p className='text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto'>{form.description}</p>}
					</div>

					{/* Form Status Badges */}
					<div className='flex flex-wrap gap-2 justify-center mb-8'>
						<Badge variant={form.isActive ? 'default' : 'destructive'}>{form.isActive ? 'Form Active' : 'Form Inactive'}</Badge>
						<Badge variant={form.isPublic ? 'secondary' : 'outline'}>{form.isPublic ? 'Public Form' : 'Private Form'}</Badge>
						{!form.isPublic && form.password && <Badge variant='outline'>Password Protected</Badge>}
					</div>

					{/* Password Protection (if applicable) */}
					{!form.isPublic && form.password && (
						<div className='bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6'>
							<Label htmlFor='preview-password' className='text-sm font-medium'>
								Access Password <span className='text-red-500'>*</span>
							</Label>
							<Input id='preview-password' type='password' placeholder='Enter password to access form' disabled className='mt-1 bg-gray-50' />
						</div>
					)}

					{/* Questions */}
					{form.questions.length > 0 ? (
						<div className='space-y-6 mb-8'>
							{form.questions.map((question) => (
								<div key={question.id} className='p-4 border border-gray-200 rounded-lg bg-gray-50/30'>
									{renderQuestion(question)}
								</div>
							))}
						</div>
					) : (
						<div className='text-center py-8 text-gray-500'>
							<p>No questions added yet</p>
						</div>
					)}

					{/* Submit Button */}
					<div className='pt-6 border-t border-gray-200'>
						<Button className='w-full' size='lg' disabled>
							Submit Application
						</Button>
						<p className='text-center text-xs text-gray-500 mt-2'>Submit button will be enabled for real applicants</p>
					</div>

					{/* URL Info */}
					{hasValidSlug && (
						<div className='mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
							<p className='text-sm text-blue-800 text-center'>
								<strong>Public URL:</strong>{' '}
								<code className='bg-blue-100 px-2 py-1 rounded text-xs'>
									{typeof window !== 'undefined' ? window.location.origin : ''}/apply/{form.customSlug}
								</code>
							</p>
						</div>
					)}

					{!hasValidSlug && (
						<div className='mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
							<p className='text-sm text-yellow-800 text-center'>
								<strong>Note:</strong> Set a valid custom URL slug to make this form accessible to applicants
							</p>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
