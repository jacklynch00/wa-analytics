import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { OrganizationService } from '@/lib/services/organization'

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const organization = await OrganizationService.getUserOrganization(session.user.id)
    if (!organization) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }
    
    // Check if user is admin
    const isAdmin = await OrganizationService.isAdmin(session.user.id, organization.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 })
    }
    
    // Get pending invitations from database
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    const invitations = await prisma.invitation.findMany({
      where: { 
        organizationId: organization.id,
        status: 'pending',
        expiresAt: { gt: new Date() } // Only non-expired invitations
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ invitations })
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { invitationId, action } = await request.json()
    
    if (!invitationId || !action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid invitation action' }, { status: 400 })
    }
    
    if (action === 'accept') {
      await auth.api.acceptInvitation({
        headers: request.headers,
        body: { invitationId }
      })
    } else {
      await auth.api.rejectInvitation({
        headers: request.headers,
        body: { invitationId }
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error handling invitation:', error)
    return NextResponse.json({ error: 'Failed to handle invitation' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { invitationId } = await request.json()
    
    if (!invitationId) {
      return NextResponse.json({ error: 'Invitation ID is required' }, { status: 400 })
    }
    
    const organization = await OrganizationService.getUserOrganization(session.user.id)
    if (!organization) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }
    
    // Check if user is admin
    const isAdmin = await OrganizationService.isAdmin(session.user.id, organization.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 })
    }
    
    // Cancel invitation using Better Auth
    await auth.api.cancelInvitation({
      headers: request.headers,
      body: { invitationId }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error canceling invitation:', error)
    return NextResponse.json({ error: 'Failed to cancel invitation' }, { status: 500 })
  }
}