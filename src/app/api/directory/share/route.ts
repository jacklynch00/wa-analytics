import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { analysisId, password, expiresInDays = 30 } = await request.json();

    // Verify the analysis belongs to the user and check for existing share
    const analysis = await prisma.chatAnalysis.findFirst({
      where: {
        id: analysisId,
        userId,
      },
      include: {
        memberDirectories: true,
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // Check if a share link already exists
    if (analysis.memberDirectories.length > 0) {
      const existingShare = analysis.memberDirectories[0];
      return NextResponse.json({
        shareId: existingShare.id,
        shareUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/directory/${existingShare.id}`,
        expiresAt: existingShare.expiresAt,
        password: existingShare.password,
        isExisting: true,
      });
    }

    // Generate a unique share ID
    const shareId = randomBytes(16).toString('hex');
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create member directory share record
    const sharedDirectory = await prisma.memberDirectory.create({
      data: {
        id: shareId,
        chatAnalysis: {
          connect: {
            id: analysisId
          }
        },
        user: {
          connect: {
            id: userId
          }
        },
        password: password || null,
        expiresAt,
        isActive: true,
      },
    });

    return NextResponse.json({
      shareId: sharedDirectory.id,
      shareUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/directory/${shareId}`,
      expiresAt: sharedDirectory.expiresAt,
      password: sharedDirectory.password,
      isExisting: false,
    });

  } catch (error) {
    console.error('Directory sharing error:', error);
    return NextResponse.json(
      { error: 'Failed to create shareable directory' },
      { status: 500 }
    );
  }
}