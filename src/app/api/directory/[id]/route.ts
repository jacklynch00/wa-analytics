import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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
        chatAnalysis: true,
      },
    });

    if (!sharedDirectory) {
      return NextResponse.json({ error: 'Shared directory not found' }, { status: 404 });
    }

    // Check if expired
    if (new Date() > sharedDirectory.expiresAt) {
      return NextResponse.json({ error: 'Shared directory has expired' }, { status: 410 });
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

    // Parse the analysis data
    const analysisData = JSON.parse(JSON.stringify(sharedDirectory.chatAnalysis.analysisData), (key, value) => {
      if (key === 'timestamp' || key === 'firstActive' || key === 'lastActive' || 
          key === 'dateShared' || key === 'start' || key === 'end') {
        return new Date(value);
      }
      return value;
    });

    // Return only the member directory data
    const directoryData = {
      members: analysisData.members || [],
      title: sharedDirectory.chatAnalysis.title,
      isPasswordProtected: !!sharedDirectory.password,
      password: sharedDirectory.password,
      expiresAt: sharedDirectory.expiresAt,
      totalMessages: sharedDirectory.chatAnalysis.totalMessages,
      totalMembers: sharedDirectory.chatAnalysis.totalMembers,
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