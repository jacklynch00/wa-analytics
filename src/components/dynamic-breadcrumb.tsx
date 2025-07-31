'use client';

import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

interface Community {
	id: string;
	name: string;
}

interface Analysis {
	id: string;
	title: string;
}

export function DynamicBreadcrumb() {
	const pathname = usePathname();

	// Fetch communities for breadcrumb display
	const { data: communities = [], isLoading: communitiesLoading } = useQuery({
		queryKey: ['communities'],
		queryFn: async (): Promise<Community[]> => {
			const response = await fetch('/api/communities');
			if (!response.ok) throw new Error('Failed to fetch communities');
			const data = await response.json();
			return data.communities || [];
		},
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});

	// Extract analysis ID from pathname if present
	const analysisMatch = pathname.match(/\/dashboard\/community\/[^\/]+\/analysis\/([^\/]+)/);
	const analysisId = analysisMatch?.[1];

	// Fetch analysis data if viewing an analysis page
	const { data: analysis, isLoading: analysisLoading } = useQuery({
		queryKey: ['analysis', analysisId],
		queryFn: async (): Promise<Analysis> => {
			const response = await fetch(`/api/analysis/${analysisId}`);
			if (!response.ok) throw new Error('Failed to fetch analysis');
			const data = await response.json();
			return data.analysis;
		},
		enabled: !!analysisId,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});

	const generateBreadcrumbs = () => {
		const segments = pathname.split('/').filter(Boolean);
		const breadcrumbs = [];

		// Always start with Dashboard
		breadcrumbs.push({
			label: 'Dashboard',
			href: '/dashboard',
			isCurrentPage: pathname === '/dashboard',
		});

		// Handle different route patterns
		if (segments.includes('community')) {
			// Handle community routes first (before general analytics)
			const communityIdIndex = segments.indexOf('community') + 1;
			const communityId = segments[communityIdIndex];
			const community = communities.find((c) => c.id === communityId);
			const communityName = communitiesLoading ? 'Loading...' : community?.name || 'Community';

			breadcrumbs.push({
				label: communityName,
				href: `/dashboard/community/${communityId}`,
				isCurrentPage: pathname === `/dashboard/community/${communityId}`,
			});

			// Handle community sub-routes
			if (segments.includes('responses')) {
				breadcrumbs.push({
					label: 'Form Applications',
					href: `/dashboard/community/${communityId}/responses`,
					isCurrentPage: pathname === `/dashboard/community/${communityId}/responses`,
				});
			} else if (segments.includes('analytics')) {
				breadcrumbs.push({
					label: 'Chat Analytics',
					href: `/dashboard/community/${communityId}/analytics`,
					isCurrentPage: pathname === `/dashboard/community/${communityId}/analytics`,
				});
			} else if (segments.includes('form-builder')) {
				breadcrumbs.push({
					label: 'Form Builder',
					href: `/dashboard/community/${communityId}/form-builder`,
					isCurrentPage: pathname === `/dashboard/community/${communityId}/form-builder`,
				});
			} else if (segments.includes('directory')) {
				breadcrumbs.push({
					label: 'Member Directory',
					href: `/dashboard/community/${communityId}/directory`,
					isCurrentPage: pathname === `/dashboard/community/${communityId}/directory`,
				});
			} else if (segments.includes('bulk-import')) {
				breadcrumbs.push({
					label: 'Bulk Import',
					href: `/dashboard/community/${communityId}/bulk-import`,
					isCurrentPage: pathname === `/dashboard/community/${communityId}/bulk-import`,
				});
			} else if (segments.includes('analysis')) {
				const analysisIndex = segments.indexOf('analysis') + 1;
				const analysisId = segments[analysisIndex];
				if (analysisId) {
					// Add Chat Analytics breadcrumb first
					breadcrumbs.push({
						label: 'Chat Analytics',
						href: `/dashboard/community/${communityId}/analytics`,
						isCurrentPage: false,
					});
					
					// Add analysis title
					const analysisTitle = analysisLoading ? 'Loading...' : analysis?.title || 'Analysis';
					breadcrumbs.push({
						label: analysisTitle,
						href: `/dashboard/community/${communityId}/analysis/${analysisId}`,
						isCurrentPage: pathname === `/dashboard/community/${communityId}/analysis/${analysisId}`,
					});
				}
			}
		} else if (segments.includes('analytics')) {
			breadcrumbs.push({
				label: 'Analytics',
				href: '/analytics',
				isCurrentPage: pathname === '/analytics',
			});

			if (segments.includes('reports')) {
				breadcrumbs.push({
					label: 'Reports',
					href: '/analytics/reports',
					isCurrentPage: pathname === '/analytics/reports',
				});
			} else if (segments.includes('insights')) {
				breadcrumbs.push({
					label: 'Insights',
					href: '/analytics/insights',
					isCurrentPage: pathname === '/analytics/insights',
				});
			}
		} else if (segments.includes('settings')) {
			if (segments.includes('organization')) {
				breadcrumbs.push({
					label: 'Settings',
					href: '/settings/organization',
					isCurrentPage: false,
				});
				breadcrumbs.push({
					label: 'Organization',
					href: '/settings/organization',
					isCurrentPage: pathname === '/settings/organization',
				});
			} else if (segments.includes('team')) {
				breadcrumbs.push({
					label: 'Settings',
					href: '/settings/team',
					isCurrentPage: false,
				});
				breadcrumbs.push({
					label: 'Team',
					href: '/settings/team',
					isCurrentPage: pathname === '/settings/team',
				});
			}
		} else if (segments.includes('help')) {
			breadcrumbs.push({
				label: 'Help',
				href: '/help',
				isCurrentPage: pathname === '/help',
			});
		} else if (segments.includes('account')) {
			breadcrumbs.push({
				label: 'Account',
				href: '/account/settings',
				isCurrentPage: false,
			});

			if (segments.includes('settings')) {
				breadcrumbs.push({
					label: 'Settings',
					href: '/account/settings',
					isCurrentPage: pathname === '/account/settings',
				});
			} else if (segments.includes('organizations')) {
				breadcrumbs.push({
					label: 'Organizations',
					href: '/account/organizations',
					isCurrentPage: pathname === '/account/organizations',
				});
			}
		}

		return breadcrumbs;
	};

	const breadcrumbs = generateBreadcrumbs();

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{breadcrumbs.map((crumb, index) => (
					<div key={`${crumb.href}-${crumb.label}`} className='flex items-center'>
						<BreadcrumbItem>
							{crumb.isCurrentPage ? <BreadcrumbPage>{crumb.label}</BreadcrumbPage> : <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>}
						</BreadcrumbItem>
						{index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
					</div>
				))}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
