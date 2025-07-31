'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Users, ChevronRight, FileText, ClipboardList, Upload, BarChart3 } from 'lucide-react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
	SidebarGroup,
	SidebarGroupAction,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useCommunities, useCreateCommunity } from '@/hooks';

export function NavCommunities() {
	const pathname = usePathname();
	const router = useRouter();
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [newCommunity, setNewCommunity] = useState({ name: '', description: '' });

	const { data: communities = [], isLoading } = useCommunities();
	const createCommunityMutation = useCreateCommunity();

	const handleCreateCommunity = async () => {
		if (!newCommunity.name.trim()) {
			toast.error('Community name is required');
			return;
		}

		// Check if user has reached the limit
		if (communities.length >= 10) {
			toast.error('Maximum number of communities reached (10)');
			return;
		}

		try {
			const createdCommunity = await createCommunityMutation.mutateAsync({
				name: newCommunity.name,
				description: newCommunity.description || undefined,
			});

			setNewCommunity({ name: '', description: '' });
			setIsCreateModalOpen(false);
			toast.success('Community created successfully');
			
			// Redirect to the new community details page
			router.push(`/dashboard/community/${createdCommunity.id}`);
		} catch (error) {
			console.error('Error creating community:', error);
			if (error instanceof Error) {
				toast.error(`Error: ${error.message}`);
			} else {
				toast.error('Error creating community. Please try again.');
			}
		}
	};

	if (isLoading) {
		return (
			<SidebarGroup>
				<SidebarGroupLabel>Communities</SidebarGroupLabel>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton disabled>
							<Users className='size-4' />
							Loading...
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroup>
		);
	}

	return (
		<>
			<SidebarGroup>
				<SidebarGroupLabel>Communities</SidebarGroupLabel>
				<SidebarGroupAction onClick={() => setIsCreateModalOpen(true)} className='cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'>
					<Plus />
					<span className='sr-only'>Add Community</span>
				</SidebarGroupAction>
				<SidebarMenu>
					{communities.map((community) => {
						const isActive = pathname.includes(`/community/${community.id}`);
						const isMainCommunityPage = pathname === `/dashboard/community/${community.id}`;

						return (
							<Collapsible key={community.id} asChild defaultOpen={isActive}>
								<SidebarMenuItem>
									<SidebarMenuButton asChild isActive={isMainCommunityPage}>
										<Link href={`/dashboard/community/${community.id}`}>
											<Users className='size-4' />
											<span>{community.name}</span>
											<span className='ml-auto text-xs text-muted-foreground'>{community._count.chatAnalyses}</span>
										</Link>
									</SidebarMenuButton>
									<CollapsibleTrigger asChild>
										<SidebarMenuAction className='data-[state=open]:rotate-90'>
											<ChevronRight />
											<span className='sr-only'>Toggle</span>
										</SidebarMenuAction>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<SidebarMenuSub>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton
													asChild
													isActive={
														pathname === `/dashboard/community/${community.id}/analytics` ||
														pathname.includes(`/dashboard/community/${community.id}/analysis/`)
													}>
													<Link href={`/dashboard/community/${community.id}/analytics`}>
														<BarChart3 className='size-4' />
														<span>Chat Analytics</span>
													</Link>
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton asChild isActive={pathname === `/dashboard/community/${community.id}/form-builder`}>
													<Link href={`/dashboard/community/${community.id}/form-builder`}>
														<ClipboardList className='size-4' />
														<span>Form Builder</span>
													</Link>
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton asChild isActive={pathname === `/dashboard/community/${community.id}/responses`}>
													<Link href={`/dashboard/community/${community.id}/responses`}>
														<FileText className='size-4' />
														<span>Applications</span>
													</Link>
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton asChild isActive={pathname === `/dashboard/community/${community.id}/bulk-import`}>
													<Link href={`/dashboard/community/${community.id}/bulk-import`}>
														<Upload className='size-4' />
														<span>Bulk Import</span>
													</Link>
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
										</SidebarMenuSub>
									</CollapsibleContent>
								</SidebarMenuItem>
							</Collapsible>
						);
					})}
					{communities.length === 0 && (
						<SidebarMenuItem>
							<SidebarMenuButton disabled>
								<Users className='size-4' />
								No communities yet
							</SidebarMenuButton>
						</SidebarMenuItem>
					)}
				</SidebarMenu>
			</SidebarGroup>

			{/* Create Community Modal */}
			<Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
				<DialogContent className='sm:max-w-lg'>
					<DialogHeader>
						<DialogTitle>Create New Community</DialogTitle>
						<DialogDescription>Create a community to organize your WhatsApp chat analyses and share insights with others.</DialogDescription>
					</DialogHeader>
					<div className='space-y-4 py-4'>
						<div>
							<label className='text-sm font-medium text-gray-700 mb-2 block'>Community Name *</label>
							<Input
								value={newCommunity.name}
								onChange={(e) => setNewCommunity((prev) => ({ ...prev, name: e.target.value }))}
								placeholder='Enter community name'
								disabled={createCommunityMutation.isPending}
							/>
						</div>
						<div>
							<label className='text-sm font-medium text-gray-700 mb-2 block'>Description (optional)</label>
							<Textarea
								value={newCommunity.description}
								onChange={(e) => setNewCommunity((prev) => ({ ...prev, description: e.target.value }))}
								placeholder='Describe your community'
								rows={3}
								disabled={createCommunityMutation.isPending}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => {
								setIsCreateModalOpen(false);
								setNewCommunity({ name: '', description: '' });
							}}
							disabled={createCommunityMutation.isPending}>
							Cancel
						</Button>
						<Button onClick={handleCreateCommunity} disabled={createCommunityMutation.isPending}>
							{createCommunityMutation.isPending ? 'Creating...' : 'Create Community'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
