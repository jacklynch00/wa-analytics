import { NextRequest, NextResponse } from 'next/server';
import { applicationFormService } from '@/lib/application-forms';
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

    const form = await applicationFormService.getFormByCommunityId(communityId);
    
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    return NextResponse.json({ form });
  } catch (error) {
    console.error('Error fetching form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
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

    const formData = await request.json();

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

    // Validate form data
    if (!formData.title || !formData.customSlug) {
      return NextResponse.json({ error: 'Title and custom slug are required' }, { status: 400 });
    }

    if (!formData.questions || !Array.isArray(formData.questions) || formData.questions.length === 0) {
      return NextResponse.json({ error: 'At least one question is required' }, { status: 400 });
    }

    if (formData.questions.length > 12) {
      return NextResponse.json({ error: 'Maximum 12 questions allowed' }, { status: 400 });
    }

    // Validate slug
    const isSlugValid = await applicationFormService.validateSlug(
      formData.customSlug, 
      formData.id || undefined
    );

    if (!isSlugValid) {
      return NextResponse.json({ error: 'Custom slug is not available' }, { status: 400 });
    }

    // Check if form already exists
    const existingForm = await applicationFormService.getFormByCommunityId(communityId);

    let form;
    if (existingForm) {
      // Update existing form
      form = await applicationFormService.updateForm(existingForm.id, {
        title: formData.title,
        description: formData.description,
        isActive: formData.isActive,
        isPublic: formData.isPublic,
        password: formData.password,
        customSlug: formData.customSlug,
        whatsappInviteUrl: formData.whatsappInviteUrl,
        acceptanceMessage: formData.acceptanceMessage,
        denialMessage: formData.denialMessage,
        questions: formData.questions,
      });
    } else {
      // Create new form
      form = await applicationFormService.createForm({
        communityId,
        title: formData.title,
        description: formData.description,
        isActive: formData.isActive,
        isPublic: formData.isPublic,
        password: formData.password,
        customSlug: formData.customSlug,
        whatsappInviteUrl: formData.whatsappInviteUrl,
        acceptanceMessage: formData.acceptanceMessage,
        denialMessage: formData.denialMessage,
        questions: formData.questions,
      });
    }

    return NextResponse.json({ form });
  } catch (error) {
    console.error('Error saving form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    const form = await applicationFormService.getFormByCommunityId(communityId);
    
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    await applicationFormService.deleteForm(form.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}