import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Public endpoint to get invitation details (no auth required)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: invitationId } = await params
    
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    // Get invitation with organization details
    const invitation = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
        status: 'pending',
        expiresAt: { gt: new Date() } // Only non-expired invitations
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        inviter: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })
    
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found or expired' }, { status: 404 })
    }
    
    return NextResponse.json({ invitation })
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json({ error: 'Failed to fetch invitation' }, { status: 500 })
  }
}