import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export class CommunityService {
  // Check if user can access community (through organization membership)
  static async canAccessCommunity(userId: string, communityId: string): Promise<boolean> {
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      select: { organizationId: true }
    })
    
    if (!community) return false
    
    const member = await prisma.member.findFirst({
      where: {
        userId,
        organizationId: community.organizationId
      }
    })
    
    return !!member
  }
  
  // Get communities user can access (through their organization)
  static async getUserCommunities(userId: string) {
    const member = await prisma.member.findFirst({
      where: { userId },
      select: { organizationId: true }
    })
    
    if (!member) return []
    
    return prisma.community.findMany({
      where: { organizationId: member.organizationId },
      include: {
        chatAnalyses: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            totalMessages: true,
            totalMembers: true,
            createdAt: true,
          },
        },
        memberDirectories: {
          where: { isActive: true },
          select: {
            id: true,
            password: true,
            createdAt: true,
          },
        },
        applicationForm: {
          select: {
            id: true,
            title: true,
            customSlug: true,
            isActive: true,
            isPublic: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            chatAnalyses: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' }
    })
  }

  // Get specific community if user has access
  static async getCommunityWithAccess(userId: string, communityId: string) {
    const member = await prisma.member.findFirst({
      where: { userId },
      select: { organizationId: true }
    })
    
    if (!member) return null
    
    return prisma.community.findFirst({
      where: { 
        id: communityId,
        organizationId: member.organizationId 
      },
      include: {
        chatAnalyses: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            totalMessages: true,
            totalMembers: true,
            createdAt: true,
          },
        },
        memberDirectories: {
          where: { isActive: true },
          select: {
            id: true,
            password: true,
            isActive: true,
            visibleFields: true,
            createdAt: true,
          },
        },
        applicationForm: {
          select: {
            id: true,
            title: true,
            customSlug: true,
            isActive: true,
            isPublic: true,
            createdAt: true,
            questions: true,
            _count: {
              select: {
                applications: true,
              },
            },
          },
        },
        _count: {
          select: {
            chatAnalyses: true,
          },
        },
      },
    })
  }

  // Create community (admin only)
  static async createCommunity(userId: string, data: { name: string, description?: string }) {
    const member = await prisma.member.findFirst({
      where: { userId },
      include: { organization: true }
    })
    
    if (!member) throw new Error('No organization found')
    if (member.role !== 'admin') throw new Error('Only admins can create communities')
    
    // Check community limit
    const existingCount = await prisma.community.count({
      where: { organizationId: member.organizationId }
    })
    
    if (existingCount >= 10) {
      throw new Error('Maximum number of communities reached')
    }
    
    return prisma.community.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        organizationId: member.organizationId,
        createdBy: userId,
      },
      include: {
        chatAnalyses: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            totalMessages: true,
            totalMembers: true,
            createdAt: true,
          },
        },
        memberDirectories: {
          where: { isActive: true },
        },
        applicationForm: {
          select: {
            id: true,
            title: true,
            customSlug: true,
            isActive: true,
            isPublic: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            chatAnalyses: true,
          },
        },
      },
    })
  }

  // Update community (admin only)
  static async updateCommunity(userId: string, communityId: string, data: { name: string, description?: string }) {
    const member = await prisma.member.findFirst({
      where: { userId },
      select: { organizationId: true, role: true }
    })
    
    if (!member) throw new Error('No organization found')
    if (member.role !== 'admin') throw new Error('Only admins can update communities')
    
    const community = await prisma.community.findFirst({
      where: { 
        id: communityId,
        organizationId: member.organizationId 
      }
    })
    
    if (!community) throw new Error('Community not found')
    
    return prisma.community.update({
      where: { id: communityId },
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
      }
    })
  }

  // Delete community (admin only)
  static async deleteCommunity(userId: string, communityId: string) {
    const member = await prisma.member.findFirst({
      where: { userId },
      select: { organizationId: true, role: true }
    })
    
    if (!member) throw new Error('No organization found')
    if (member.role !== 'admin') throw new Error('Only admins can delete communities')
    
    const community = await prisma.community.findFirst({
      where: { 
        id: communityId,
        organizationId: member.organizationId 
      }
    })
    
    if (!community) throw new Error('Community not found')
    
    return prisma.community.delete({
      where: { id: communityId }
    })
  }
}