import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communityKeys, type Community } from './useCommunities';

// API functions
async function fetchCommunity(id: string): Promise<Community> {
  const response = await fetch(`/api/communities/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch community');
  }
  const data = await response.json();
  return data.community;
}

async function updateCommunity(id: string, params: { name?: string; description?: string }): Promise<Community> {
  const response = await fetch(`/api/communities/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update community');
  }
  
  const data = await response.json();
  return data.community;
}

// Hooks
export function useCommunity(id: string) {
  return useQuery({
    queryKey: communityKeys.detail(id),
    queryFn: () => fetchCommunity(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!id,
  });
}

export function useUpdateCommunity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...params }: { id: string; name?: string; description?: string }) =>
      updateCommunity(id, params),
    onSuccess: (updatedCommunity) => {
      // Update detail cache
      queryClient.setQueryData(
        communityKeys.detail(updatedCommunity.id),
        updatedCommunity
      );
      
      // Update in communities list
      queryClient.setQueryData<Community[]>(
        communityKeys.list(),
        (old) => old?.map(community => 
          community.id === updatedCommunity.id ? updatedCommunity : community
        ) || []
      );
      
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: communityKeys.detail(updatedCommunity.id) });
    },
  });
}