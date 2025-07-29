import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
export interface Community {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: {
    chatAnalyses: number;
  };
  // Optional relations
  chatAnalyses?: ChatAnalysis[];
  memberDirectories?: MemberDirectory[];
  applicationForm?: ApplicationForm;
}

export interface ChatAnalysis {
  id: string;
  title: string;
  totalMessages: number;
  totalMembers: number;
  createdAt: string;
}

export interface MemberDirectory {
  id: string;
  password: string | null;
  createdAt: string;
}

export interface ApplicationForm {
  id: string;
  title: string;
  customSlug: string;
  isActive: boolean;
  isPublic: boolean;
  createdAt: string;
}

// Query keys
export const communityKeys = {
  all: ['communities'] as const,
  lists: () => [...communityKeys.all, 'list'] as const,
  list: (filters?: string) => [...communityKeys.lists(), { filters }] as const,
  details: () => [...communityKeys.all, 'detail'] as const,
  detail: (id: string) => [...communityKeys.details(), id] as const,
  analytics: (id: string) => [...communityKeys.detail(id), 'analytics'] as const,
  forms: (id: string) => [...communityKeys.detail(id), 'forms'] as const,
  directory: (id: string) => [...communityKeys.detail(id), 'directory'] as const,
  stats: () => [...communityKeys.all, 'stats'] as const,
};

// API functions
async function fetchCommunities(): Promise<Community[]> {
  const response = await fetch('/api/communities');
  if (!response.ok) {
    throw new Error('Failed to fetch communities');
  }
  const data = await response.json();
  return data.communities || [];
}

async function createCommunity(params: { name: string; description?: string }): Promise<Community> {
  const response = await fetch('/api/communities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create community');
  }
  
  const data = await response.json();
  return data.community;
}

async function deleteCommunity(id: string): Promise<void> {
  const response = await fetch(`/api/communities/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete community');
  }
}

// Hooks
export function useCommunities() {
  return useQuery({
    queryKey: communityKeys.list(),
    queryFn: fetchCommunities,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreateCommunity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createCommunity,
    onSuccess: (newCommunity) => {
      // Add to existing list
      queryClient.setQueryData<Community[]>(
        communityKeys.list(),
        (old) => old ? [newCommunity, ...old] : [newCommunity]
      );
      
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: communityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: communityKeys.stats() });
    },
  });
}

export function useDeleteCommunity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteCommunity,
    onSuccess: (_, deletedId) => {
      // Remove from existing list
      queryClient.setQueryData<Community[]>(
        communityKeys.list(),
        (old) => old?.filter(community => community.id !== deletedId) || []
      );
      
      // Remove detail cache
      queryClient.removeQueries({ queryKey: communityKeys.detail(deletedId) });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: communityKeys.stats() });
    },
  });
}

// Computed data hooks
export function useCommunityStats() {
  const { data: communities = [] } = useCommunities();
  
  return {
    totalCommunities: communities.length,
    totalAnalyses: communities.reduce((sum, community) => sum + community._count.chatAnalyses, 0),
    totalSharedDirectories: communities.reduce((sum, community) => 
      sum + (community.memberDirectories?.length || 0), 0
    ),
  };
}