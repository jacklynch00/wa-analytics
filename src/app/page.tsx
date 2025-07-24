'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import FileUpload from '@/components/upload/FileUpload';
import LoadingScreen from '@/components/upload/LoadingScreen';
import Link from 'next/link';

export default function HomePage() {
	const [isProcessing, setIsProcessing] = useState(false);
	const [user, setUser] = useState<{ name: string; email: string } | null>(null);
	const [isCheckingAuth, setIsCheckingAuth] = useState(true);
	const router = useRouter();

	useEffect(() => {
		const checkAuth = async () => {
			try {
				const session = await authClient.getSession();
				if (session.data) {
					setUser(session.data.user);
				}
			} catch (error) {
				console.error('Auth check failed:', error);
			} finally {
				setIsCheckingAuth(false);
			}
		};

		checkAuth();
	}, []);

	const handleFileSelect = async (file: File) => {
		// Check if user is authenticated
		if (!user) {
			router.push('/sign-in');
			return;
		}

		setIsProcessing(true);

		try {
			// Create form data for file upload
			const formData = new FormData();
			formData.append('file', file);

			// Upload file to API
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

			// Navigate to results with analysis ID
			router.push(`/results?id=${result.analysisId}`);
		} catch (error) {
			console.error('Error uploading file:', error);
			setIsProcessing(false);

			if (error instanceof Error) {
				if (error.message.includes('limit')) {
					alert('Upload limit reached. You can only have 3 analyses per account. Please delete an existing analysis from your dashboard to upload a new one.');
				} else {
					alert(`Error: ${error.message}`);
				}
			} else {
				alert('Error uploading file. Please try again.');
			}
		}
	};

	if (isCheckingAuth) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
			</div>
		);
	}

	if (isProcessing) {
		return <LoadingScreen onComplete={() => {}} />;
	}

	return (
		<div className='min-h-screen bg-[var(--container-bg)]'>
			{user && (
				<div className='absolute top-4 right-4 text-sm text-gray-600'>
					Welcome, {user.name} |{' '}
					<Link href='/dashboard' className='text-blue-600 hover:underline'>
						Dashboard
					</Link>
				</div>
			)}
			{!user && (
				<div className='absolute top-4 right-4 space-x-2'>
					<Link href='/sign-in' className='text-blue-600 hover:underline'>
						Sign In
					</Link>
					<Link href='/sign-up' className='text-blue-600 hover:underline'>
						Sign Up
					</Link>
				</div>
			)}
			<FileUpload onFileSelect={handleFileSelect} />
		</div>
	);
}
