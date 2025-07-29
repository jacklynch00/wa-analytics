import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export class OrganizationService {
  // Get user's organization (assuming single org per user for now)
  static async getUserOrganization(userId: string) {
    let member = await prisma.member.findFirst({
      where: { userId },
      include: {
        organization: {
          include: {
            members: {
              include: { user: true }
            }
          }
        }
      }
    })

    // If user doesn't have an organization, create a personal one (temporary for Phase 1)
    if (!member) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true }
      })

      if (user) {
        // Create personal organization
        const organization = await prisma.organization.create({
          data: {
            name: `${user.name}'s Organization`,
            slug: `${user.email.split('@')[0]}-${userId.slice(-6)}`,
            metadata: JSON.stringify({ isPersonal: true }),
          }
        })

        // Add user as admin member
        member = await prisma.member.create({
          data: {
            userId,
            organizationId: organization.id,
            role: 'admin'
          },
          include: {
            organization: {
              include: {
                members: {
                  include: { user: true }
                }
              }
            }
          }
        })
      }
    }

    return member?.organization
  }
  
  // Check if user is admin of organization
  static async isAdmin(userId: string, organizationId: string): Promise<boolean> {
    const member = await prisma.member.findFirst({
      where: {
        userId,
        organizationId,
        role: 'admin'
      }
    })
    return !!member
  }
  
  // Get organization members
  static async getMembers(organizationId: string) {
    return prisma.member.findMany({
      where: { organizationId },
      include: { user: true },
      orderBy: { createdAt: 'asc' }
    })
  }

  // Check if user can access organization
  static async canAccessOrganization(userId: string, organizationId: string): Promise<boolean> {
    const member = await prisma.member.findFirst({
      where: {
        userId,
        organizationId
      }
    })
    return !!member
  }
}