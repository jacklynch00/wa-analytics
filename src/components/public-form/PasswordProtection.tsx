'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, AlertCircle } from 'lucide-react';
import { ApplicationFormData } from '@/types';

interface PasswordProtectionProps {
  form: ApplicationFormData;
  onVerified: () => void;
}

export default function PasswordProtection({ form, onVerified }: PasswordProtectionProps) {
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch(`/api/apply/${form.customSlug}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Invalid password');
      }

      onVerified();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to verify password');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Card className="w-full max-w-md bg-white/70 backdrop-blur-sm border-white/60 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-orange-600" />
          </div>
          <CardTitle className="text-xl font-semibold">
            Protected Application Form
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            This form is password protected. Please enter the access password to continue.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-sm font-medium">
                Access Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className={`mt-1 ${error ? 'border-red-500' : ''}`}
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verifying...
                </>
              ) : (
                'Access Form'
              )}
            </Button>
          </form>

          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800 text-center">
              <strong>Need access?</strong> Contact the community administrators for the password.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}