'use client';

import { useEffect, useState, useCallback } from 'react';
import { authClient } from '@/lib/auth-client';
import type { Invitation, Organization, User } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Mail, Users, Building2, AlertCircle } from 'lucide-react';

interface InvitationPageProps {
	params: Promise<{ id: string }>;
}

export default function AcceptInvitation({ params }: InvitationPageProps) {
	const [invitationId, setInvitationId] = useState<string>('');
	const [invitation, setInvitation] = useState<
		| (Invitation & {
				organization?: Pick<Organization, 'id' | 'name'>;
				inviter?: Pick<User, 'name' | 'email'>;
		  })
		| null
	>(null);
	const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'processing' | 'accepted'>('loading');
	const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
	const [errorMessage, setErrorMessage] = useState('');
	const [autoAcceptAttempted, setAutoAcceptAttempted] = useState(false);

	const handleAccept = useCallback(async () => {
		setStatus('processing');
		try {
			const response = await fetch(`/api/invitations/${invitationId}/accept`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			});

			if (response.ok) {
				let result;
				let text = '';
				try {
					text = await response.text();
					if (!text.trim()) {
						console.error('Empty response from server');
						setErrorMessage('Server returned empty response');
						setStatus('error');
						return;
					}
					result = JSON.parse(text);
				} catch (jsonError) {
					console.error('JSON parsing error:', jsonError);
					console.error('Response text:', text);
					setErrorMessage('Invalid response from server');
					setStatus('error');
					return;
				}

				setStatus('accepted');
				// Store organization info for success display
				setInvitation((prev) => ({ ...prev, ...result }));
				// Redirect to dashboard after showing success message
				setTimeout(() => {
					window.location.href = '/dashboard';
				}, 3000);
			} else {
				let error;
				try {
					const text = await response.text();
					error = text ? JSON.parse(text) : { error: 'Unknown error' };
				} catch (jsonError) {
					console.error('Error parsing error response:', jsonError);
					error = { error: 'Failed to parse error response' };
				}
				setErrorMessage(error.error || 'Failed to accept invitation');
				setStatus('error');
			}
		} catch (error) {
			console.error('Failed to accept invitation:', error);
			setErrorMessage('Network error or server unavailable');
			setStatus('error');
		}
	}, [invitationId]);

	useEffect(() => {
		const initPage = async () => {
			const resolvedParams = await params;
			setInvitationId(resolvedParams.id);

			// Always load invitation details first, regardless of auth status
			const invitationData = await loadInvitation(resolvedParams.id);

			// Then check authentication
			try {
				const session = await authClient.getSession();
				const isAuth = !!session.data?.user;
				setIsAuthenticated(isAuth);

				// If user is authenticated and we haven't attempted auto-accept yet
				if (isAuth && !autoAcceptAttempted && invitationData && session.data?.user.email === invitationData.email) {
					setAutoAcceptAttempted(true);
					console.log('Auto-accepting invitation for matching email');
					await handleAccept();
				}
			} catch (error) {
				console.error('Auth check failed:', error);
				setIsAuthenticated(false);
			}
		};

		initPage();
	}, [params, autoAcceptAttempted, handleAccept]);

	const loadInvitation = async (id: string) => {
		try {
			// Use public API endpoint that doesn't require authentication
			const response = await fetch(`/api/invitations/${id}`);

			if (response.ok) {
				const data = await response.json();
				setInvitation(data.invitation);
				setStatus('success');
				return data.invitation;
			} else {
				setErrorMessage('This invitation is invalid or has expired.');
				setStatus('error');
				return null;
			}
		} catch (error) {
			console.error('Failed to load invitation:', error);
			setErrorMessage('Failed to load invitation details.');
			setStatus('error');
			return null;
		}
	};

	const handleReject = async () => {
		setStatus('processing');
		try {
			const response = await fetch('/api/organization/invitations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					invitationId,
					action: 'reject',
				}),
			});

			if (response.ok) {
				// Redirect to home page after rejection
				setTimeout(() => {
					window.location.href = '/';
				}, 2000);
			} else {
				const error = await response.json();
				setErrorMessage(error.error || 'Failed to reject invitation');
				setStatus('error');
			}
		} catch (error) {
			console.error('Failed to reject invitation:', error);
			setErrorMessage('Failed to process rejection');
			setStatus('error');
		}
	};

	// Loading state
	if (status === 'loading') {
		return (
			<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'>
				<Card className='w-full max-w-md mx-auto shadow-lg'>
					<CardContent className='p-8 text-center'>
						<div className='animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4'></div>
						<p className='text-gray-600'>Loading invitation...</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Not authenticated
	if (isAuthenticated === false) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'>
				<Card className='w-full max-w-md mx-auto shadow-lg'>
					<CardHeader className='text-center'>
						<div className='w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4'>
							<Mail className='w-8 h-8 text-white' />
						</div>
						<CardTitle className='text-xl font-bold text-gray-900'>Team Invitation</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<Alert>
							<AlertCircle className='w-4 h-4' />
							<AlertDescription>
								{invitation ? (
									<>
										You need to sign in with <strong>{invitation.email}</strong> to accept this team invitation.
									</>
								) : (
									'You need to sign in to accept this team invitation.'
								)}
							</AlertDescription>
						</Alert>
						<div className='space-y-2'>
							<Button
								onClick={() => {
									const params = new URLSearchParams({
										redirect: `/accept-invitation/${invitationId}`,
									});
									if (invitation?.email) {
										params.set('email', invitation.email);
									}
									window.location.href = `/sign-in?${params.toString()}`;
								}}
								className='w-full'>
								Sign In to Continue
							</Button>
							<Button
								variant='outline'
								onClick={() => {
									const params = new URLSearchParams({
										redirect: `/accept-invitation/${invitationId}`,
									});
									if (invitation?.email) {
										params.set('email', invitation.email);
									}
									window.location.href = `/sign-up?${params.toString()}`;
								}}
								className='w-full'>
								Create Account
							</Button>
						</div>

						{invitation && (
							<div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
								<p className='text-sm text-blue-700'>
									<strong>Invited to:</strong> {invitation.organization?.name}
								</p>
								<p className='text-sm text-blue-700'>
									<strong>Role:</strong> {invitation.role}
								</p>
								<p className='text-sm text-blue-700'>
									<strong>Invited by:</strong> {invitation.inviter?.name} ({invitation.inviter?.email})
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		);
	}

	// Error state
	if (status === 'error') {
		return (
			<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'>
				<Card className='w-full max-w-md mx-auto shadow-lg'>
					<CardHeader className='text-center'>
						<div className='w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4'>
							<XCircle className='w-8 h-8 text-white' />
						</div>
						<CardTitle className='text-xl font-bold text-gray-900'>Invitation Error</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<Alert variant='destructive'>
							<AlertCircle className='w-4 h-4' />
							<AlertDescription>{errorMessage}</AlertDescription>
						</Alert>
						<Button onClick={() => (window.location.href = '/dashboard')} className='w-full' variant='outline'>
							Go to Dashboard
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Processing states
	if (status === 'processing') {
		return (
			<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'>
				<Card className='w-full max-w-md mx-auto shadow-lg'>
					<CardContent className='p-8 text-center'>
						<div className='animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4'></div>
						<p className='text-gray-600'>Processing your response...</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Accepted state - show success message
	if (status === 'accepted') {
		return (
			<div className='min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4'>
				<Card className='w-full max-w-md mx-auto shadow-lg'>
					<CardHeader className='text-center'>
						<div className='w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4'>
							<CheckCircle className='w-8 h-8 text-white' />
						</div>
						<CardTitle className='text-xl font-bold text-gray-900'>Welcome to the Team!</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4 text-center'>
						<div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
							<p className='text-green-800 font-medium'>
								You&apos;ve successfully joined <strong>{invitation?.organization?.name}</strong>
							</p>
							<p className='text-green-600 text-sm mt-1'>Role: {invitation?.role}</p>
						</div>
						<div className='animate-spin w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full mx-auto'></div>
						<p className='text-gray-600'>Redirecting to your dashboard...</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Success state - show invitation details
	return (
		<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'>
			<Card className='w-full max-w-md mx-auto shadow-lg'>
				<CardHeader className='text-center'>
					<div className='w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4'>
						<Users className='w-8 h-8 text-white' />
					</div>
					<CardTitle className='text-xl font-bold text-gray-900'>Team Invitation</CardTitle>
				</CardHeader>
				<CardContent className='space-y-6'>
					{invitation ? (
						<>
							<div className='text-center'>
								<p className='text-gray-600 mb-2'>You&apos;ve been invited to join</p>
								<div className='flex items-center justify-center gap-2 mb-2'>
									<Building2 className='w-5 h-5 text-gray-600' />
									<span className='font-semibold text-gray-900 text-lg'>{invitation.organization?.name || 'Organization'}</span>
								</div>
								<Badge variant={invitation.role === 'admin' ? 'default' : 'secondary'}>{invitation.role} role</Badge>
							</div>

							<div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
								<h4 className='font-medium text-blue-900 mb-2'>What you&apos;ll get access to:</h4>
								<ul className='text-sm text-blue-700 space-y-1'>
									<li>• Collaborate on community analytics</li>
									<li>• Create and manage member directories</li>
									<li>• Build application forms</li>
									{invitation.role === 'admin' && <li>• Manage team members and settings</li>}
								</ul>
							</div>

							<div className='space-y-3'>
								<Button onClick={handleAccept} className='w-full' size='lg'>
									<CheckCircle className='w-4 h-4 mr-2' />
									Accept Invitation
								</Button>
								<Button onClick={handleReject} variant='outline' className='w-full' size='lg'>
									<XCircle className='w-4 h-4 mr-2' />
									Decline
								</Button>
							</div>
						</>
					) : (
						<div className='text-center'>
							<p className='text-gray-600'>Loading invitation details...</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
