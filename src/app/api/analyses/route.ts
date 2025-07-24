import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user's analyses from database
    const analyses = await prisma.chatAnalysis.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        fileName: true,
        totalMessages: true,
        totalMembers: true,
        createdAt: true,
        updatedAt: true,
        memberDirectories: {
          select: {
            id: true,
            password: true,
            expiresAt: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to include share link information
    const transformedAnalyses = analyses.map(analysis => ({
      ...analysis,
      shareLink: analysis.memberDirectories.length > 0 ? {
        id: analysis.memberDirectories[0].id,
        shareUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/directory/${analysis.memberDirectories[0].id}`,
        password: analysis.memberDirectories[0].password,
        expiresAt: analysis.memberDirectories[0].expiresAt,
      } : undefined,
      memberDirectories: undefined, // Remove from response
    }));

    return NextResponse.json({ analyses: transformedAnalyses });

  } catch (error) {
    console.error('Analyses fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analyses' },
      { status: 500 }
    );
  }
}