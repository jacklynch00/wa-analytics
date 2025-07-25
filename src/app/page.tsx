'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import FileUpload from '@/components/upload/FileUpload';
import LoadingScreen from '@/components/upload/LoadingScreen';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';
import { Users, MessageCircle, BarChart3, Shield, Zap, TrendingUp, Share2, ArrowRight, CheckCircle, Star, Upload, Users2, Calendar, Lock } from 'lucide-react';

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
		if (!user) {
			router.push('/sign-in');
			return;
		}

		setIsProcessing(true);

		try {
			const formData = new FormData();
			formData.append('file', file);

			const response = await fetch('/api/upload', {
				method: 'POST',
				body: formData,
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Upload failed');
			}

			sessionStorage.setItem(
				'chatAnalysis',
				JSON.stringify(result.analysis, (key, value) => {
					if (key === 'timestamp' || key === 'firstActive' || key === 'lastActive' || key === 'dateShared' || key === 'start' || key === 'end') {
						return value instanceof Date ? value.toISOString() : value;
					}
					return value;
				})
			);

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
		<div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'>
			{/* Floating Glassmorphic Header */}
			<header className='fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 border-b border-white/20 shadow-lg'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex items-center justify-between h-16'>
						{/* Logo */}
						<div className='flex items-center space-x-2'>
							<div className='w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center'>
								<MessageCircle className='w-5 h-5 text-white' />
							</div>
							<span className='text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>Waly</span>
						</div>

						{/* Navigation - Features removed */}
						<div className='hidden md:flex'>
							{/* Simple navigation without dropdown */}
						</div>

						{/* Auth Buttons */}
						<div className='flex items-center space-x-4'>
							{user ? (
								<div className='flex items-center space-x-2'>
									<span className='text-sm text-gray-600'>Welcome, {user.name}</span>
									<Button asChild variant='outline' size='sm'>
										<Link href='/dashboard'>Dashboard</Link>
									</Button>
								</div>
							) : (
								<div className='flex items-center space-x-2'>
									<Button asChild variant='ghost' size='sm'>
										<Link href='/sign-in'>Sign In</Link>
									</Button>
									<Button asChild size='sm'>
										<Link href='/sign-up'>Get Started</Link>
									</Button>
								</div>
							)}
						</div>
					</div>
				</div>
			</header>

			{/* Hero Section */}
			<section className='pt-24 pb-16 px-4 sm:px-6 lg:px-8'>
				<div className='max-w-7xl mx-auto'>
					<div className='text-center'>
						<Badge variant='secondary' className='mb-4'>
							<Users className='w-3 h-3 mr-1' />
							Community Analytics Platform
						</Badge>
						<h1 className='text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6'>
							Build Stronger <span className='bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>Communities</span> with AI-Powered
							Insights
						</h1>
						<p className='text-xl text-gray-600 mb-8 max-w-3xl mx-auto'>
							Create communities, analyze your WhatsApp group chats, and discover powerful insights about member engagement, activity patterns, and group dynamics.
						</p>
						<div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
							<Button asChild size='lg' className='bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'>
								<Link href='/sign-up'>
									<Users className='w-4 h-4 mr-2' />
									Create Your Community
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* How It Works Section */}
			<section className='py-16 px-4 sm:px-6 lg:px-8 bg-white'>
				<div className='max-w-7xl mx-auto'>
					<div className='text-center mb-12'>
						<h2 className='text-3xl font-bold text-gray-900 mb-4'>How It Works</h2>
						<p className='text-lg text-gray-600 max-w-2xl mx-auto'>
							Get started with your community analytics in three simple steps
						</p>
					</div>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
						<div className='text-center'>
							<div className='w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6'>
								<span className='text-2xl font-bold text-white'>1</span>
							</div>
							<h3 className='text-xl font-semibold text-gray-900 mb-4'>Create Your Community</h3>
							<p className='text-gray-600'>
								Set up your community with a name and description. This will be your central hub for all chat analyses.
							</p>
						</div>
						<div className='text-center'>
							<div className='w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6'>
								<span className='text-2xl font-bold text-white'>2</span>
							</div>
							<h3 className='text-xl font-semibold text-gray-900 mb-4'>Upload WhatsApp Export</h3>
							<p className='text-gray-600'>
								Export your WhatsApp group chat and upload it to your community. Our AI will analyze the data instantly.
							</p>
						</div>
						<div className='text-center'>
							<div className='w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6'>
								<span className='text-2xl font-bold text-white'>3</span>
							</div>
							<h3 className='text-xl font-semibold text-gray-900 mb-4'>Discover Insights</h3>
							<p className='text-gray-600'>
								Explore member analytics, activity patterns, and AI-powered insights to understand your community better.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Problems Section */}
			<section className='py-16 px-4 sm:px-6 lg:px-8 bg-gray-50'>
				<div className='max-w-7xl mx-auto'>
					<div className='text-center mb-12'>
						<h2 className='text-3xl font-bold text-gray-900 mb-4'>Problems We Solve</h2>
						<p className='text-lg text-gray-600 max-w-2xl mx-auto'>
							WhatsApp groups generate massive amounts of data, but extracting meaningful insights is challenging.
						</p>
					</div>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
						<Card className='border-l-4 border-l-red-500'>
							<CardHeader>
								<div className='w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4'>
									<MessageCircle className='w-6 h-6 text-red-600' />
								</div>
								<CardTitle>Data Overload</CardTitle>
								<CardDescription>Thousands of messages make it impossible to understand group dynamics and member engagement patterns.</CardDescription>
							</CardHeader>
						</Card>
						<Card className='border-l-4 border-l-yellow-500'>
							<CardHeader>
								<div className='w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4'>
									<Users className='w-6 h-6 text-yellow-600' />
								</div>
								<CardTitle>Member Insights</CardTitle>
								<CardDescription>No easy way to identify active members, understand participation patterns, or track engagement over time.</CardDescription>
							</CardHeader>
						</Card>
						<Card className='border-l-4 border-l-blue-500'>
							<CardHeader>
								<div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4'>
									<BarChart3 className='w-6 h-6 text-blue-600' />
								</div>
								<CardTitle>Missing Analytics</CardTitle>
								<CardDescription>Lack of comprehensive analytics to measure group health, activity trends, and communication patterns.</CardDescription>
							</CardHeader>
						</Card>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id='features' className='py-16 px-4 sm:px-6 lg:px-8 bg-gray-50'>
				<div className='max-w-7xl mx-auto'>
					<div className='text-center mb-12'>
						<h2 className='text-3xl font-bold text-gray-900 mb-4'>Powerful Features</h2>
						<p className='text-lg text-gray-600 max-w-2xl mx-auto'>Everything you need to understand and optimize your WhatsApp group dynamics.</p>
					</div>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
						<Card className='group hover:shadow-lg transition-all duration-300'>
							<CardHeader>
								<div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform'>
									<BarChart3 className='w-6 h-6 text-white' />
								</div>
								<CardTitle>AI-Powered Analysis</CardTitle>
								<CardDescription>
									Advanced AI algorithms analyze your chat data to provide deep insights into group dynamics, sentiment, and engagement patterns.
								</CardDescription>
							</CardHeader>
						</Card>
						<Card className='group hover:shadow-lg transition-all duration-300'>
							<CardHeader>
								<div className='w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform'>
									<Users2 className='w-6 h-6 text-white' />
								</div>
								<CardTitle>Member Analytics</CardTitle>
								<CardDescription>
									Comprehensive member profiles with activity metrics, participation rates, and engagement scores for each group member.
								</CardDescription>
							</CardHeader>
						</Card>
						<Card className='group hover:shadow-lg transition-all duration-300'>
							<CardHeader>
								<div className='w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform'>
									<TrendingUp className='w-6 h-6 text-white' />
								</div>
								<CardTitle>Trend Analysis</CardTitle>
								<CardDescription>
									Track activity trends over time, identify peak engagement periods, and understand seasonal patterns in your group.
								</CardDescription>
							</CardHeader>
						</Card>
						<Card className='group hover:shadow-lg transition-all duration-300'>
							<CardHeader>
								<div className='w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform'>
									<Calendar className='w-6 h-6 text-white' />
								</div>
								<CardTitle>Time-based Insights</CardTitle>
								<CardDescription>Understand when your group is most active, identify quiet periods, and optimize communication timing.</CardDescription>
							</CardHeader>
						</Card>
						<Card className='group hover:shadow-lg transition-all duration-300'>
							<CardHeader>
								<div className='w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform'>
									<Share2 className='w-6 h-6 text-white' />
								</div>
								<CardTitle>Secure Sharing</CardTitle>
								<CardDescription>Share insights with team members through password-protected links with customizable expiration dates.</CardDescription>
							</CardHeader>
						</Card>
						<Card className='group hover:shadow-lg transition-all duration-300'>
							<CardHeader>
								<div className='w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform'>
									<Shield className='w-6 h-6 text-white' />
								</div>
								<CardTitle>Privacy First</CardTitle>
								<CardDescription>Enterprise-grade security with end-to-end encryption, data anonymization, and GDPR compliance.</CardDescription>
							</CardHeader>
						</Card>
					</div>
				</div>
			</section>

			{/* Upload Section */}
			<section id='upload' className='py-16 px-4 sm:px-6 lg:px-8 bg-white'>
				<div className='max-w-4xl mx-auto'>
					<div className='text-center mb-8'>
						<h2 className='text-3xl font-bold text-gray-900 mb-4'>Ready to Get Started?</h2>
						<p className='text-lg text-gray-600'>Create an account to build your first community and start analyzing your WhatsApp group chats.</p>
					</div>
					{user ? (
						<Card className='p-8'>
							<CardContent className='p-0'>
								<FileUpload onFileSelect={handleFileSelect} />
							</CardContent>
						</Card>
					) : (
						<Card className='p-8'>
							<CardContent className='text-center'>
								<div className='w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6'>
									<Lock className='w-8 h-8 text-white' />
								</div>
								<h3 className='text-xl font-semibold text-gray-900 mb-4'>Sign Up to Build Communities</h3>
								<p className='text-gray-600 mb-6 max-w-md mx-auto'>
									Create your free account to build communities and get AI-powered insights about your WhatsApp group dynamics.
								</p>
								<div className='flex flex-col sm:flex-row gap-4 justify-center'>
									<Button asChild size='lg' className='bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'>
										<Link href='/sign-up'>
											<Users className='w-4 h-4 mr-2' />
											Create Free Account
										</Link>
									</Button>
									<Button asChild variant='outline' size='lg'>
										<Link href='/sign-in'>Sign In</Link>
									</Button>
								</div>
								<div className='mt-6 text-sm text-gray-500'>
									<p>✓ Free to get started</p>
									<p>✓ No credit card required</p>
									<p>✓ Instant analysis results</p>
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</section>

			{/* Benefits Section */}
			<section className='py-16 px-4 sm:px-6 lg:px-8 bg-gray-50'>
				<div className='max-w-7xl mx-auto'>
					<div className='text-center mb-12'>
						<h2 className='text-3xl font-bold text-gray-900 mb-4'>Why Choose Waly?</h2>
						<p className='text-lg text-gray-600 max-w-2xl mx-auto'>Join thousands of users who trust Waly for their WhatsApp group analytics.</p>
					</div>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
						<div className='space-y-6'>
							<div className='flex items-start space-x-4'>
								<div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0'>
									<CheckCircle className='w-5 h-5 text-green-600' />
								</div>
								<div>
									<h3 className='font-semibold text-gray-900 mb-2'>Instant Results</h3>
									<p className='text-gray-600'>Get comprehensive analysis in minutes, not hours. No waiting or complex setup required.</p>
								</div>
							</div>
							<div className='flex items-start space-x-4'>
								<div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0'>
									<CheckCircle className='w-5 h-5 text-blue-600' />
								</div>
								<div>
									<h3 className='font-semibold text-gray-900 mb-2'>AI-Powered Insights</h3>
									<p className='text-gray-600'>Advanced machine learning algorithms provide deep, actionable insights from your data.</p>
								</div>
							</div>
							<div className='flex items-start space-x-4'>
								<div className='w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0'>
									<CheckCircle className='w-5 h-5 text-purple-600' />
								</div>
								<div>
									<h3 className='font-semibold text-gray-900 mb-2'>Privacy Focused</h3>
									<p className='text-gray-600'>Your data never leaves your control. We use local processing and secure cloud storage.</p>
								</div>
							</div>
						</div>
						<div className='space-y-6'>
							<div className='flex items-start space-x-4'>
								<div className='w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0'>
									<CheckCircle className='w-5 h-5 text-orange-600' />
								</div>
								<div>
									<h3 className='font-semibold text-gray-900 mb-2'>Easy Sharing</h3>
									<p className='text-gray-600'>Share insights with your team through secure, password-protected links with expiration dates.</p>
								</div>
							</div>
							<div className='flex items-start space-x-4'>
								<div className='w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0'>
									<CheckCircle className='w-5 h-5 text-red-600' />
								</div>
								<div>
									<h3 className='font-semibold text-gray-900 mb-2'>No Data Limits</h3>
									<p className='text-gray-600'>Analyze groups of any size with no artificial limits on message count or member count.</p>
								</div>
							</div>
							<div className='flex items-start space-x-4'>
								<div className='w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0'>
									<CheckCircle className='w-5 h-5 text-teal-600' />
								</div>
								<div>
									<h3 className='font-semibold text-gray-900 mb-2'>24/7 Support</h3>
									<p className='text-gray-600'>Get help whenever you need it with our responsive customer support team.</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>


			{/* CTA Section */}
			<section className='py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-600'>
				<div className='max-w-4xl mx-auto text-center'>
					<h2 className='text-3xl font-bold text-white mb-4'>Ready to Build Your Community?</h2>
					<p className='text-xl text-blue-100 mb-8'>Create your free account and start building stronger communities with AI-powered insights.</p>
					<div className='flex flex-col sm:flex-row gap-4 justify-center'>
						<Button asChild size='lg' variant='secondary'>
							<Link href='/sign-up'>
								Create Your Community
								<ArrowRight className='w-4 h-4 ml-2' />
							</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className='bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8'>
				<div className='max-w-7xl mx-auto'>
					<div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
						<div>
							<div className='flex items-center space-x-2 mb-4'>
								<div className='w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center'>
									<MessageCircle className='w-5 h-5 text-white' />
								</div>
								<span className='text-xl font-bold'>Waly</span>
							</div>
							<p className='text-gray-400'>AI-powered WhatsApp analytics to understand your group dynamics and improve engagement.</p>
						</div>
						<div>
							<h3 className='font-semibold mb-4'>Product</h3>
							<ul className='space-y-2 text-gray-400'>
								<li>
									<Link href='#features' className='hover:text-white transition-colors'>
										Features
									</Link>
								</li>
								<li>
									<Link href='#pricing' className='hover:text-white transition-colors'>
										Pricing
									</Link>
								</li>
								<li>
									<Link href='#demo' className='hover:text-white transition-colors'>
										Demo
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<h3 className='font-semibold mb-4'>Support</h3>
							<ul className='space-y-2 text-gray-400'>
								<li>
									<Link href='/help' className='hover:text-white transition-colors'>
										Help Center
									</Link>
								</li>
								<li>
									<Link href='/contact' className='hover:text-white transition-colors'>
										Contact
									</Link>
								</li>
								<li>
									<Link href='/privacy' className='hover:text-white transition-colors'>
										Privacy
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<h3 className='font-semibold mb-4'>Company</h3>
							<ul className='space-y-2 text-gray-400'>
								<li>
									<Link href='/about' className='hover:text-white transition-colors'>
										About
									</Link>
								</li>
								<li>
									<Link href='/blog' className='hover:text-white transition-colors'>
										Blog
									</Link>
								</li>
								<li>
									<Link href='/careers' className='hover:text-white transition-colors'>
										Careers
									</Link>
								</li>
							</ul>
						</div>
					</div>
					<Separator className='my-8 bg-gray-800' />
					<div className='flex flex-col sm:flex-row justify-between items-center'>
						<p className='text-gray-400 text-sm'>© 2024 Waly. All rights reserved.</p>
						<div className='flex space-x-6 mt-4 sm:mt-0'>
							<Link href='/terms' className='text-gray-400 hover:text-white text-sm transition-colors'>
								Terms of Service
							</Link>
							<Link href='/privacy' className='text-gray-400 hover:text-white text-sm transition-colors'>
								Privacy Policy
							</Link>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
