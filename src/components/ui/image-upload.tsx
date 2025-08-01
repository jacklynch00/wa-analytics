'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { getFileUrl } from '@/lib/utils';

interface ImageUploadProps {
	onImageUpload: (file: File) => void;
	onImageRemove: () => void;
	currentImageUrl?: string;
	maxSize?: number; // in MB
	acceptedTypes?: string[];
	className?: string;
}

export default function ImageUpload({
	onImageUpload,
	onImageRemove,
	currentImageUrl,
	maxSize = 5, // 5MB default
	acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
	className = '',
}: ImageUploadProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleFile = useCallback(
		(file: File) => {
			const validateFile = (file: File): boolean => {
				// Check file type
				if (!acceptedTypes.includes(file.type)) {
					setError(`Please upload a valid image file (${acceptedTypes.map((type) => type.split('/')[1]).join(', ')})`);
					return false;
				}

				// Check file size
				if (file.size > maxSize * 1024 * 1024) {
					setError(`File size must be less than ${maxSize}MB`);
					return false;
				}

				setError(null);
				return true;
			};

			if (validateFile(file)) {
				onImageUpload(file);
			}
		},
		[acceptedTypes, maxSize, onImageUpload]
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);

			const files = Array.from(e.dataTransfer.files);
			if (files.length > 0) {
				handleFile(files[0]);
			}
		},
		[handleFile]
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	}, []);

	const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			handleFile(files[0]);
		}
	};

	return (
		<div className={`space-y-4 ${className}`}>
			{/* Current Image Display */}
			{currentImageUrl && (
				<div className='relative'>
					<div className='relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden'>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={getFileUrl(currentImageUrl)} alt='Community image' className='w-auto h-auto max-w-full max-h-full object-contain' />
						<Button variant='destructive' size='sm' onClick={onImageRemove} className='absolute top-2 right-2 h-8 w-8 p-0'>
							<X className='w-4 h-4' />
						</Button>
					</div>
				</div>
			)}

			{/* Upload Area */}
			{!currentImageUrl && (
				<Card className={`border-2 border-dashed transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
					<CardContent className='p-8 text-center' onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
						<div className='flex flex-col items-center space-y-4'>
							<div className={`p-4 rounded-full ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}`}>
								<ImageIcon className={`w-8 h-8 ${isDragging ? 'text-blue-600' : 'text-gray-600'}`} />
							</div>

							<div>
								<p className='text-xs text-gray-500'>
									Supported formats: {acceptedTypes.map((type) => type.split('/')[1]).join(', ')} • Max size: {maxSize}MB
								</p>
							</div>

							<input type='file' accept={acceptedTypes.join(',')} onChange={handleFileInput} className='hidden' id='image-upload' />

							<Button asChild variant='outline' className='cursor-pointer'>
								<label htmlFor='image-upload'>
									<Upload className='w-4 h-4 mr-2' />
									Select Image
								</label>
							</Button>

							{error && (
								<div className='flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg'>
									<span className='text-sm'>{error}</span>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
