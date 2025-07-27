'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check, X } from 'lucide-react';
import { ApplicationFormData } from '@/types';

interface FormUrlSettingsProps {
  form: ApplicationFormData;
  onUpdate: (updates: Partial<ApplicationFormData>) => void;
}

export default function FormUrlSettings({ form, onUpdate }: FormUrlSettingsProps) {
  const [slugStatus, setSlugStatus] = useState<'checking' | 'valid' | 'invalid' | 'idle'>('idle');
  const [slugError, setSlugError] = useState<string>('');
  const [checkTimeout, setCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  const validateSlug = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugStatus('invalid');
      setSlugError('URL slug must be at least 3 characters long');
      return;
    }

    if (!/^[a-zA-Z0-9-]+$/.test(slug)) {
      setSlugStatus('invalid');
      setSlugError('URL slug can only contain letters, numbers, and hyphens');
      return;
    }

    setSlugStatus('checking');
    
    try {
      const response = await fetch('/api/forms/validate-slug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          slug, 
          excludeFormId: form.id || undefined 
        }),
      });

      const result = await response.json();

      if (result.valid) {
        setSlugStatus('valid');
        setSlugError('');
      } else {
        setSlugStatus('invalid');
        setSlugError(result.message || 'This URL is not available');
      }
    } catch {
      setSlugStatus('invalid');
      setSlugError('Failed to validate URL');
    }
  };

  const handleSlugChange = (value: string) => {
    const cleanSlug = value.toLowerCase().replace(/[^a-zA-Z0-9-]/g, '');
    onUpdate({ customSlug: cleanSlug });

    // Clear previous timeout
    if (checkTimeout) {
      clearTimeout(checkTimeout);
    }

    // Set new timeout for validation
    const timeout = setTimeout(() => {
      if (cleanSlug) {
        validateSlug(cleanSlug);
      } else {
        setSlugStatus('idle');
        setSlugError('');
      }
    }, 500);

    setCheckTimeout(timeout);
  };

  useEffect(() => {
    return () => {
      if (checkTimeout) {
        clearTimeout(checkTimeout);
      }
    };
  }, [checkTimeout]);

  const generateSlug = () => {
    const baseSlug = form.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
    
    handleSlugChange(baseSlug);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="customSlug">Custom URL</Label>
        <div className="mt-2 space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 whitespace-nowrap">
              {typeof window !== 'undefined' ? window.location.origin : ''}/apply/
            </span>
            <div className="flex-1 relative">
              <Input
                id="customSlug"
                value={form.customSlug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="my-community"
                className={`pr-8 ${
                  slugStatus === 'valid' ? 'border-green-500' :
                  slugStatus === 'invalid' ? 'border-red-500' :
                  ''
                }`}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {slugStatus === 'checking' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
                {slugStatus === 'valid' && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
                {slugStatus === 'invalid' && (
                  <X className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
          </div>
          
          {slugError && (
            <div className="flex items-center space-x-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{slugError}</span>
            </div>
          )}
          
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={generateSlug}
            className="text-xs"
          >
            Generate from title
          </Button>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          This URL will be used by applicants to access your application form. Make it memorable and easy to share.
        </p>
      </div>
    </div>
  );
}