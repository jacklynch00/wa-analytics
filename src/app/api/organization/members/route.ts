import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { OrganizationService } from '@/lib/services/organization';

export async function GET(request: NextRequest) {
	try {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const organization = await OrganizationService.getUserOrganization(session.user.id);
		if (!organization) {
			return NextResponse.json({ error: 'No organization found' }, { status: 404 });
		}

		const members = await OrganizationService.getMembers(organization.id);

		return NextResponse.json({ members });
	} catch (error) {
		console.error('Error fetching members:', error);
		return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { email, role = 'member' } = await request.json();

		if (!email || !email.includes('@')) {
			return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
		}

		const organization = await OrganizationService.getUserOrganization(session.user.id);
		if (!organization) {
			return NextResponse.json({ error: 'No organization found' }, { status: 404 });
		}

		// Check if user is admin
		const isAdmin = await OrganizationService.isAdmin(session.user.id, organization.id);
		if (!isAdmin) {
			return NextResponse.json({ error: 'Admin required' }, { status: 403 });
		}

		// Check member limit
		const currentMemberCount = await OrganizationService.getMembers(organization.id);
		if (currentMemberCount.length >= 10) {
			return NextResponse.json({ error: 'Member limit reached (10 members maximum)' }, { status: 400 });
		}

		// Create invitation directly in database
		const { PrismaClient } = await import('@prisma/client');
		const prisma = new PrismaClient();

		// Check if user already exists and is already a member
		const existingUser = await prisma.user.findUnique({
			where: { email: email.trim() },
		});

		if (existingUser) {
			const existingMember = await prisma.member.findFirst({
				where: {
					userId: existingUser.id,
					organizationId: organization.id,
				},
			});

			if (existingMember) {
				return NextResponse.json({ error: 'User is already a member of this organization' }, { status: 400 });
			}
		}

		// Check for existing invitation
		const existingInvitation = await prisma.invitation.findFirst({
			where: {
				email: email.trim(),
				organizationId: organization.id,
				status: 'pending',
			},
		});

		if (existingInvitation) {
			return NextResponse.json({ error: 'Invitation already sent to this email' }, { status: 400 });
		}

		// Create invitation
		const invitation = await prisma.invitation.create({
			data: {
				email: email.trim(),
				role,
				status: 'pending',
				organizationId: organization.id,
				inviterId: session.user.id,
				expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
			},
		});

		// Send invitation email
		try {
			const { sendOrganizationInvitation } = await import('@/lib/email/organization-invites');

			await sendOrganizationInvitation({
				email: email.trim(),
				invitedByUsername: session.user.name || 'Team Member',
				invitedByEmail: session.user.email,
				teamName: organization.name,
				inviteLink: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/accept-invitation/${invitation.id}`,
				role,
			});
		} catch (emailError) {
			console.error('Failed to send invitation email:', emailError);
			// Don't fail the whole operation if email fails
		}

		return NextResponse.json({ invitation });
	} catch (error) {
		console.error('Error inviting member:', error);

		if (error instanceof Error) {
			if (error.message.includes('already exists') || error.message.includes('already a member')) {
				return NextResponse.json({ error: 'User is already a member of this organization' }, { status: 400 });
			}
		}

		return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { memberId } = await request.json();

		if (!memberId) {
			return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
		}

		const organization = await OrganizationService.getUserOrganization(session.user.id);
		if (!organization) {
			return NextResponse.json({ error: 'No organization found' }, { status: 404 });
		}

		// Check if user is admin
		const isAdmin = await OrganizationService.isAdmin(session.user.id, organization.id);
		if (!isAdmin) {
			return NextResponse.json({ error: 'Admin required' }, { status: 403 });
		}

		// Remove member using Better Auth
		await auth.api.removeMember({
			headers: request.headers,
			body: {
				memberIdOrEmail: memberId,
				organizationId: organization.id,
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error removing member:', error);
		return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
	}
}
