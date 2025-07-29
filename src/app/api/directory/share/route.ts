import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { OrganizationService } from '@/lib/services/organization';
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
    const { communityId, password } = await request.json();

    // Verify the community belongs to user's organization and check for existing share
    const organization = await OrganizationService.getUserOrganization(userId);
    if (!organization) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const community = await prisma.community.findFirst({
      where: {
        id: communityId,
        organizationId: organization.id,
      },
      include: {
        memberDirectories: {
          where: { isActive: true },
        },
      },
    });

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    // Check if a share link already exists
    if (community.memberDirectories.length > 0) {
      const existingShare = community.memberDirectories[0];
      return NextResponse.json({
        shareId: existingShare.id,
        shareUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/directory/${existingShare.id}`,
        password: existingShare.password,
        visibleFields: existingShare.visibleFields,
        isExisting: true,
      });
    }

    // Generate a unique share ID
    const shareId = randomBytes(16).toString('hex');

    // Create member directory share record for the community
    const sharedDirectory = await prisma.memberDirectory.create({
      data: {
        id: shareId,
        community: {
          connect: {
            id: communityId
          }
        },
        user: {
          connect: {
            id: userId
          }
        },
        password: password || null,
        isActive: true,
      },
    });

    return NextResponse.json({
      shareId: sharedDirectory.id,
      shareUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/directory/${shareId}`,
      password: sharedDirectory.password,
      visibleFields: sharedDirectory.visibleFields,
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