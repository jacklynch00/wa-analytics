'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { ApplicationFormData } from '@/types';
import ApplicationForm from '@/components/public-form/ApplicationForm';
import PasswordProtection from '@/components/public-form/PasswordProtection';
import FormClosed from '@/components/public-form/FormClosed';
import SubmissionSuccess from '@/components/public-form/SubmissionSuccess';

function PublicFormPageContent() {
  const [form, setForm] = useState<ApplicationFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [hasCooldown, setHasCooldown] = useState(false);
  const params = useParams();
  const slug = params.slug as string;

  useEffect(() => {
    const loadForm = async () => {
      try {
        const response = await fetch(`/api/apply/${slug}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Form not found');
          } else {
            setError('Failed to load form');
          }
          return;
        }

        const result = await response.json();
        setForm(result.form);
        setHasCooldown(result.hasCooldown || false);

        // If form is public or already verified, show it
        if (result.form.isPublic) {
          setPasswordVerified(true);
        }
      } catch (error) {
        console.error('Error loading form:', error);
        setError('Failed to load form');
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [slug]);

  const handlePasswordVerified = () => {
    setPasswordVerified(true);
  };

  const handleSubmissionSuccess = () => {
    setSubmissionSuccess(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Card className="w-full max-w-md bg-white/70 backdrop-blur-sm border-white/60 shadow-lg">
          <CardContent className="p-6 sm:p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Form Unavailable</h2>
            <p className="text-sm sm:text-base text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Card className="w-full max-w-md bg-white/70 backdrop-blur-sm border-white/60 shadow-lg">
          <CardContent className="p-6 sm:p-8 text-center">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Form Not Found</h2>
            <p className="text-sm sm:text-base text-gray-600">
              The application form you&apos;re looking for could not be found.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show success page after submission
  if (submissionSuccess) {
    return <SubmissionSuccess form={form} />;
  }

  // Show form closed if inactive
  if (!form.isActive) {
    return <FormClosed form={form} />;
  }

  // Show password protection for private forms
  if (!form.isPublic && !passwordVerified) {
    return (
      <PasswordProtection 
        form={form} 
        onVerified={handlePasswordVerified}
      />
    );
  }

  // Show the main application form
  return (
    <ApplicationForm 
      form={form} 
      hasCooldown={hasCooldown}
      onSubmissionSuccess={handleSubmissionSuccess}
    />
  );
}

export default function PublicFormPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <PublicFormPageContent />
    </Suspense>
  );
}