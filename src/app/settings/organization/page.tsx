'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Settings, Building2, Palette, AlertTriangle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { AdminOnly } from '@/components/auth/RoleGuard';
import { 
	useOrganization, 
	useOrganizationMembers,
	useUpdateOrganizationName
} from '@/hooks/useOrganization';

export default function OrganizationSettingsPage() {
	const router = useRouter();
	const { data: organization, isLoading: orgLoading } = useOrganization();
	const { data: members = [] } = useOrganizationMembers();
	const updateOrgNameMutation = useUpdateOrganizationName();

	// Local state
	const [orgName, setOrgName] = useState('');
	const [isEditingName, setIsEditingName] = useState(false);

	// Set initial values when organization loads
	if (organization && !orgName && !isEditingName) {
		setOrgName(organization.name);
	}

	const handleSaveOrgName = async () => {
		if (!orgName.trim()) {
			toast.error('Organization name cannot be empty');
			return;
		}

		try {
			await updateOrgNameMutation.mutateAsync(orgName.trim());
			toast.success('Organization name updated successfully');
			setIsEditingName(false);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to update organization name');
		}
	};

	const handleCancelEditName = () => {
		if (organization) {
			setOrgName(organization.name);
		}
		setIsEditingName(false);
	};

	if (orgLoading) {
		return (
			<div className='container mx-auto px-4 py-8'>
				<div className='animate-pulse'>
					<div className='h-8 bg-gray-200 rounded w-1/4 mb-4'></div>
					<div className='h-4 bg-gray-200 rounded w-1/2 mb-8'></div>
					<div className='space-y-4'>
						<div className='h-32 bg-gray-200 rounded'></div>
						<div className='h-32 bg-gray-200 rounded'></div>
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
					<Button 
						variant='ghost' 
						size='sm' 
						onClick={() => router.push('/dashboard')} 
						className='flex items-center gap-2 text-gray-600 hover:text-gray-900'
					>
						<ArrowLeft className='w-4 h-4' />
						Back to Dashboard
					</Button>
					<div className='border-l border-gray-300 h-8'></div>
					<div>
						<h1 className='text-3xl font-bold text-gray-900 flex items-center gap-2'>
							<Settings className='w-8 h-8' />
							Organization Settings
						</h1>
						<p className='text-gray-600 mt-1'>Manage your organization preferences and configuration</p>
					</div>
				</div>
			</div>

			{/* Admin Only Notice */}
			<AdminOnly
				fallback={
					<Alert>
						<AlertTriangle className='w-4 h-4' />
						<AlertDescription>
							Only organization administrators can modify these settings. You are viewing in read-only mode.
						</AlertDescription>
					</Alert>
				}
			>
				<div></div>
			</AdminOnly>

			{/* Organization Info */}
			{organization && (
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Building2 className='w-5 h-5' />
							Organization Information
						</CardTitle>
					</CardHeader>
					<CardContent className='space-y-6'>
						{/* Organization Name */}
						<div className='space-y-2'>
							<Label htmlFor='orgName'>Organization Name</Label>
							{isEditingName ? (
								<div className='flex items-center gap-2'>
									<Input
										id='orgName'
										value={orgName}
										onChange={(e) => setOrgName(e.target.value)}
										placeholder='Enter organization name'
										disabled={updateOrgNameMutation.isPending}
									/>
									<AdminOnly>
										<Button 
											size='sm' 
											onClick={handleSaveOrgName} 
											disabled={updateOrgNameMutation.isPending || !orgName.trim() || orgName === organization.name}
											className='flex items-center gap-1'
										>
											{updateOrgNameMutation.isPending ? (
												<div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
											) : (
												<Save className='w-4 h-4' />
											)}
											Save
										</Button>
										<Button 
											size='sm' 
											variant='outline' 
											onClick={handleCancelEditName}
											disabled={updateOrgNameMutation.isPending}
										>
											Cancel
										</Button>
									</AdminOnly>
								</div>
							) : (
								<div className='flex items-center justify-between'>
									<span className='text-lg font-medium'>{organization.name}</span>
									<AdminOnly>
										<Button
											size='sm'
											variant='ghost'
											onClick={() => setIsEditingName(true)}
											className='text-gray-600 hover:text-gray-900'
										>
											Edit
										</Button>
									</AdminOnly>
								</div>
							)}
						</div>

						<Separator />

						{/* Organization Stats */}
						<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
							<div className='text-center p-4 bg-blue-50 rounded-lg'>
								<div className='text-2xl font-bold text-blue-600'>{members.length}</div>
								<div className='text-sm text-blue-700'>Total Members</div>
							</div>
							<div className='text-center p-4 bg-green-50 rounded-lg'>
								<div className='text-2xl font-bold text-green-600'>
									{members.filter(m => m.role === 'admin').length}
								</div>
								<div className='text-sm text-green-700'>Administrators</div>
							</div>
							<div className='text-center p-4 bg-purple-50 rounded-lg'>
								<div className='text-2xl font-bold text-purple-600'>
									{new Date(organization.createdAt).toLocaleDateString()}
								</div>
								<div className='text-sm text-purple-700'>Created</div>
							</div>
						</div>

						<Separator />

						{/* Organization Type */}
						<div className='space-y-2'>
							<Label>Organization Type</Label>
							<div>
								<Badge variant='secondary' className='text-sm'>
									{organization.metadata && JSON.parse(organization.metadata).isPersonal ? 'Personal Organization' : 'Team Organization'}
								</Badge>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Customization Settings */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Palette className='w-5 h-5' />
						Appearance & Customization
					</CardTitle>
				</CardHeader>
				<CardContent className='space-y-6'>
					<div className='text-sm text-gray-600'>
						Customization features are coming soon! You&apos;ll be able to:
					</div>
					<ul className='text-sm text-gray-600 space-y-1 ml-4'>
						<li>• Upload a custom organization logo</li>
						<li>• Choose brand colors for your organization</li>
						<li>• Customize email templates for invitations</li>
						<li>• Set default community and directory settings</li>
					</ul>
				</CardContent>
			</Card>

			{/* Advanced Settings */}
			<AdminOnly>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<AlertTriangle className='w-5 h-5 text-yellow-500' />
							Advanced Settings
						</CardTitle>
					</CardHeader>
					<CardContent className='space-y-6'>
						<Alert>
							<AlertTriangle className='w-4 h-4' />
							<AlertDescription>
								These settings affect your entire organization. Changes should be made carefully.
							</AlertDescription>
						</Alert>

						<div className='space-y-4'>
							<div className='space-y-2'>
								<Label>Organization Limits</Label>
								<div className='text-sm text-gray-600 space-y-1'>
									<div>• Maximum communities: 10</div>
									<div>• Maximum members: 10</div>
									<div>• Storage limit: Not yet implemented</div>
								</div>
							</div>

							<Separator />

							<div className='space-y-2'>
								<Label>Data Export</Label>
								<div className='text-sm text-gray-600 mb-2'>
									Export all organization data for backup or migration purposes.
								</div>
								<Button variant='outline' disabled>
									Export Organization Data (Coming Soon)
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</AdminOnly>
		</div>
	);
}