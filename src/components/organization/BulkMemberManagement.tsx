'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, Users, Mail, Crown, User, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useInviteMember, organizationKeys, type MemberWithUser } from '@/hooks/useOrganization';
import { useQueryClient } from '@tanstack/react-query';

interface BulkMemberManagementProps {
	members: MemberWithUser[];
}

export function BulkMemberManagement({ members }: BulkMemberManagementProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [bulkEmails, setBulkEmails] = useState('');
	const [bulkRole, setBulkRole] = useState('member');
	const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
	const [newRole, setNewRole] = useState<'admin' | 'member'>('member');
	const [isProcessing, setIsProcessing] = useState(false);

	const queryClient = useQueryClient();
	const inviteMemberMutation = useInviteMember();

	const handleBulkInvite = async () => {
		const emailList = bulkEmails
			.split('\n')
			.map(email => email.trim())
			.filter(email => email && email.includes('@'));

		if (emailList.length === 0) {
			toast.error('Please enter at least one valid email address');
			return;
		}

		setIsProcessing(true);
		let successCount = 0;
		let errorCount = 0;

		for (const email of emailList) {
			try {
				await inviteMemberMutation.mutateAsync({
					email,
					role: bulkRole,
				});
				successCount++;
			} catch (error) {
				console.error(`Failed to invite ${email}:`, error);
				errorCount++;
			}
		}

		setIsProcessing(false);
		
		if (successCount > 0) {
			toast.success(`Successfully sent ${successCount} invitation(s)`);
		}
		if (errorCount > 0) {
			toast.error(`Failed to send ${errorCount} invitation(s)`);
		}

		if (successCount > 0) {
			setBulkEmails('');
			setIsOpen(false);
		}
	};

	const handleBulkRoleChange = async () => {
		if (selectedMembers.size === 0) {
			toast.error('Please select at least one member');
			return;
		}

		setIsProcessing(true);
		let successCount = 0;
		let errorCount = 0;

		for (const memberId of selectedMembers) {
			try {
				const response = await fetch(`/api/organization/members/${memberId}/role`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ role: newRole }),
				});

				if (response.ok) {
					successCount++;
				} else {
					errorCount++;
				}
			} catch (error) {
				console.error(`Failed to change role for member ${memberId}:`, error);
				errorCount++;
			}
		}

		setIsProcessing(false);
		
		if (successCount > 0) {
			toast.success(`Successfully updated ${successCount} member(s)`);
			// Invalidate members cache to refetch updated data
			queryClient.invalidateQueries({ queryKey: organizationKeys.members() });
		}
		if (errorCount > 0) {
			toast.error(`Failed to update ${errorCount} member(s)`);
		}

		if (successCount > 0) {
			setSelectedMembers(new Set());
			setIsOpen(false);
		}
	};

	const toggleMemberSelection = (memberId: string) => {
		const updated = new Set(selectedMembers);
		if (updated.has(memberId)) {
			updated.delete(memberId);
		} else {
			updated.add(memberId);
		}
		setSelectedMembers(updated);
	};

	const selectAllMembers = () => {
		if (selectedMembers.size === members.length) {
			setSelectedMembers(new Set());
		} else {
			setSelectedMembers(new Set(members.map(m => m.id)));
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant='outline' className='flex items-center gap-2'>
					<Users className='w-4 h-4' />
					Bulk Actions
				</Button>
			</DialogTrigger>
			<DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2'>
						<Users className='w-5 h-5' />
						Bulk Member Management
					</DialogTitle>
				</DialogHeader>

				<Tabs defaultValue='invite' className='w-full'>
					<TabsList className='grid w-full grid-cols-2'>
						<TabsTrigger value='invite' className='flex items-center gap-2'>
							<UserPlus className='w-4 h-4' />
							Bulk Invite
						</TabsTrigger>
						<TabsTrigger value='manage' className='flex items-center gap-2'>
							<Crown className='w-4 h-4' />
							Bulk Role Change
						</TabsTrigger>
					</TabsList>

					<TabsContent value='invite' className='space-y-4'>
						<Card>
							<CardHeader>
								<CardTitle className='text-lg'>Invite Multiple Members</CardTitle>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='space-y-2'>
									<Label htmlFor='bulkEmails'>Email Addresses</Label>
									<Textarea
										id='bulkEmails'
										placeholder='Enter email addresses, one per line:&#10;john@example.com&#10;jane@example.com&#10;...'
										value={bulkEmails}
										onChange={(e) => setBulkEmails(e.target.value)}
										rows={6}
										className='font-mono text-sm'
									/>
									<div className='text-xs text-gray-500'>
										Enter one email address per line. Invalid emails will be skipped.
									</div>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='bulkRole'>Default Role</Label>
									<select
										id='bulkRole'
										value={bulkRole}
										onChange={(e) => setBulkRole(e.target.value)}
										className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
									>
										<option value='member'>Member</option>
										<option value='admin'>Admin</option>
									</select>
								</div>

								<Alert>
									<Mail className='w-4 h-4' />
									<AlertDescription>
										Invitation emails will be sent to all valid addresses. Recipients can accept or decline the invitations.
									</AlertDescription>
								</Alert>

								<div className='flex gap-2'>
									<Button 
										onClick={handleBulkInvite} 
										disabled={isProcessing || !bulkEmails.trim()}
										className='flex-1'
									>
										{isProcessing ? 'Sending Invitations...' : 'Send Bulk Invitations'}
									</Button>
									<Button 
										variant='outline' 
										onClick={() => setIsOpen(false)}
										disabled={isProcessing}
									>
										Cancel
									</Button>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value='manage' className='space-y-4'>
						<Card>
							<CardHeader>
								<CardTitle className='text-lg'>Bulk Role Management</CardTitle>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='space-y-2'>
									<div className='flex items-center justify-between'>
										<Label>Select Members</Label>
										<Button
											variant='ghost'
											size='sm'
											onClick={selectAllMembers}
											className='text-xs'
										>
											{selectedMembers.size === members.length ? 'Deselect All' : 'Select All'}
										</Button>
									</div>
									
									<div className='border rounded-md p-3 max-h-48 overflow-y-auto'>
										{members.length === 0 ? (
											<div className='text-center text-gray-500 py-4'>No members found</div>
										) : (
											<div className='space-y-2'>
												{members.map((member) => (
													<div key={member.id} className='flex items-center space-x-3'>
														<Checkbox
															id={member.id}
															checked={selectedMembers.has(member.id)}
															onCheckedChange={() => toggleMemberSelection(member.id)}
														/>
														<div className='flex items-center gap-2 flex-1'>
															{member.role === 'admin' ? (
																<Crown className='w-4 h-4 text-yellow-500' />
															) : (
																<User className='w-4 h-4 text-gray-400' />
															)}
															<span className='text-sm'>{member.user.name}</span>
															<Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className='text-xs'>
																{member.role}
															</Badge>
														</div>
													</div>
												))}
											</div>
										)}
									</div>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='newRole'>New Role</Label>
									<select
										id='newRole'
										value={newRole}
										onChange={(e) => setNewRole(e.target.value as 'admin' | 'member')}
										className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
									>
										<option value='member'>Member</option>
										<option value='admin'>Admin</option>
									</select>
								</div>

								{selectedMembers.size > 0 && (
									<Alert>
										<AlertCircle className='w-4 h-4' />
										<AlertDescription>
											You are about to change the role of {selectedMembers.size} member(s) to <strong>{newRole}</strong>. This action cannot be undone.
										</AlertDescription>
									</Alert>
								)}

								<div className='flex gap-2'>
									<Button 
										onClick={handleBulkRoleChange} 
										disabled={isProcessing || selectedMembers.size === 0}
										className='flex-1'
									>
										{isProcessing ? 'Updating Roles...' : `Update ${selectedMembers.size} Member(s)`}
									</Button>
									<Button 
										variant='outline' 
										onClick={() => setIsOpen(false)}
										disabled={isProcessing}
									>
										Cancel
									</Button>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}