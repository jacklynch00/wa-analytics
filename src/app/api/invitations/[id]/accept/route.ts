import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: invitationId } = await params
    
    // Check if user is authenticated
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: 'Must be signed in to accept invitation' }, { status: 401 })
    }
    
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    // Get the invitation
    const invitation = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
        status: 'pending',
        expiresAt: { gt: new Date() }
      },
      include: {
        organization: true
      }
    })
    
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found or expired' }, { status: 404 })
    }
    
    // Check if user email matches invitation email
    if (session.user.email !== invitation.email) {
      return NextResponse.json({ 
        error: `This invitation was sent to ${invitation.email}. Please sign in with that email address.` 
      }, { status: 400 })
    }
    
    // Check if user is already a member
    const existingMember = await prisma.member.findFirst({
      where: {
        userId: session.user.id,
        organizationId: invitation.organizationId
      }
    })
    
    if (existingMember) {
      return NextResponse.json({ error: 'You are already a member of this organization' }, { status: 400 })
    }
    
    // Add user as member
    await prisma.member.create({
      data: {
        userId: session.user.id,
        organizationId: invitation.organizationId,
        role: invitation.role
      }
    })
    
    // Mark invitation as accepted
    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'accepted' }
    })
    
    // Send welcome email
    try {
      const { sendWelcomeEmail } = await import('@/lib/email/organization-invites')
      await sendWelcomeEmail({
        email: session.user.email,
        username: session.user.name || 'Team Member',
        teamName: invitation.organization.name,
        role: invitation.role
      })
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail the operation if email fails
    }
    
    return NextResponse.json({ 
      success: true,
      organization: invitation.organization,
      role: invitation.role
    })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 })
  }
}