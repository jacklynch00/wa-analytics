import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communityKeys } from '../communities/useCommunities';

// Types
export interface ChatAnalysis {
  id: string;
  title: string;
  totalMessages: number;
  totalMembers: number;
  createdAt: string;
  communityId: string;
}

export interface AnalysisDetail extends ChatAnalysis {
  dateRange: {
    start: Date;
    end: Date;
  };
  members: AnalysisMember[];
  aiRecaps?: { [key: string]: AIRecapData };
  resources?: unknown[];
}

export interface AnalysisMember {
  id: string;
  name: string;
  messageCount: number;
  firstActive: Date;
  lastActive: Date;
}

export interface AIRecapData {
  content: string;
  generatedAt: string;
}

// Query keys
export const analyticsKeys = {
  all: ['analytics'] as const,
  lists: () => [...analyticsKeys.all, 'list'] as const,
  list: (communityId: string) => [...analyticsKeys.lists(), communityId] as const,
  details: () => [...analyticsKeys.all, 'detail'] as const,
  detail: (id: string) => [...analyticsKeys.details(), id] as const,
  title: (id: string) => [...analyticsKeys.detail(id), 'title'] as const,
};

// API functions
async function fetchCommunityAnalytics(communityId: string): Promise<ChatAnalysis[]> {
  const response = await fetch(`/api/communities/${communityId}/analytics`);
  if (!response.ok) {
    throw new Error('Failed to fetch analytics');
  }
  const data = await response.json();
  return data.analyses || [];
}

async function fetchAnalysis(id: string): Promise<AnalysisDetail> {
  const response = await fetch(`/api/analysis/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch analysis');
  }
  const data = await response.json();
  
  // Convert date strings back to Date objects
  const analysisWithDates = JSON.parse(JSON.stringify(data.analysis), (key, value) => {
    if (key === 'timestamp' || key === 'firstActive' || key === 'lastActive' || 
        key === 'dateShared' || key === 'start' || key === 'end') {
      return new Date(value);
    }
    return value;
  });
  
  return analysisWithDates;
}

async function updateAnalysisTitle(id: string, title: string): Promise<void> {
  const response = await fetch(`/api/analysis/${id}/title`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update title');
  }
}

async function deleteAnalysis(id: string): Promise<void> {
  const response = await fetch(`/api/analysis/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete analysis');
  }
}

// Hooks
export function useCommunityAnalytics(communityId: string) {
  return useQuery({
    queryKey: analyticsKeys.list(communityId),
    queryFn: () => fetchCommunityAnalytics(communityId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!communityId,
  });
}

export function useAnalysis(id: string) {
  return useQuery({
    queryKey: analyticsKeys.detail(id),
    queryFn: () => fetchAnalysis(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!id,
  });
}

export function useUpdateAnalysisTitle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      updateAnalysisTitle(id, title),
    onSuccess: (_, { id, title }) => {
      // Update analysis detail
      queryClient.setQueryData<AnalysisDetail>(
        analyticsKeys.detail(id),
        (old) => old ? { ...old, title } : undefined
      );
      
      // Update in community analytics list
      queryClient.setQueriesData<ChatAnalysis[]>(
        { queryKey: analyticsKeys.lists() },
        (old) => old?.map(analysis => 
          analysis.id === id ? { ...analysis, title } : analysis
        )
      );
    },
  });
}

export function useDeleteAnalysis() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteAnalysis,
    onSuccess: (_, deletedId) => {
      // Remove from detail cache
      queryClient.removeQueries({ queryKey: analyticsKeys.detail(deletedId) });
      
      // Remove from analytics lists
      queryClient.setQueriesData<ChatAnalysis[]>(
        { queryKey: analyticsKeys.lists() },
        (old) => old?.filter(analysis => analysis.id !== deletedId)
      );
      
      // Update community counts
      queryClient.invalidateQueries({ queryKey: communityKeys.lists() });
    },
  });
}