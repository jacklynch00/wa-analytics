'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageCircle, ArrowLeft, Star, CheckCircle } from 'lucide-react';

function SignUpForm() {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
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

	const handleSignUp = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError('');

		if (password !== confirmPassword) {
			setError('Passwords do not match');
			setIsLoading(false);
			return;
		}

		if (password.length < 6) {
			setError('Password must be at least 6 characters');
			setIsLoading(false);
			return;
		}

		try {
			console.log('Attempting to sign up with:', { name, email });
			const result = await authClient.signUp.email({
				name,
				email,
				password,
			});

			console.log('Sign up result:', result);

			if (result.error) {
				console.error('Sign up error:', result.error);
				setError(result.error.message || 'Failed to create account');
			} else {
				console.log('Sign up successful, redirecting to:', redirectUrl || '/dashboard');
				// If there's a redirect URL (like from invitation), use it. Otherwise go to dashboard
				router.push(redirectUrl || '/dashboard');
			}
		} catch (error) {
			console.error('Sign up exception:', error);
			setError('An unexpected error occurred: ' + (error as Error).message);
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
			<div className='relative z-10 flex items-center justify-center px-6 py-8'>
				<div className='w-full max-w-md'>
					{/* Welcome Message */}
					<div className='text-center mb-8'>
						<div className='w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-6'>
							<Star className='w-8 h-8 text-white' />
						</div>
						<h1 className='text-3xl md:text-4xl font-black text-white mb-4'>
							{redirectUrl ? 'Complete Your Invitation' : 'Join Waly'}
						</h1>
						{redirectUrl && (
							<p className='text-purple-100 text-lg'>Create your account to join the team</p>
						)}
					</div>

					{/* Sign Up Card */}
					<Card includeStatsCardStyles={false} className='bg-white/15 rounded-md backdrop-blur-sm border-white/30 shadow-2xl py-0'>
						<CardContent className='p-8'>
							<form onSubmit={handleSignUp} className='space-y-5'>
								<div className='space-y-2'>
									<Label htmlFor='name' className='text-white font-medium'>
										Full Name
									</Label>
									<Input
										id='name'
										type='text'
										value={name}
										onChange={(e) => setName(e.target.value)}
										placeholder='John Doe'
										required
										className='bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50'
									/>
								</div>

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
									<p className='text-xs text-white/70'>Password must be at least 6 characters</p>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='confirmPassword' className='text-white font-medium'>
										Confirm Password
									</Label>
									<Input
										id='confirmPassword'
										type='password'
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										placeholder='Confirm your password'
										required
										className='bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/50'
									/>
								</div>

								{error && <div className='text-red-300 text-sm bg-red-500/20 border border-red-400/30 p-3 rounded-lg backdrop-blur-sm'>{error}</div>}

								<Button
									type='submit'
									disabled={isLoading}
									className='w-full bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-500 hover:from-yellow-500 hover:via-pink-500 hover:to-purple-600 text-white font-semibold py-3 rounded-full shadow-xl transform hover:scale-105 transition-all duration-200'>
									{isLoading ? 'Creating Account...' : 'Create Account'}
								</Button>
							</form>

							<div className='mt-8 text-center'>
								<span className='text-white/80'>Already have an account? </span>
								<Link href='/sign-in' className='text-yellow-300 hover:text-yellow-200 font-semibold hover:underline transition-colors'>
									Sign in
								</Link>
							</div>

							{/* Benefits */}
							<div className='mt-8 space-y-3'>
								<div className='flex items-center space-x-3 text-white/90'>
									<CheckCircle className='w-5 h-5 text-green-400 flex-shrink-0' />
									<span className='text-sm'>Free to get started</span>
								</div>
								<div className='flex items-center space-x-3 text-white/90'>
									<CheckCircle className='w-5 h-5 text-green-400 flex-shrink-0' />
									<span className='text-sm'>100% secure & private</span>
								</div>
								<div className='flex items-center space-x-3 text-white/90'>
									<CheckCircle className='w-5 h-5 text-green-400 flex-shrink-0' />
									<span className='text-sm'>Instant chat analysis</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

export default function SignUpPage() {
	return (
		<Suspense fallback={
			<div className='min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center'>
				<div className='animate-pulse text-white text-lg'>Loading...</div>
			</div>
		}>
			<SignUpForm />
		</Suspense>
	);
}
