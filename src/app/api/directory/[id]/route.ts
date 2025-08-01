import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { OrganizationService } from '@/lib/services/organization';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shareId } = await params;
    const { password } = await request.json();

    // Find the shared directory
    const sharedDirectory = await prisma.memberDirectory.findUnique({
      where: { id: shareId },
      include: {
        community: {
          include: {
            chatAnalyses: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        chatAnalysis: true,
      },
    });

    if (!sharedDirectory) {
      return NextResponse.json({ error: 'Shared directory not found' }, { status: 404 });
    }


    // Check if active
    if (!sharedDirectory.isActive) {
      return NextResponse.json({ error: 'Shared directory is no longer available' }, { status: 404 });
    }

    // Check password if required
    if (sharedDirectory.password) {
      if (!password || password !== sharedDirectory.password) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }
    }

    // Get all accepted applications from the community
    const applications = await prisma.memberApplication.findMany({
      where: {
        form: {
          communityId: sharedDirectory.communityId,
        },
        status: 'ACCEPTED',
      },
      include: {
        form: {
          include: {
            community: true,
          },
        },
      },
      orderBy: {
        invitedAt: 'desc',
      },
    });

    // Transform application data for display
    const members = applications.map((application) => {
      const responses = application.responses as Record<string, unknown>;
      const form = application.form;
      const questions = form.questions as Array<{ id: string; label: string; type: string }>;
      
      // Extract member information from responses
      const memberData: Record<string, unknown> = {
        id: application.id,
        email: application.email,
        joinedAt: application.invitedAt,
        appliedAt: application.createdAt,
      };

      // Add responses based on form questions
      questions.forEach((question) => {
        if (responses[question.id]) {
          memberData[question.id] = responses[question.id];
          // Also create a readable field name
          memberData[question.label.toLowerCase().replace(/\s+/g, '_')] = responses[question.id];
        }
      });

      return memberData;
    });

    // Get all analyses from the community for AI recap and resources
    const analyses = sharedDirectory.community.chatAnalyses.map((analysis) => {
      const analysisData = JSON.parse(JSON.stringify(analysis.analysisData), (key, value) => {
        if (key === 'timestamp' || key === 'firstActive' || key === 'lastActive' || 
            key === 'dateShared' || key === 'start' || key === 'end') {
          return new Date(value);
        }
        return value;
      });

      return {
        id: analysis.id,
        title: analysis.title,
        totalMessages: analysis.totalMessages,
        totalMembers: analysis.totalMembers,
        createdAt: analysis.createdAt,
        members: analysisData.members || [],
        resources: analysisData.resources || [],
        aiRecaps: analysisData.aiRecaps || {},
      };
    });

    // Get field visibility settings
    const visibleFields = sharedDirectory.visibleFields as Record<string, boolean> || {
      name: true,
      email: true,
      linkedin: false,
      phone: false,
    };

    // Return community directory data
    const directoryData = {
      communityName: sharedDirectory.community.name,
      communityDescription: sharedDirectory.community.description,
      communityImageUrl: sharedDirectory.community.imageUrl,
      members: members,
      totalMembers: members.length,
      analyses: analyses,
      isPasswordProtected: !!sharedDirectory.password,
      password: sharedDirectory.password,
      formQuestions: applications.length > 0 ? (applications[0].form.questions as Array<{ id: string; label: string; type: string }>) : [],
      visibleFields: visibleFields,
    };

    return NextResponse.json(directoryData);

  } catch (error) {
    console.error('Shared directory access error:', error);
    return NextResponse.json(
      { error: 'Failed to access shared directory' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shareId } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { password, visibleFields } = await request.json();

    // Get user's organization to ensure they can only access directories from their org
    const organization = await OrganizationService.getUserOrganization(session.user.id);
    if (!organization) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Check if user is admin
    const isAdmin = await OrganizationService.isAdmin(session.user.id, organization.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Find the shared directory and verify it belongs to user's organization
    const sharedDirectory = await prisma.memberDirectory.findFirst({
      where: { 
        id: shareId,
        community: {
          organizationId: organization.id
        }
      },
    });

    if (!sharedDirectory) {
      return NextResponse.json({ error: 'Directory not found or access denied' }, { status: 404 });
    }

    // Prepare update data
    const updateData: {
      password?: string | null;
      visibleFields?: Record<string, boolean>;
    } = {};
    if (password !== undefined) {
      updateData.password = password?.trim() || null;
    }
    if (visibleFields !== undefined) {
      updateData.visibleFields = visibleFields;
    }

    // Update the directory
    const updatedDirectory = await prisma.memberDirectory.update({
      where: { id: shareId },
      data: updateData,
    });

    return NextResponse.json({ 
      success: true,
      password: updatedDirectory.password,
      visibleFields: updatedDirectory.visibleFields,
    });

  } catch (error) {
    console.error('Directory update error:', error);
    return NextResponse.json(
      { error: 'Failed to update directory' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shareId } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization to ensure they can only access directories from their org
    const organization = await OrganizationService.getUserOrganization(session.user.id);
    if (!organization) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Check if user is admin
    const isAdmin = await OrganizationService.isAdmin(session.user.id, organization.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Find the shared directory and verify it belongs to user's organization
    const sharedDirectory = await prisma.memberDirectory.findFirst({
      where: { 
        id: shareId,
        community: {
          organizationId: organization.id
        }
      },
    });

    if (!sharedDirectory) {
      return NextResponse.json({ error: 'Directory not found or access denied' }, { status: 404 });
    }

    // Delete the directory
    await prisma.memberDirectory.delete({
      where: { id: shareId },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Directory deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete directory' },
      { status: 500 }
    );
  }
}