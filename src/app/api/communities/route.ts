import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const communities = await prisma.community.findMany({
      where: { userId: session.user.id },
      include: {
        chatAnalyses: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            totalMessages: true,
            totalMembers: true,
            createdAt: true,
          },
        },
        memberDirectories: {
          where: { isActive: true },
          select: {
            id: true,
            password: true,
            createdAt: true,
          },
        },
        applicationForm: {
          select: {
            id: true,
            title: true,
            customSlug: true,
            isActive: true,
            isPublic: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            chatAnalyses: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ communities });
  } catch (error) {
    console.error('Error fetching communities:', error);
    return NextResponse.json({ error: 'Failed to fetch communities' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Community name is required' }, { status: 400 });
    }

    // Check if user has reached the limit (optional - adjust as needed)
    const existingCommunitiesCount = await prisma.community.count({
      where: { userId: session.user.id },
    });

    if (existingCommunitiesCount >= 10) {
      return NextResponse.json({ error: 'Maximum number of communities reached' }, { status: 400 });
    }

    const community = await prisma.community.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId: session.user.id,
      },
      include: {
        chatAnalyses: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            totalMessages: true,
            totalMembers: true,
            createdAt: true,
          },
        },
        memberDirectories: {
          where: { isActive: true },
        },
        applicationForm: {
          select: {
            id: true,
            title: true,
            customSlug: true,
            isActive: true,
            isPublic: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            chatAnalyses: true,
          },
        },
      },
    });

    return NextResponse.json({ community });
  } catch (error) {
    console.error('Error creating community:', error);
    return NextResponse.json({ error: 'Failed to create community' }, { status: 500 });
  }
}