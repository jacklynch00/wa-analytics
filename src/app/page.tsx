'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Users, Sparkles, ArrowRight, CheckCircle, Share2, TrendingUp, Clock, Star } from 'lucide-react';

export default function HomePage() {
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
				<div className='flex items-center space-x-2'>
					<div className='w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-400 rounded-lg flex items-center justify-center'>
						<MessageCircle className='w-5 h-5 text-white' />
					</div>
					<span className='text-xl font-bold text-white'>Waly</span>
				</div>
				<div className='flex space-x-4'>
					{isCheckingAuth ? (
						<div className='w-8 h-8 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
					) : user ? (
						<Button onClick={() => router.push('/dashboard')} className='bg-white text-purple-900 hover:bg-gray-100'>
							Dashboard
						</Button>
					) : (
						<>
							<Button variant='ghost' className='text-white hover:bg-white/10'>
								<Link href='/sign-in'>Sign In</Link>
							</Button>
							<Button className='bg-white text-purple-900 hover:bg-gray-100'>
								<Link href='/sign-up'>Get Started</Link>
							</Button>
						</>
					)}
				</div>
			</nav>

			{/* Hero Section */}
			<section className='relative z-10 px-6 py-12 text-center'>
				<div className='max-w-4xl mx-auto'>
					{/* Badge */}
					<Badge className='mb-8 bg-white/10 text-white border-white/20 hover:bg-white/20 px-4 py-2'>
						<Sparkles className='w-4 h-4 mr-2' />
						Your group chat deserves better insights
					</Badge>

					{/* Main Headline */}
					<h1 className='text-5xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-none'>
						<span className='bg-gradient-to-r from-purple-200 via-blue-200 to-indigo-200 bg-clip-text text-transparent'>DECODE</span>
						<br />
						<span className='text-white'>YOUR COMMUNITY</span>
					</h1>

					{/* Subheadline */}
					<p className='text-xl md:text-2xl text-purple-100 mb-12 max-w-3xl mx-auto leading-relaxed'>
						Transform your WhatsApp group into a thriving community platform.
						<span className='text-yellow-300 font-semibold'> Analyze conversations, </span>
						<span className='text-green-300 font-semibold'> manage member applications, </span>
						<span className='text-pink-300 font-semibold'> and share beautiful directories. </span>
						All in one place.
					</p>

					{/* CTA Buttons */}
					<div className='flex flex-col sm:flex-row gap-4 justify-center mb-16'>
						<Button
							size='lg'
							className='bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-2xl transform hover:scale-105 transition-all duration-200'>
							<Link href='/sign-up' className='flex items-center'>
								Try It FREE <ArrowRight className='ml-2 w-5 h-5' />
							</Link>
						</Button>
					</div>

					{/* Stats */}
					{/* <div className='grid grid-cols-3 gap-8 max-w-2xl mx-auto'>
						<div className='text-center'>
							<div className='text-3xl font-bold text-white mb-2'>10K+</div>
							<div className='text-purple-200 text-sm'>Chats Analyzed</div>
						</div>
						<div className='text-center'>
							<div className='text-3xl font-bold text-white mb-2'>500M+</div>
							<div className='text-purple-200 text-sm'>Messages Processed</div>
						</div>
						<div className='text-center'>
							<div className='text-3xl font-bold text-white mb-2'>99%</div>
							<div className='text-purple-200 text-sm'>Privacy Protected</div>
						</div>
					</div> */}
				</div>
			</section>

			{/* Application Management Feature Highlight */}
			<section className='relative z-10 px-6 py-20'>
				<div className='max-w-6xl mx-auto'>
					<div className='text-center mb-16'>
						<h2 className='text-4xl md:text-6xl font-black text-white mb-6'>
							<span className='bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent'>STREAMLINE YOUR</span>
							<br />
							<span className='text-white'>APPLICATIONS</span>
						</h2>
						<p className='text-xl text-purple-100 max-w-3xl mx-auto leading-relaxed'>
							Create professional application forms, automate email notifications, and manage new members with ease.
						</p>
					</div>

					<div className='grid lg:grid-cols-2 gap-12 items-center'>
						<div className='bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/30'>
							<div className='text-center space-y-6'>
								<div className='w-20 h-20 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-full flex items-center justify-center mx-auto'>
									<MessageCircle className='w-10 h-10 text-white' />
								</div>
								<h3 className='text-3xl font-bold text-white'>Perfect for Growing Communities</h3>
								<p className='text-white/90 text-lg leading-relaxed'>
									Whether you&apos;re managing a work team, hobby group, or exclusive community - handle applications like a pro with automated workflows.
								</p>
							</div>
						</div>

						<div className='space-y-6'>
							<div className='bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20'>
								<div className='flex items-center space-x-4 mb-4'>
									<div className='w-12 h-12 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center'>
										<MessageCircle className='w-6 h-6 text-white' />
									</div>
									<h3 className='text-xl font-bold text-white'>Drag & Drop Form Builder</h3>
								</div>
								<p className='text-white/90'>Create custom application forms with multiple question types, password protection, and custom URLs.</p>
							</div>

							<div className='bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20'>
								<div className='flex items-center space-x-4 mb-4'>
									<div className='w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center'>
										<CheckCircle className='w-6 h-6 text-white' />
									</div>
									<h3 className='text-xl font-bold text-white'>Automated Email Workflows</h3>
								</div>
								<p className='text-white/90'>Automatically send confirmation, acceptance, and denial emails. Re-send messages and track delivery status.</p>
							</div>

							<div className='bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20'>
								<div className='flex items-center space-x-4 mb-4'>
									<div className='w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center'>
										<Users className='w-6 h-6 text-white' />
									</div>
									<h3 className='text-xl font-bold text-white'>Application Management Hub</h3>
								</div>
								<p className='text-white/90'>Review applications, make decisions, and manage your community growth all from one central dashboard.</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Public Directory Feature Highlight */}
			<section className='relative z-10 px-6 py-20'>
				<div className='max-w-6xl mx-auto'>
					<div className='text-center mb-16'>
						<h2 className='text-4xl md:text-6xl font-black text-white mb-6'>
							<span className='bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent'>SHARE WITH YOUR</span>
							<br />
							<span className='text-white'>COMMUNITY</span>
						</h2>
						<p className='text-xl text-purple-100 max-w-3xl mx-auto leading-relaxed'>
							Don&apos;t keep the insights to yourself! Create stunning public member directories that your entire community can explore.
						</p>
					</div>

					<div className='grid lg:grid-cols-2 gap-12 items-center'>
						<div className='space-y-6'>
							<div className='bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20'>
								<div className='flex items-center space-x-4 mb-4'>
									<div className='w-12 h-12 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full flex items-center justify-center'>
										<Users className='w-6 h-6 text-white' />
									</div>
									<h3 className='text-xl font-bold text-white'>Interactive Member Profiles</h3>
								</div>
								<p className='text-white/90'>Browse detailed profiles showing message counts, activity patterns, and last seen dates for every member.</p>
							</div>

							<div className='bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20'>
								<div className='flex items-center space-x-4 mb-4'>
									<div className='w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center'>
										<Sparkles className='w-6 h-6 text-white' />
									</div>
									<h3 className='text-xl font-bold text-white'>AI-Generated Recaps</h3>
								</div>
								<p className='text-white/90'>
									Share intelligent summaries of conversations, trending topics, key decisions, and important resources with flexible time ranges.
								</p>
							</div>

							<div className='bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20'>
								<div className='flex items-center space-x-4 mb-4'>
									<div className='w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center'>
										<Share2 className='w-6 h-6 text-white' />
									</div>
									<h3 className='text-xl font-bold text-white'>Password Protection</h3>
								</div>
								<p className='text-white/90'>Keep your community directory secure with optional password protection and customizable expiration dates.</p>
							</div>
						</div>

						<div className='bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/30'>
							<div className='text-center space-y-6'>
								<div className='w-20 h-20 bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-400 rounded-full flex items-center justify-center mx-auto'>
									<Users className='w-10 h-10 text-white' />
								</div>
								<h3 className='text-3xl font-bold text-white'>Perfect for Communities</h3>
								<p className='text-white/90 text-lg leading-relaxed'>
									Whether it&apos;s your friend group, work team, family chat, or hobby community - give everyone access to beautiful, organized insights about
									your shared conversations.
								</p>
								<div className='bg-white/10 rounded-xl p-4 border border-white/20'>
									<p className='text-white/80 text-sm italic'>
										&quot;Finally, a way to see who the real group chat MVP is! Our whole team loves browsing the member directory.&quot;
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* How It Works */}
			<section className='relative z-10 px-6 py-20 bg-black/20'>
				<div className='max-w-5xl mx-auto text-center'>
					<h2 className='text-4xl md:text-6xl font-black text-white mb-16'>
						<span className='bg-gradient-to-r from-green-300 to-blue-300 bg-clip-text text-transparent'>STUPID SIMPLE</span>
					</h2>

					<div className='grid md:grid-cols-4 gap-8'>
						<div className='text-center'>
							<div className='w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white'>
								1
							</div>
							<h3 className='text-xl font-bold text-white mb-4'>EXPORT YOUR CHAT</h3>
							<p className='text-purple-100 text-sm'>Go to WhatsApp → Chat → Export → Without Media. Takes 10 seconds.</p>
						</div>

						<div className='text-center'>
							<div className='w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white'>
								2
							</div>
							<h3 className='text-xl font-bold text-white mb-4'>UPLOAD & ANALYZE</h3>
							<p className='text-purple-100 text-sm'>Drop the file here. Our AI analyzes everything while you grab a coffee.</p>
						</div>

						<div className='text-center'>
							<div className='w-20 h-20 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white'>
								3
							</div>
							<h3 className='text-xl font-bold text-white mb-4'>BUILD YOUR FORMS</h3>
							<p className='text-purple-100 text-sm'>Create application forms and set up automated workflows for new members.</p>
						</div>

						<div className='text-center'>
							<div className='w-20 h-20 bg-gradient-to-r from-emerald-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white'>
								4
							</div>
							<h3 className='text-xl font-bold text-white mb-4'>SHARE & GROW</h3>
							<p className='text-purple-100 text-sm'>Share directories and manage your thriving community with powerful tools.</p>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className='relative z-10 px-6 py-20'>
				<div className='max-w-6xl mx-auto'>
					<div className='text-center mb-16'>
						<h2 className='text-4xl md:text-6xl font-black text-white mb-6'>
							<span className='bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent'>RIDICULOUSLY</span>
							<br />
							<span className='text-white'>DETAILED INSIGHTS</span>
						</h2>
						<p className='text-xl text-purple-100 max-w-2xl mx-auto'>
							We don&apos;t just count messages. We reveal the hidden patterns, personalities, and dynamics that make your group special.
						</p>
					</div>

					<div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8'>
						<Card
							includeStatsCardStyles={false}
							className='bg-white/10 rounded-md backdrop-blur-sm border-white/30 hover:bg-white/20 transition-all duration-300 transform hover:scale-105'>
							<CardContent className='p-8 text-center'>
								<div className='w-16 h-16 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-6'>
									<MessageCircle className='w-8 h-8 text-white' />
								</div>
								<h3 className='text-2xl font-bold text-white mb-4'>APPLICATION FORMS</h3>
								<p className='text-white/90 leading-relaxed'>Build custom forms with drag-and-drop simplicity. Manage applications effortlessly.</p>
							</CardContent>
						</Card>

						<Card
							includeStatsCardStyles={false}
							className='bg-white/10 rounded-md backdrop-blur-sm border-white/30 hover:bg-white/20 transition-all duration-300 transform hover:scale-105'>
							<CardContent className='p-8 text-center'>
								<div className='w-16 h-16 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6'>
									<TrendingUp className='w-8 h-8 text-white' />
								</div>
								<h3 className='text-2xl font-bold text-white mb-4'>TRENDING TOPICS</h3>
								<p className='text-white/90 leading-relaxed'>See what your group actually talks about. Spoiler: it&apos;s probably not what you think.</p>
							</CardContent>
						</Card>

						<Card
							includeStatsCardStyles={false}
							className='bg-white/10 rounded-md backdrop-blur-sm border-white/30 hover:bg-white/20 transition-all duration-300 transform hover:scale-105'>
							<CardContent className='p-8 text-center'>
								<div className='w-16 h-16 bg-gradient-to-r from-green-400 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-6'>
									<Clock className='w-8 h-8 text-white' />
								</div>
								<h3 className='text-2xl font-bold text-white mb-4'>PERFECT TIMING</h3>
								<p className='text-white/90 leading-relaxed'>Discover when your group is most active and who the night owls really are.</p>
							</CardContent>
						</Card>

						<Card
							includeStatsCardStyles={false}
							className='bg-white/10 rounded-md backdrop-blur-sm border-white/30 hover:bg-white/20 transition-all duration-300 transform hover:scale-105'>
							<CardContent className='p-8 text-center'>
								<div className='w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-6'>
									<Users className='w-8 h-8 text-white' />
								</div>
								<h3 className='text-2xl font-bold text-white mb-4'>PUBLIC DIRECTORY</h3>
								<p className='text-white/90 leading-relaxed'>
									Create shareable directories with members, resources, and AI recaps that your whole community can access.
								</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			<section className='relative z-10 px-6 py-20'>
				<div className='max-w-4xl mx-auto text-center'>
					<h2 className='text-4xl md:text-6xl font-black text-white mb-8'>
						<span className='bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent'>READY TO BE</span>
						<br />
						<span className='text-white'>AMAZED?</span>
					</h2>
					<p className='text-xl text-purple-100 mb-12 max-w-2xl mx-auto'>
						Join thousands who&apos;ve discovered the hidden secrets in their group chats. Your first analysis is completely free!
					</p>

					<div className='flex flex-col sm:flex-row gap-4 justify-center'>
						<Button
							size='lg'
							className='bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-500 hover:from-yellow-500 hover:via-pink-500 hover:to-purple-600 text-white px-12 py-6 text-xl font-bold rounded-full shadow-2xl transform hover:scale-105 transition-all duration-200'>
							<Link href='/sign-up' className='flex items-center'>
								START FOR FREE <Star className='ml-3 w-6 h-6' />
							</Link>
						</Button>
					</div>

					{/* Trust badges */}
					<div className='mt-16 flex justify-center items-center space-x-8 opacity-60'>
						<div className='flex items-center space-x-2 text-white'>
							<CheckCircle className='w-5 h-5 text-green-400' />
							<span className='text-sm'>No signup required for first try</span>
						</div>
						<div className='flex items-center space-x-2 text-white'>
							<CheckCircle className='w-5 h-5 text-green-400' />
							<span className='text-sm'>100% secure & private</span>
						</div>
						<div className='flex items-center space-x-2 text-white'>
							<CheckCircle className='w-5 h-5 text-green-400' />
							<span className='text-sm'>Instant results</span>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className='relative z-10 px-6 py-12 border-t border-white/10'>
				<div className='max-w-6xl mx-auto'>
					<div className='flex flex-col md:flex-row justify-between items-center'>
						<div className='flex items-center space-x-2 mb-4 md:mb-0'>
							<div className='w-6 h-6 bg-gradient-to-r from-purple-400 to-blue-400 rounded flex items-center justify-center'>
								<MessageCircle className='w-4 h-4 text-white' />
							</div>
							<span className='text-lg font-bold text-white'>Waly</span>
						</div>
						<div className='text-purple-200 text-sm'>© 2024 Waly. Making group chats make sense.</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
