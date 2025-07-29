'use client'

import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import type { Organization } from '@prisma/client'

export function OrganizationGuard({ children }: { children: React.ReactNode }) {
  const [hasOrganization, setHasOrganization] = useState<boolean | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isNewUser, setIsNewUser] = useState(false)
  
  useEffect(() => {
    checkOrganization()
  }, [])
  
  const checkOrganization = async () => {
    try {
      // First check if user is authenticated
      const session = await authClient.getSession()
      if (!session.data?.user) {
        // Not authenticated - let the app handle redirect to sign-in
        setHasOrganization(true) // Don't show onboarding for unauthenticated users
        return
      }
      
      // Check if user has an organization by calling our API
      const response = await fetch('/api/organization')
      if (response.ok) {
        const data = await response.json()
        setHasOrganization(!!data.organization)
        
        // Check if this is a newly created organization (might trigger onboarding)
        if (data.organization) {
          const createdAt = new Date(data.organization.createdAt)
          const now = new Date()
          const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60)
          setIsNewUser(diffMinutes < 5) // Consider "new" if created in last 5 minutes
        }
      } else if (response.status === 404) {
        // No organization found - show onboarding
        setHasOrganization(false)
      } else {
        // Other error - assume they have access
        setHasOrganization(true)
      }
    } catch (error) {
      console.error('Error checking organization:', error)
      // On error, assume they have access to avoid blocking users
      setHasOrganization(true)
    }
  }
  
  // Loading state
  if (hasOrganization === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto shadow-lg">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
            <p className="text-gray-600">Setting up your workspace...</p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Show onboarding for users without organizations
  if (!hasOrganization) {
    return <OnboardingFlow />
  }
  
  // For existing users with organizations, render the children
  return <>{children}</>
}

// Hook to use organization data
export function useOrganization() {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    loadOrganization()
  }, [])
  
  const loadOrganization = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/organization')
      if (response.ok) {
        const data = await response.json()
        setOrganization(data.organization)
      } else {
        setError('Failed to load organization')
      }
    } catch (error) {
      console.error('Failed to load organization:', error)
      setError('Failed to load organization')
    } finally {
      setLoading(false)
    }
  }
  
  return { 
    organization, 
    loading, 
    error, 
    refresh: loadOrganization 
  }
}