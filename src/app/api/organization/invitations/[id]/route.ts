import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { OrganizationService } from '@/lib/services/organization'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Delete invitation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: invitationId } = await params
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
    
    // Delete invitation from database
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    const invitation = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
        organizationId: organization.id
      }
    })
    
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }
    
    await prisma.invitation.delete({
      where: { id: invitationId }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting invitation:', error)
    return NextResponse.json({ error: 'Failed to delete invitation' }, { status: 500 })
  }
}

// Resend invitation
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: invitationId } = await params
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
    
    // Get invitation from database
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    const invitation = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
        organizationId: organization.id,
        status: 'pending'
      }
    })
    
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found or already used' }, { status: 404 })
    }
    
    // Update expiration time (extend by 48 hours)
    const updatedInvitation = await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours from now
      }
    })
    
    // Resend invitation email
    try {
      const { sendOrganizationInvitation } = await import('@/lib/email/organization-invites')
      
      await sendOrganizationInvitation({
        email: invitation.email,
        invitedByUsername: session.user.name || 'Team Member',
        invitedByEmail: session.user.email,
        teamName: organization.name,
        inviteLink: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/accept-invitation/${invitation.id}`,
        role: invitation.role
      })
    } catch (emailError) {
      console.error('Failed to resend invitation email:', emailError)
      return NextResponse.json({ error: 'Failed to send invitation email' }, { status: 500 })
    }
    
    return NextResponse.json({ invitation: updatedInvitation })
  } catch (error) {
    console.error('Error resending invitation:', error)
    return NextResponse.json({ error: 'Failed to resend invitation' }, { status: 500 })
  }
}