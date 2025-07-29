import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { OrganizationService } from '@/lib/services/organization';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: analysisId } = await params;
    const { title } = await request.json();

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Get user's organization to ensure they can only access analyses from their org
    const organization = await OrganizationService.getUserOrganization(session.user.id);
    if (!organization) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Verify the analysis belongs to the user's organization
    const analysis = await prisma.chatAnalysis.findFirst({
      where: {
        id: analysisId,
        community: {
          organizationId: organization.id
        }
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // Update the title
    await prisma.chatAnalysis.update({
      where: { id: analysisId },
      data: { title: title.trim() },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Title update error:', error);
    return NextResponse.json(
      { error: 'Failed to update title' },
      { status: 500 }
    );
  }
}