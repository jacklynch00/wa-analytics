import { NextRequest, NextResponse } from 'next/server';
import { memberApplicationService, applicationFormService } from '@/lib/application-forms';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user owns the community
    const community = await prisma.community.findFirst({
      where: { 
        id: communityId,
        userId: session.user.id,
      },
    });

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    // Get the form for this community
    const form = await applicationFormService.getFormByCommunityId(communityId);
    
    if (!form) {
      return NextResponse.json({ applications: [] });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    const filters: { search?: string; status?: 'PENDING' | 'ACCEPTED' | 'DENIED' } = {};
    if (search) {
      filters.search = search;
    }
    if (status && status !== 'all' && ['PENDING', 'ACCEPTED', 'DENIED'].includes(status)) {
      filters.status = status as 'PENDING' | 'ACCEPTED' | 'DENIED';
    }

    // Get applications for this form
    const applications = await memberApplicationService.getApplicationsByFormId(form.id, filters);

    return NextResponse.json({ applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}