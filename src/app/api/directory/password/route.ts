import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { directoryId, password } = await request.json();

    if (!directoryId) {
      return NextResponse.json({ error: 'Directory ID is required' }, { status: 400 });
    }

    // Find the directory and verify ownership
    const directory = await prisma.memberDirectory.findFirst({
      where: {
        id: directoryId,
        community: {
          createdBy: session.user.id,
        },
      },
    });

    if (!directory) {
      return NextResponse.json({ error: 'Directory not found or access denied' }, { status: 404 });
    }

    // Update the password (null to remove, string to add/update)
    await prisma.memberDirectory.update({
      where: { id: directoryId },
      data: {
        password: password,
      },
    });

    return NextResponse.json({ 
      success: true,
      message: password ? 'Password updated successfully' : 'Password removed successfully'
    });

  } catch (error) {
    console.error('Directory password update error:', error);
    return NextResponse.json(
      { error: 'Failed to update directory password' },
      { status: 500 }
    );
  }
}