import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
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

    const userId = session.user.id;
    const { id: analysisId } = await params;

    // Fetch analysis from database
    const chatAnalysis = await prisma.chatAnalysis.findFirst({
      where: {
        id: analysisId,
        userId, // Ensure user can only access their own analyses
      },
      include: {
        community: true,
      },
    });

    if (!chatAnalysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // Parse the stored analysis data
    const analysisData = JSON.parse(JSON.stringify(chatAnalysis.analysisData), (key, value) => {
      if (key === 'timestamp' || key === 'firstActive' || key === 'lastActive' || 
          key === 'dateShared' || key === 'start' || key === 'end') {
        return new Date(value);
      }
      return value;
    });

    // Parse date range
    const dateRange = JSON.parse(JSON.stringify(chatAnalysis.dateRange), (key, value) => {
      if (key === 'start' || key === 'end') {
        return new Date(value);
      }
      return value;
    });

    // Construct the full analysis object
    const analysis = {
      id: chatAnalysis.id,
      title: chatAnalysis.title,
      communityId: chatAnalysis.communityId,
      ...analysisData,
      dateRange,
      totalMessages: chatAnalysis.totalMessages,
      activeMembersLast7Days: analysisData.members?.filter((member: { lastActive?: string }) => {
        const daysSinceLastActive = member.lastActive 
          ? Math.floor((new Date().getTime() - new Date(member.lastActive).getTime()) / (1000 * 60 * 60 * 24))
          : Infinity;
        return daysSinceLastActive <= 7;
      }).length || 0,
      averageMessagesPerDay: analysisData.dailyStats?.length > 0 
        ? analysisData.dailyStats.reduce((sum: number, day: { messageCount: number }) => sum + day.messageCount, 0) / analysisData.dailyStats.length
        : 0,
    };

    return NextResponse.json({ analysis });

  } catch (error) {
    console.error('Analysis fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const userId = session.user.id;
    const { id: analysisId } = await params;

    // Delete analysis from database
    const deletedAnalysis = await prisma.chatAnalysis.deleteMany({
      where: {
        id: analysisId,
        userId, // Ensure user can only delete their own analyses
      },
    });

    if (deletedAnalysis.count === 0) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Analysis deleted successfully' });

  } catch (error) {
    console.error('Analysis deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete analysis' },
      { status: 500 }
    );
  }
}