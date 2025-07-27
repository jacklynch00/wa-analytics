import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

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

    // Get all analyses from the community
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

    // Return community directory data
    const directoryData = {
      communityName: sharedDirectory.community.name,
      communityDescription: sharedDirectory.community.description,
      analyses: analyses,
      isPasswordProtected: !!sharedDirectory.password,
      password: sharedDirectory.password,
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

    const { password } = await request.json();

    // Find the shared directory and verify ownership
    const sharedDirectory = await prisma.memberDirectory.findFirst({
      where: { 
        id: shareId,
        community: {
          userId: session.user.id
        }
      },
    });

    if (!sharedDirectory) {
      return NextResponse.json({ error: 'Directory not found or access denied' }, { status: 404 });
    }

    // Update the directory password
    const updatedDirectory = await prisma.memberDirectory.update({
      where: { id: shareId },
      data: {
        password: password?.trim() || null,
      },
    });

    return NextResponse.json({ 
      success: true,
      password: updatedDirectory.password,
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

    // Find the shared directory and verify ownership
    const sharedDirectory = await prisma.memberDirectory.findFirst({
      where: { 
        id: shareId,
        community: {
          userId: session.user.id
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