import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import type { Organization, Member, Invitation, User } from '@prisma/client';

export type MemberWithUser = Member & {
  user: Pick<User, 'name' | 'email'>;
};

export type UserRole = {
  role: 'admin' | 'member';
  organizationId: string;
  userId: string;
  email: string;
};

// Re-export Prisma types for convenience
export type { Organization, Invitation } from '@prisma/client';

// Query keys
export const organizationKeys = {
  all: ['organization'] as const,
  info: () => [...organizationKeys.all, 'info'] as const,
  members: () => [...organizationKeys.all, 'members'] as const,
  invitations: () => [...organizationKeys.all, 'invitations'] as const,
  userRole: () => [...organizationKeys.all, 'userRole'] as const,
};

// Fetch organization info
export function useOrganization() {
  return useQuery({
    queryKey: organizationKeys.info(),
    queryFn: async (): Promise<Organization> => {
      const response = await fetch('/api/organization');
      if (!response.ok) {
        throw new Error('Failed to fetch organization');
      }
      const data = await response.json();
      return data.organization;
    },
  });
}

// Fetch organization members
export function useOrganizationMembers() {
  return useQuery({
    queryKey: organizationKeys.members(),
    queryFn: async (): Promise<MemberWithUser[]> => {
      console.log('useOrganizationMembers: Fetching members...');
      const response = await fetch('/api/organization/members');
      console.log('useOrganizationMembers: Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('useOrganizationMembers: Error response:', errorText);
        throw new Error(`Failed to fetch members: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('useOrganizationMembers: Data received:', data);
      console.log('useOrganizationMembers: Members count:', data.members?.length || 0);
      return data.members || [];
    },
  });
}

// Fetch current user's role
export function useUserRole() {
  return useQuery({
    queryKey: organizationKeys.userRole(),
    queryFn: async (): Promise<UserRole | null> => {
      const session = await authClient.getSession();
      if (!session?.data?.user) {
        return null;
      }

      const response = await fetch('/api/organization/members');
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      const currentUserMember = data.members?.find(
        (member: MemberWithUser) => member.user.email === session.data?.user.email
      );
      
      if (!currentUserMember) {
        return null;
      }

      return {
        role: currentUserMember.role,
        organizationId: currentUserMember.organizationId,
        userId: currentUserMember.userId,
        email: session.data.user.email,
      };
    },
  });
}

// Fetch invitations (admin only)
export function useOrganizationInvitations() {
  return useQuery({
    queryKey: organizationKeys.invitations(),
    queryFn: async (): Promise<Invitation[]> => {
      const response = await fetch('/api/organization/invitations');
      if (!response.ok) {
        if (response.status === 403) {
          return []; // Not admin, return empty array
        }
        throw new Error('Failed to fetch invitations');
      }
      const data = await response.json();
      return data.invitations || [];
    },
  });
}

// Update organization name mutation
export function useUpdateOrganizationName() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch('/api/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update organization name');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.info() });
    },
  });
}

// Change member role mutation
export function useChangeRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: 'admin' | 'member' }) => {
      const response = await fetch(`/api/organization/members/${memberId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update role');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.members() });
      queryClient.invalidateQueries({ queryKey: organizationKeys.userRole() });
    },
  });
}

// Invite member mutation
export function useInviteMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const response = await fetch('/api/organization/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send invitation');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.invitations() });
    },
  });
}