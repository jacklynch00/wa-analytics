import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { CommunityService } from '@/lib/services/community';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const communities = await CommunityService.getUserCommunities(session.user.id);
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

    const community = await CommunityService.createCommunity(session.user.id, {
      name,
      description
    });

    return NextResponse.json({ community });
  } catch (error) {
    console.error('Error creating community:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Only admins')) {
        return NextResponse.json({ error: 'Only admins can create communities' }, { status: 403 });
      }
      if (error.message.includes('Maximum number')) {
        return NextResponse.json({ error: 'Maximum number of communities reached' }, { status: 400 });
      }
      if (error.message.includes('No organization')) {
        return NextResponse.json({ error: 'No organization found' }, { status: 404 });
      }
    }
    
    return NextResponse.json({ error: 'Failed to create community' }, { status: 500 });
  }
}