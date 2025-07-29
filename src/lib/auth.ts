import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  emailVerification: {
    enabled: false, // Disable for now to avoid email setup issues
    sendOnSignUp: false,
  },
  plugins: [
    nextCookies(),
    organization({
      allowUserToCreateOrganization: true,
      membershipLimit: 10,
      creatorRole: "admin",
      sendInvitationEmail: async (data) => {
        try {
          const { sendOrganizationInvitation } = await import('@/lib/email/organization-invites')
          
          await sendOrganizationInvitation({
            email: data.email,
            invitedByUsername: data.inviter.user.name || 'Team Member',
            invitedByEmail: data.inviter.user.email,
            teamName: data.organization.name,
            inviteLink: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/accept-invitation/${data.id}`,
            role: data.role
          })
          
          console.log(`Invitation email sent to ${data.email}`)
        } catch (error) {
          console.error('Failed to send invitation email:', error)
          // Don't throw error to prevent blocking the invitation process
        }
      }
    })
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  advanced: {
    generateId: () => crypto.randomUUID(),
  },
});