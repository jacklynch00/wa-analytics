import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { OrganizationService } from '@/lib/services/organization';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: memberId } = await params;
    const { role } = await request.json();

    // Validate role
    if (!['admin', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if user is authenticated
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const organization = await OrganizationService.getUserOrganization(session.user.id);
    if (!organization) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Check if current user is admin
    const isAdmin = await OrganizationService.isAdmin(session.user.id, organization.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Get the member to be updated
    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        organizationId: organization.id
      },
      include: {
        user: true
      }
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Prevent changing own role
    if (member.userId === session.user.id) {
      return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 });
    }

    // Update member role
    await prisma.member.update({
      where: { id: memberId },
      data: { role }
    });

    return NextResponse.json({ 
      success: true,
      message: `Role updated to ${role}` 
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}