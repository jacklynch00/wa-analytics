import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const analysisId = params.id;
    const { title } = await request.json();

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

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

    // Update the title
    await prisma.chatAnalysis.update({
      where: { id: analysisId },
      data: { title: title.trim() },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Title update error:', error);
    return NextResponse.json(
      { error: 'Failed to update title' },
      { status: 500 }
    );
  }
}