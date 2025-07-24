import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
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
    const { timeRange } = await request.json();

    if (!timeRange || typeof timeRange !== 'number') {
      return NextResponse.json({ error: 'Invalid timeRange parameter' }, { status: 400 });
    }

    const timeRangeDays = timeRange;

    // Verify the analysis belongs to the user
    const analysis = await prisma.chatAnalysis.findFirst({
      where: {
        id: analysisId,
        userId,
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // Parse the stored analysis data to get messages
    const analysisData = JSON.parse(JSON.stringify(analysis.analysisData), (key, value) => {
      if (key === 'timestamp' || key === 'firstActive' || key === 'lastActive' || 
          key === 'dateShared' || key === 'start' || key === 'end') {
        return new Date(value);
      }
      return value;
    });

    const messages = analysisData.messages || [];

    if (messages.length === 0) {
      return NextResponse.json({ error: 'No messages found for analysis' }, { status: 400 });
    }

    // Generate AI recap
    try {
      const response = await fetch(`${process.env.BETTER_AUTH_URL}/api/ai/recap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          timeRangeDays,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API responded with status: ${response.status}`);
      }

      const newRecap = await response.json();

      // Update the analysis data with new recap
      const updatedAnalysisData = {
        ...analysisData,
        aiRecaps: {
          ...analysisData.aiRecaps,
          [timeRangeDays.toString()]: newRecap,
        },
      };

      // Save updated analysis data back to database
      await prisma.chatAnalysis.update({
        where: { id: analysisId },
        data: {
          analysisData: JSON.parse(
            JSON.stringify(updatedAnalysisData, (key, value) => {
              if (key === 'timestamp' || key === 'firstActive' || key === 'lastActive' || 
                  key === 'dateShared' || key === 'start' || key === 'end') {
                return value instanceof Date ? value.toISOString() : value;
              }
              return value;
            })
          ),
        },
      });

      return NextResponse.json({
        success: true,
        aiRecaps: updatedAnalysisData.aiRecaps,
      });

    } catch (error) {
      console.error('Failed to generate AI recap:', error);
      return NextResponse.json(
        { error: 'Failed to generate AI recap' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Regenerate recap error:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate recap' },
      { status: 500 }
    );
  }
}