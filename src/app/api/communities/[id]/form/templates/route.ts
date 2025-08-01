import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { OrganizationService } from '@/lib/services/organization';

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id: communityId } = await params;
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check if user can access the community
		const organization = await OrganizationService.getUserOrganization(session.user.id);
		if (!organization) {
			return NextResponse.json({ error: 'No organization found' }, { status: 404 });
		}

		// Get all communities in the user's organization
		const communities = await prisma.community.findMany({
			where: {
				organizationId: organization.id,
				id: { not: communityId }, // Exclude current community
			},
			include: {
				applicationForm: {
					select: {
						id: true,
						title: true,
						description: true,
						questions: true,
						customSlug: true,
						createdAt: true,
					},
				},
			},
			orderBy: { name: 'asc' },
		});

		// Filter communities that have forms and transform the data
		const availableTemplates = communities
			.filter((community) => community.applicationForm)
			.map((community) => ({
				communityId: community.id,
				communityName: community.name,
				form: {
					id: community.applicationForm!.id,
					title: community.applicationForm!.title,
					description: community.applicationForm!.description,
					questions: community.applicationForm!.questions,
					customSlug: community.applicationForm!.customSlug,
					createdAt: community.applicationForm!.createdAt,
				},
			}));

		return NextResponse.json({ templates: availableTemplates });
	} catch (error) {
		console.error('Error fetching form templates:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
