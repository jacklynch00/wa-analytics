'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { BarChart3, HelpCircle, LayoutDashboard, MessageCircle, Settings, Send, Upload } from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavCommunities } from '@/components/nav-communities';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useOrganization } from '@/hooks/useOrganization';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const pathname = usePathname();
	const { data: organization } = useOrganization();

	// Check if we're in a specific community context
	const communityMatch = pathname.match(/\/dashboard\/community\/([^\/]+)/);
	const currentCommunityId = communityMatch?.[1];

	// Check if we're viewing a specific analysis
	const analysisMatch = pathname.match(/\/dashboard\/community\/([^\/]+)\/analysis\/([^\/]+)/);
	const currentAnalysisId = analysisMatch?.[2];

	const navMain = [
		{
			title: 'Dashboard',
			url: '/dashboard',
			icon: LayoutDashboard,
			isActive: pathname === '/dashboard',
		},
		{
			title: 'Analytics',
			url: '/analytics',
			icon: BarChart3,
			isActive: pathname.startsWith('/analytics'),
			items: [
				{
					title: 'Overview',
					url: '/analytics',
				},
				{
					title: 'Reports',
					url: '/analytics/reports',
				},
				{
					title: 'Insights',
					url: '/analytics/insights',
				},
			],
		},
	];

	// Community-specific navigation when viewing a specific community
	const communityNavItems = currentCommunityId
		? [
				{
					title: 'Community Details',
					url: `/dashboard/community/${currentCommunityId}`,
					icon: MessageCircle,
					isActive:
						pathname === `/dashboard/community/${currentCommunityId}` ||
						pathname.includes(`/dashboard/community/${currentCommunityId}/responses`) ||
						pathname.includes(`/dashboard/community/${currentCommunityId}/analytics`) ||
						pathname.includes(`/dashboard/community/${currentCommunityId}/form-builder`) ||
						pathname.includes(`/dashboard/community/${currentCommunityId}/analysis`),
					items: [
						{
							title: 'Form Applications',
							url: `/dashboard/community/${currentCommunityId}/responses`,
						},
						{
							title: 'Chat Analytics',
							url: `/dashboard/community/${currentCommunityId}/analytics`,
						},
						{
							title: 'Form Builder',
							url: `/dashboard/community/${currentCommunityId}/form-builder`,
						},
						// Add Analysis Results when viewing a specific analysis
						...(currentAnalysisId
							? [
									{
										title: 'Analysis Results',
										url: `/dashboard/community/${currentCommunityId}/analysis/${currentAnalysisId}`,
									},
								]
							: []),
					],
				},
				{
					title: 'Bulk Import',
					url: `/dashboard/community/${currentCommunityId}/bulk-import`,
					icon: Upload,
					isActive: pathname.includes('/bulk-import'),
				},
			]
		: [];

	const navSecondary = [
		{
			title: 'Settings',
			url: '/settings/organization',
			newTab: false,
			icon: Settings,
			isActive: pathname.startsWith('/settings'),
			items: [
				{
					title: 'Organization',
					url: '/settings/organization',
				},
				{
					title: 'Team',
					url: '/settings/team',
				},
			],
		},
		{
			title: 'Help',
			url: '/help',
			newTab: false,
			icon: HelpCircle,
		},
		{
			title: 'Feedback',
			url: 'https://waly.canny.io/',
			newTab: true,
			icon: Send,
		},
	];

	return (
		<Sidebar variant='inset' {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size='lg' asChild>
							<a href='/dashboard'>
								<div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white'>
									<MessageCircle className='size-4' />
								</div>
								<div className='grid flex-1 text-left text-sm leading-tight'>
									<span className='truncate font-semibold'>{organization?.name || 'Waly Analytics'}</span>
									<span className='truncate text-xs'>WhatsApp Analytics</span>
								</div>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={navMain} />
				<NavCommunities />
				{communityNavItems.length > 0 && <NavMain items={communityNavItems} title='Community Tools' />}
				<NavSecondary items={navSecondary} className='mt-auto' />
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
		</Sidebar>
	);
}
