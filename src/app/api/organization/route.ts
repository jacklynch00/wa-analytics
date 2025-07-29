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
    
    return NextResponse.json({ organization })
  } catch (error) {
    console.error('Error fetching organization:', error)
    return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { name, logo } = await request.json()
    
    const organization = await OrganizationService.getUserOrganization(session.user.id)
    if (!organization) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }
    
    // Check if user is admin
    const isAdmin = await OrganizationService.isAdmin(session.user.id, organization.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 })
    }
    
    // Update organization directly in database
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    const updated = await prisma.organization.update({
      where: { id: organization.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(logo && { logo })
      }
    })
    
    return NextResponse.json({ organization: updated })
  } catch (error) {
    console.error('Error updating organization:', error)
    return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
  }
}