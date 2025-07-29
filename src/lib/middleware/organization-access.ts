import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { OrganizationService } from '@/lib/services/organization'
import type { Organization, Community, User, Member } from '@prisma/client'

interface Session {
  user: Pick<User, 'id' | 'email' | 'name'>;
}

type OrganizationWithMembers = Organization & {
  members: (Member & { user: User })[];
};

export async function withOrganizationAccess(
  request: NextRequest,
  handler: (session: Session, organization: OrganizationWithMembers) => Promise<Response>
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const organization = await OrganizationService.getUserOrganization(session.user.id)
  if (!organization) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 })
  }
  
  return handler(session, organization)
}

export async function withCommunityAccess(
  request: NextRequest,
  communityId: string,
  handler: (session: Session, organization: OrganizationWithMembers, community: Community) => Promise<Response>
) {
  return withOrganizationAccess(request, async (session, organization) => {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    const community = await prisma.community.findFirst({
      where: {
        id: communityId,
        organizationId: organization.id
      }
    })
    
    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }
    
    return handler(session, organization, community)
  })
}