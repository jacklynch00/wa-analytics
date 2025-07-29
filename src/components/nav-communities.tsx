"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Plus, Users } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface Community {
  id: string
  name: string
  _count: {
    chatAnalyses: number
  }
}

export function NavCommunities() {
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newCommunity, setNewCommunity] = useState({ name: '', description: '' })
  const [isCreating, setIsCreating] = useState(false)

  const { data: communities = [], isLoading } = useQuery({
    queryKey: ['communities'],
    queryFn: async (): Promise<Community[]> => {
      const response = await fetch('/api/communities')
      if (!response.ok) throw new Error('Failed to fetch communities')
      const data = await response.json()
      return data.communities || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - don't refetch for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for 10 minutes
  })

  const handleCreateCommunity = async () => {
    if (!newCommunity.name.trim()) {
      toast.error('Community name is required')
      return
    }

    // Check if user has reached the limit
    if (communities.length >= 10) {
      toast.error('Maximum number of communities reached (10)')
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/communities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCommunity.name,
          description: newCommunity.description,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create community')
      }

      // Invalidate and refetch communities
      queryClient.invalidateQueries({ queryKey: ['communities'] })
      
      setNewCommunity({ name: '', description: '' })
      setIsCreateModalOpen(false)
      toast.success('Community created successfully')
    } catch (error) {
      console.error('Error creating community:', error)
      if (error instanceof Error) {
        toast.error(`Error: ${error.message}`)
      } else {
        toast.error('Error creating community. Please try again.')
      }
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Communities</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton disabled>
              <Users className="size-4" />
              Loading...
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    )
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Communities</SidebarGroupLabel>
        <SidebarGroupAction 
          onClick={() => setIsCreateModalOpen(true)}
          className="cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Plus />
          <span className="sr-only">Add Community</span>
        </SidebarGroupAction>
        <SidebarMenu>
          {communities.map((community) => (
            <SidebarMenuItem key={community.id}>
              <SidebarMenuButton asChild isActive={pathname.includes(`/community/${community.id}`)}>
                <a href={`/dashboard/community/${community.id}`}>
                  <Users className="size-4" />
                  <span>{community.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {community._count.chatAnalyses}
                  </span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          {communities.length === 0 && (
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                <Users className="size-4" />
                No communities yet
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroup>

      {/* Create Community Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Create New Community</DialogTitle>
            <DialogDescription>Create a community to organize your WhatsApp chat analyses and share insights with others.</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div>
              <label className='text-sm font-medium text-gray-700 mb-2 block'>Community Name *</label>
              <Input
                value={newCommunity.name}
                onChange={(e) => setNewCommunity((prev) => ({ ...prev, name: e.target.value }))}
                placeholder='Enter community name'
                disabled={isCreating}
              />
            </div>
            <div>
              <label className='text-sm font-medium text-gray-700 mb-2 block'>Description (optional)</label>
              <Textarea
                value={newCommunity.description}
                onChange={(e) => setNewCommunity((prev) => ({ ...prev, description: e.target.value }))}
                placeholder='Describe your community'
                rows={3}
                disabled={isCreating}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant='outline' 
              onClick={() => {
                setIsCreateModalOpen(false)
                setNewCommunity({ name: '', description: '' })
              }}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCommunity} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Community'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}