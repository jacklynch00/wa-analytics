import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Params {
  id: string;
}

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const community = await prisma.community.findFirst({
      where: { 
        id,
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
          select: {
            id: true,
            password: true,
            expiresAt: true,
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

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    return NextResponse.json({ community });
  } catch (error) {
    console.error('Error fetching community:', error);
    return NextResponse.json({ error: 'Failed to fetch community' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
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

    const community = await prisma.community.updateMany({
      where: { 
        id,
        userId: session.user.id,
      },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    if (community.count === 0) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    // Fetch updated community
    const updatedCommunity = await prisma.community.findFirst({
      where: { id, userId: session.user.id },
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
        _count: {
          select: {
            chatAnalyses: true,
          },
        },
      },
    });

    return NextResponse.json({ community: updatedCommunity });
  } catch (error) {
    console.error('Error updating community:', error);
    return NextResponse.json({ error: 'Failed to update community' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const community = await prisma.community.deleteMany({
      where: { 
        id,
        userId: session.user.id,
      },
    });

    if (community.count === 0) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting community:', error);
    return NextResponse.json({ error: 'Failed to delete community' }, { status: 500 });
  }
}