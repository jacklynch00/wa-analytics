'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Building2, UserPlus, CheckCircle } from 'lucide-react'

type OnboardingStep = 'welcome' | 'organization' | 'invite' | 'complete'

export function OnboardingFlow() {
  const [step, setStep] = useState<OnboardingStep>('welcome')
  const [orgName, setOrgName] = useState('')
  const [inviteEmails, setInviteEmails] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  
  const handleCreateOrganization = async () => {
    setLoading(true)
    try {
      if (!orgName.trim()) {
        // Skip org creation, use personal org (which gets auto-created)
        setStep('complete')
        return
      }
      
      await authClient.organization.create({
        name: orgName,
        slug: orgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      })
      setStep('invite')
    } catch (error) {
      console.error('Failed to create organization:', error)
      // Even if creation fails, continue to invite step
      setStep('invite')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSendInvites = async () => {
    setLoading(true)
    const validEmails = inviteEmails.filter(email => email.trim() && email.includes('@'))
    
    for (const email of validEmails) {
      try {
        await authClient.organization.inviteMember({
          email: email.trim(),
          role: 'member'
        })
      } catch (error) {
        console.error(`Failed to invite ${email}:`, error)
      }
    }
    
    setStep('complete')
    setLoading(false)
  }
  
  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Welcome to WhatsApp Analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Let&apos;s get you set up. You can work solo or invite your team to collaborate on community analytics.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Team Collaboration</p>
                  <p className="text-xs text-blue-700">Invite up to 10 team members to analyze communities together</p>
                </div>
              </div>
            </div>
            <Button onClick={() => setStep('organization')} className="w-full" size="lg">
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (step === 'organization') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">Set up your organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization name (optional)
              </label>
              <Input
                placeholder="e.g., Acme Analytics Team"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank to use a personal workspace
              </p>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {orgName.trim() ? `${orgName} Team` : 'Personal Workspace'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {orgName.trim() ? 'Collaborative workspace for your team' : 'Private workspace just for you'}
                  </p>
                </div>
                <Badge variant={orgName.trim() ? 'default' : 'secondary'}>
                  {orgName.trim() ? 'Team' : 'Personal'}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={handleCreateOrganization} 
                className="w-full" 
                disabled={loading}
                size="lg"
              >
                {loading ? 'Creating...' : (orgName.trim() ? 'Create Organization' : 'Continue Solo')}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setStep('welcome')} 
                className="w-full"
                disabled={loading}
              >
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (step === 'invite') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">Invite your team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Add team members to collaborate on community analytics
            </p>
            
            <div className="space-y-3">
              {inviteEmails.map((email, index) => (
                <div key={index} className="relative">
                  <Input
                    placeholder="teammate@example.com"
                    value={email}
                    type="email"
                    onChange={(e) => {
                      const newEmails = [...inviteEmails]
                      newEmails[index] = e.target.value
                      setInviteEmails(newEmails)
                    }}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
            
            <Button
              variant="outline"
              onClick={() => setInviteEmails([...inviteEmails, ''])}
              className="w-full"
              disabled={inviteEmails.length >= 5}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Another Email {inviteEmails.length >= 5 && '(Max 5)'}
            </Button>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> Team members will receive email invitations to join your organization
              </p>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={handleSendInvites} 
                className="w-full" 
                disabled={loading}
                size="lg"
              >
                {loading ? 'Sending Invites...' : 'Send Invites'}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setStep('complete')} 
                className="w-full"
                disabled={loading}
              >
                Skip for Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">You&apos;re all set!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Ready to start analyzing your WhatsApp communities and building member directories.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-green-900 mb-2">What&apos;s next?</h4>
                <ul className="text-xs text-green-700 space-y-1 text-left">
                  <li>• Create your first community</li>
                  <li>• Upload WhatsApp chat exports for analysis</li>
                  <li>• Build member directories and application forms</li>
                  <li>• Invite team members to collaborate</li>
                </ul>
              </div>
            </div>
            
            <Button 
              onClick={() => window.location.href = '/dashboard'} 
              className="w-full"
              size="lg"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
}