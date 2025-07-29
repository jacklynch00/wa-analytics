import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateToOrganizations() {
  console.log('Starting migration to organization-based structure...')
  
  try {
    // Get all users with their communities
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true
      }
    })
    
    console.log(`Found ${users.length} users to migrate`)
    
    for (const user of users) {
      console.log(`Processing user: ${user.email}`)
      
      // Create personal organization for each user
      const organization = await prisma.organization.create({
        data: {
          name: `${user.name}'s Organization`,
          slug: `${user.email.split('@')[0]}-${user.id.slice(-6)}`,
          metadata: JSON.stringify({ isPersonal: true }),
        }
      })
      
      console.log(`Created organization: ${organization.slug}`)
      
      // Add user as admin member of their organization
      await prisma.member.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: 'admin'
        }
      })
      
      console.log(`Added user as admin member`)
      
      // Get user's communities before migration
      const userCommunities = await prisma.$queryRaw`
        SELECT id, name FROM "community" WHERE "userId" = ${user.id}
      `
      
      console.log(`Found ${(userCommunities as any[]).length} communities for user`)
      
      // Migrate user's communities to organization
      const updateResult = await prisma.$executeRaw`
        UPDATE "community" 
        SET "organizationId" = ${organization.id}, "createdBy" = ${user.id}
        WHERE "userId" = ${user.id}
      `
      
      console.log(`Updated ${updateResult} communities for user ${user.email}`)
    }
    
    console.log('Migration completed successfully!')
    
    // Verify migration
    const totalOrgs = await prisma.organization.count()
    const totalMembers = await prisma.member.count()
    const totalCommunities = await prisma.community.count()
    
    console.log(`\nMigration Summary:`)
    console.log(`- Organizations created: ${totalOrgs}`)
    console.log(`- Members created: ${totalMembers}`)
    console.log(`- Communities migrated: ${totalCommunities}`)
    
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

// Run migration
migrateToOrganizations()
  .catch((error) => {
    console.error('Migration script failed:', error)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })