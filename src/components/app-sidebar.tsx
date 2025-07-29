'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { HelpCircle, LayoutDashboard, MessageCircle, Settings, Send } from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavCommunities } from '@/components/nav-communities';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useOrganization } from '@/hooks/useOrganization';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const pathname = usePathname();
	const { data: organization } = useOrganization();

	const navMain = [
		{
			title: 'Dashboard',
			url: '/dashboard',
			icon: LayoutDashboard,
			isActive: pathname === '/dashboard',
		},
	];

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
				<NavSecondary items={navSecondary} className='mt-auto' />
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
		</Sidebar>
	);
}
