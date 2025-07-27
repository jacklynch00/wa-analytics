import { NextRequest, NextResponse } from 'next/server';
import { applicationFormService } from '@/lib/application-forms';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the form by slug
    const form = await applicationFormService.getFormBySlug(slug);
    
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Check if the user owns the community that owns this form
    const community = await prisma.community.findFirst({
      where: { 
        id: form.communityId,
        userId: session.user.id,
      },
    });

    if (!community) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ form });
  } catch (error) {
    console.error('Error fetching form preview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}