'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageCircle, ArrowLeft, Sparkles } from 'lucide-react';

function SignInForm() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirectUrl = searchParams.get('redirect');
	const prefilledEmail = searchParams.get('email');
	
	// Pre-fill email if provided in URL
	useEffect(() => {
		if (prefilledEmail && !email) {
			setEmail(prefilledEmail);
		}
	}, [prefilledEmail, email]);

	const handleSignIn = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError('');

		try {
			const result = await authClient.signIn.email({
				email,
				password,
			});

			if (result.error) {
				setError(result.error.message || 'Failed to sign in');
			} else {
				// If there's a redirect URL (like from invitation), use it. Otherwise go to dashboard
				router.push(redirectUrl || '/dashboard');
			}
		} catch {
			setError('An unexpected error occurred');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900'>
			{/* Animated Background */}
			<div className='absolute inset-0 overflow-hidden'>
				<div className='absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse'></div>
				<div className='absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000'></div>
				<div className='absolute top-40 left-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000'></div>
			</div>

			{/* Navigation */}
			<nav className='relative z-50 flex justify-between items-center px-6 py-6'>
				<Link href='/' className='flex items-center space-x-2 group'>
					<Button variant='ghost' className='text-white hover:bg-white/10 p-2'>
						<ArrowLeft className='w-5 h-5' />
					</Button>
					<div className='w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-400 rounded-lg flex items-center justify-center'>
						<MessageCircle className='w-5 h-5 text-white' />
					</div>
					<span className='text-xl font-bold text-white'>Waly</span>
				</Link>
			</nav>

			{/* Main Content */}
			<div className='relative z-10 flex items-center justify-center px-6 py-12'>
				<div className='w-full max-w-md'>
					{/* Welcome Message */}
					<div className='text-center mb-8'>
						<div className='w-16 h-16 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-6'>
							<Sparkles className='w-8 h-8 text-white' />
						</div>
						<h1 className='text-3xl md:text-4xl font-black text-white mb-4'>Welcome Back</h1>
						<p className='text-purple-100 text-lg'>Ready to decode more chats?</p>
					</div>

					{/* Sign In Card */}
					<Card includeStatsCardStyles={false} className='bg-white/15 rounded-md backdrop-blur-sm border-white/30 shadow-2xl py-0'>
						<CardContent className='p-8'>
							<form onSubmit={handleSignIn} className='space-y-6'>
								<div className='space-y-2'>
									<Label htmlFor='email' className='text-white font-medium'>
										Email
									</Label>
									<Input
										id='email'
										type='email'
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										placeholder='your@email.com'
										required
										className='bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50'
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='password' className='text-white font-medium'>
										Password
									</Label>
									<Input
										id='password'
										type='password'
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										placeholder='Enter your password'
										required
										className='bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50'
									/>
								</div>

								{error && <div className='text-red-300 text-sm bg-red-500/20 border border-red-400/30 p-3 rounded-lg backdrop-blur-sm'>{error}</div>}

								<Button
									type='submit'
									disabled={isLoading}
									className='w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3 rounded-full shadow-xl transform hover:scale-105 transition-all duration-200'>
									{isLoading ? 'Signing in...' : 'Sign In'}
								</Button>
							</form>

							<div className='mt-8 text-center'>
								<span className='text-white/80'>Don&apos;t have an account? </span>
								<Link href={`/sign-up${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`} className='text-yellow-300 hover:text-yellow-200 font-semibold hover:underline transition-colors'>
									Sign up
								</Link>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

export default function SignInPage() {
	return (
		<Suspense fallback={
			<div className='min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center'>
				<div className='animate-pulse text-white text-lg'>Loading...</div>
			</div>
		}>
			<SignInForm />
		</Suspense>
	);
}
