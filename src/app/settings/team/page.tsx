'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Users, UserPlus, Trash2, Mail, Crown, User, ArrowLeft, Edit2, Check, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { AdminOnly, useUserRole } from '@/components/auth/RoleGuard';
import { RoleToggle } from '@/components/ui/role-toggle';
import {
	useOrganization,
	useOrganizationMembers,
	useOrganizationInvitations,
	useUpdateOrganizationName,
	useChangeRole,
	useInviteMember,
	organizationKeys,
	type MemberWithUser,
} from '@/hooks/useOrganization';
import { useQueryClient } from '@tanstack/react-query';

export default function TeamPage() {
	const router = useRouter();
	const queryClient = useQueryClient();

	// React Query hooks
	const { data: organization, isLoading: orgLoading } = useOrganization();
	const { data: members = [], isLoading: membersLoading, error: membersError } = useOrganizationMembers();
	const { data: invitations = [] } = useOrganizationInvitations();
	const { data: userRole } = useUserRole();

	// Debug logging
	console.log('Team page debug:', {
		members,
		membersCount: members?.length,
		membersLoading,
		membersError,
		userRole,
		organization,
	});

	// Mutations
	const updateOrgNameMutation = useUpdateOrganizationName();
	const changeRoleMutation = useChangeRole();
	const inviteMemberMutation = useInviteMember();

	// Local state
	const [inviteEmail, setInviteEmail] = useState('');
	const [inviteRole, setInviteRole] = useState('member');
	const [inviteModalOpen, setInviteModalOpen] = useState(false);
	const [isEditingOrgName, setIsEditingOrgName] = useState(false);
	const [editOrgName, setEditOrgName] = useState('');
	const [processingInvitations, setProcessingInvitations] = useState<Set<string>>(new Set());

	const loading = orgLoading || membersLoading;

	// Set initial edit name when organization loads
	if (organization && !editOrgName) {
		setEditOrgName(organization.name);
	}

	const handleInviteMember = async () => {
		if (!inviteEmail || !inviteEmail.includes('@')) {
			toast.error('Please enter a valid email address');
			return;
		}

		try {
			await inviteMemberMutation.mutateAsync({
				email: inviteEmail,
				role: inviteRole,
			});

			toast.success('Invitation sent successfully');
			setInviteEmail('');
			setInviteRole('member');
			setInviteModalOpen(false);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to send invitation');
		}
	};

	const handleRemoveMember = async (member: MemberWithUser) => {
		if (!confirm(`Are you sure you want to remove ${member.user.name} from the organization?`)) {
			return;
		}

		try {
			const response = await fetch('/api/organization/members', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					memberId: member.id,
				}),
			});

			if (response.ok) {
				toast.success(`${member.user.name} has been removed from the organization`);
				// Invalidate React Query cache to refetch members
				queryClient.invalidateQueries({ queryKey: organizationKeys.members() });
			} else {
				const error = await response.json();
				toast.error(error.error || 'Failed to remove member');
			}
		} catch (error) {
			console.error('Failed to remove member:', error);
			toast.error('Failed to remove member');
		}
	};

	const handleSaveOrgName = async () => {
		if (!editOrgName.trim()) {
			toast.error('Organization name cannot be empty');
			return;
		}

		try {
			await updateOrgNameMutation.mutateAsync(editOrgName.trim());
			toast.success('Organization name updated successfully');
			setIsEditingOrgName(false);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to update organization name');
		}
	};

	const handleCancelEditOrgName = () => {
		setEditOrgName(organization?.name || '');
		setIsEditingOrgName(false);
	};

	const handleDeleteInvitation = async (invitationId: string, email: string) => {
		if (!confirm(`Are you sure you want to delete the invitation for ${email}?`)) {
			return;
		}

		setProcessingInvitations((prev) => new Set(prev).add(invitationId));
		try {
			const response = await fetch(`/api/organization/invitations/${invitationId}`, {
				method: 'DELETE',
			});

			if (response.ok) {
				queryClient.invalidateQueries({ queryKey: organizationKeys.invitations() });
				toast.success('Invitation deleted successfully');
			} else {
				const error = await response.json();
				toast.error(error.error || 'Failed to delete invitation');
			}
		} catch (error) {
			console.error('Failed to delete invitation:', error);
			toast.error('Failed to delete invitation');
		} finally {
			setProcessingInvitations((prev) => {
				const newSet = new Set(prev);
				newSet.delete(invitationId);
				return newSet;
			});
		}
	};

	const handleChangeRole = async (memberId: string, memberName: string, newRole: 'admin' | 'member') => {
		try {
			await changeRoleMutation.mutateAsync({ memberId, role: newRole });
			toast.success(`${memberName}'s role updated to ${newRole}`);
		} catch (error) {
			console.error('Failed to update role:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to update role');
			throw error; // Re-throw so the toggle can handle the error state
		}
	};

	const handleResendInvitation = async (invitationId: string, email: string) => {
		setProcessingInvitations((prev) => new Set(prev).add(invitationId));
		try {
			const response = await fetch(`/api/organization/invitations/${invitationId}`, {
				method: 'PATCH',
			});

			if (response.ok) {
				queryClient.invalidateQueries({ queryKey: organizationKeys.invitations() });
				toast.success(`Invitation resent to ${email}`);
			} else {
				const error = await response.json();
				toast.error(error.error || 'Failed to resend invitation');
			}
		} catch (error) {
			console.error('Failed to resend invitation:', error);
			toast.error('Failed to resend invitation');
		} finally {
			setProcessingInvitations((prev) => {
				const newSet = new Set(prev);
				newSet.delete(invitationId);
				return newSet;
			});
		}
	};

	if (loading) {
		return (
			<div className='container mx-auto px-4 py-8'>
				<div className='animate-pulse'>
					<div className='h-8 bg-gray-200 rounded w-1/4 mb-4'></div>
					<div className='h-4 bg-gray-200 rounded w-1/2 mb-8'></div>
					<div className='space-y-4'>
						<div className='h-20 bg-gray-200 rounded'></div>
						<div className='h-64 bg-gray-200 rounded'></div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='container mx-auto px-4 py-8 space-y-8'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-4'>
					<Button variant='ghost' size='sm' onClick={() => router.push('/dashboard')} className='flex items-center gap-2 text-gray-600 hover:text-gray-900'>
						<ArrowLeft className='w-4 h-4' />
						Back to Dashboard
					</Button>
					<div className='border-l border-gray-300 h-8'></div>
					<div>
						<h1 className='text-3xl font-bold text-gray-900'>Team Management</h1>
						<p className='text-gray-600 mt-1'>Manage your organization members and invitations</p>
					</div>
				</div>

				<AdminOnly>
					<Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
						<DialogTrigger asChild>
							<Button className='flex items-center gap-2'>
								<UserPlus className='w-4 h-4' />
								Invite Member
							</Button>
						</DialogTrigger>
						<DialogContent className='sm:max-w-md'>
							<DialogHeader>
								<DialogTitle>Invite Team Member</DialogTitle>
							</DialogHeader>
							<div className='space-y-4'>
								<div>
									<Label htmlFor='email'>Email Address</Label>
									<Input id='email' type='email' placeholder='teammate@example.com' value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
								</div>
								<div>
									<Label htmlFor='role'>Role</Label>
									<select
										id='role'
										value={inviteRole}
										onChange={(e) => setInviteRole(e.target.value)}
										className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'>
										<option value='member'>Member</option>
										<option value='admin'>Admin</option>
									</select>
								</div>
								<div className='flex gap-2'>
									<Button onClick={handleInviteMember} disabled={inviteMemberMutation.isPending} className='flex-1'>
										{inviteMemberMutation.isPending ? 'Sending...' : 'Send Invitation'}
									</Button>
									<Button variant='outline' onClick={() => setInviteModalOpen(false)} disabled={inviteMemberMutation.isPending}>
										Cancel
									</Button>
								</div>
							</div>
						</DialogContent>
					</Dialog>
				</AdminOnly>
			</div>

			{/* Organization Info */}
			{organization && (
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2 justify-between'>
							<div className='flex items-center gap-2'>
								<Users className='w-5 h-5' />
								{isEditingOrgName ? (
									<div className='flex items-center gap-2'>
										<Input
											value={editOrgName}
											onChange={(e) => setEditOrgName(e.target.value)}
											className='text-lg font-semibold'
											placeholder='Organization name'
											disabled={updateOrgNameMutation.isPending}
										/>
										<Button size='sm' onClick={handleSaveOrgName} disabled={updateOrgNameMutation.isPending} className='flex items-center gap-1'>
											{updateOrgNameMutation.isPending ? (
												<div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
											) : (
												<Check className='w-4 h-4' />
											)}
										</Button>
										<Button size='sm' variant='outline' onClick={handleCancelEditOrgName} disabled={updateOrgNameMutation.isPending}>
											<X className='w-4 h-4' />
										</Button>
									</div>
								) : (
									<span>{organization.name}</span>
								)}
							</div>
							<AdminOnly>
								{!isEditingOrgName && (
									<Button
										size='sm'
										variant='ghost'
										onClick={() => setIsEditingOrgName(true)}
										className='flex items-center gap-1 text-gray-600 hover:text-gray-900'>
										<Edit2 className='w-4 h-4' />
										<span className='hidden sm:inline'>Edit</span>
									</Button>
								)}
							</AdminOnly>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm text-gray-600'>{members.length}/10 members</p>
								<p className='text-xs text-gray-500 mt-1'>Created {new Date(organization.createdAt).toLocaleDateString()}</p>
							</div>
							<Badge variant='secondary'>{organization.metadata && JSON.parse(organization.metadata).isPersonal ? 'Personal' : 'Team'}</Badge>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Members Table */}
			<Card>
				<CardHeader>
					<CardTitle>Team Members ({members.length})</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Role</TableHead>
								<TableHead>Joined</TableHead>
								<AdminOnly>
									<TableHead>Actions</TableHead>
								</AdminOnly>
							</TableRow>
						</TableHeader>
						<TableBody>
							{members && members.length > 0 ? (
								members.map((member) => (
									<TableRow key={member.id}>
										<TableCell className='font-medium'>
											<div className='flex items-center gap-2'>
												{member.role === 'admin' ? <Crown className='w-4 h-4 text-yellow-500' /> : <User className='w-4 h-4 text-gray-400' />}
												{member.user.name}
											</div>
										</TableCell>
										<TableCell>{member.user.email}</TableCell>
										<TableCell>
											<div className='flex items-center gap-3'>
												<Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
													{member.role === 'admin' ? (
														<>
															<Crown className='w-3 h-3 mr-1' />
															Admin
														</>
													) : (
														<>
															<User className='w-3 h-3 mr-1' />
															Member
														</>
													)}
												</Badge>
												<AdminOnly>
													<RoleToggle
														currentRole={member.role as 'admin' | 'member'}
														onRoleChange={(newRole) => handleChangeRole(member.id, member.user.name, newRole)}
														userName={member.user.name}
														disabled={member.user.email === userRole?.email}
														className='ml-2'
													/>
												</AdminOnly>
											</div>
										</TableCell>
										<TableCell>{new Date(member.createdAt).toLocaleDateString()}</TableCell>
										<AdminOnly>
											<TableCell>
												{member.role !== 'admin' ? (
													<Button
														variant='ghost'
														size='sm'
														onClick={() => handleRemoveMember(member)}
														className='text-red-600 hover:text-red-700 hover:bg-red-50'>
														<Trash2 className='w-4 h-4' />
													</Button>
												) : (
													<span className='text-xs text-gray-400'>Protected</span>
												)}
											</TableCell>
										</AdminOnly>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={5} className='text-center text-gray-500 py-8'>
										{loading ? 'Loading members...' : 'No team members found'}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* Pending Invitations */}
			<AdminOnly>
				{invitations.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Mail className='w-5 h-5' />
								Pending Invitations ({invitations.length})
							</CardTitle>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Email</TableHead>
										<TableHead>Role</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Sent</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{invitations.map((invitation) => (
										<TableRow key={invitation.id}>
											<TableCell>{invitation.email}</TableCell>
											<TableCell>
												<Badge variant={invitation.role === 'admin' ? 'default' : 'secondary'}>{invitation.role}</Badge>
											</TableCell>
											<TableCell>
												<Badge variant='outline'>{invitation.status}</Badge>
											</TableCell>
											<TableCell>{new Date(invitation.createdAt).toLocaleDateString()}</TableCell>
											<TableCell>
												<div className='flex items-center gap-2'>
													<Button
														size='sm'
														variant='ghost'
														onClick={() => handleResendInvitation(invitation.id, invitation.email)}
														disabled={processingInvitations.has(invitation.id)}
														className='flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50'>
														{processingInvitations.has(invitation.id) ? (
															<div className='w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
														) : (
															<RefreshCw className='w-4 h-4' />
														)}
														<span className='hidden sm:inline'>Resend</span>
													</Button>
													<Button
														size='sm'
														variant='ghost'
														onClick={() => handleDeleteInvitation(invitation.id, invitation.email)}
														disabled={processingInvitations.has(invitation.id)}
														className='flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50'>
														<Trash2 className='w-4 h-4' />
														<span className='hidden sm:inline'>Delete</span>
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				)}
			</AdminOnly>
		</div>
	);
}
