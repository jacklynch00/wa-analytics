'use client';

import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface LoadingScreenProps {
	onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
	useEffect(() => {
		// Just wait a short time then complete - no complex animations
		const timer = setTimeout(() => {
			onComplete();
		}, 2000);

		return () => clearTimeout(timer);
	}, [onComplete]);

	return (
		<div className='min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center'>
			{/* Static background - no animations */}
			<div className='absolute inset-0 overflow-hidden'>
				<div className='absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20'></div>
				<div className='absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20'></div>
			</div>

			<Card includeStatsCardStyles={false} className='relative z-10 w-full max-w-md bg-white/15 backdrop-blur-sm border-white/30 shadow-2xl'>
				<CardContent className='p-8'>
					<div className='text-center space-y-6'>
						<div className='w-16 h-16 mx-auto'>
							<div className='animate-spin rounded-full h-16 w-16 border-b-2 border-white/60'></div>
						</div>

						<div>
							<h2 className='text-xl font-semibold text-white mb-2'>Analyzing Your Chat</h2>
							<p className='text-white/80 text-sm'>Processing your WhatsApp export...</p>
						</div>

						<div className='text-xs text-white/60 bg-white/10 p-3 rounded-lg border border-white/20'>
							<strong>Please wait...</strong> This usually takes 10-30 seconds
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
