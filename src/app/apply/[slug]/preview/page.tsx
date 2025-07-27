'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Eye, AlertCircle } from 'lucide-react';
import { ApplicationFormData, FormQuestion } from '@/types';

function PreviewPageContent() {
  const [form, setForm] = useState<ApplicationFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  useEffect(() => {
    const loadForm = async () => {
      try {
        const response = await fetch(`/api/apply/${slug}/preview`);
        
        if (!response.ok) {
          if (response.status === 403) {
            setError('You are not authorized to preview this form');
          } else if (response.status === 404) {
            setError('Form not found');
          } else {
            setError('Failed to load form preview');
          }
          return;
        }

        const result = await response.json();
        setForm(result.form);
      } catch (error) {
        console.error('Error loading form preview:', error);
        setError('Failed to load form preview');
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [slug]);

  const handleBackToBuilder = () => {
    if (form) {
      router.push(`/dashboard/community/${form.communityId}/form-builder`);
    } else {
      router.push('/dashboard');
    }
  };

  const renderQuestion = (question: FormQuestion) => {
    const questionId = `question-${question.id}`;

    switch (question.type) {
      case 'text':
        return (
          <div key={question.id} className="space-y-2">
            <Label htmlFor={questionId} className="text-sm font-medium">
              {question.label}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {question.type === 'text' && question.placeholder && (
              <Input
                id={questionId}
                placeholder={question.placeholder}
                disabled
                className="bg-gray-50"
              />
            )}
          </div>
        );

      case 'multiple_choice':
        return (
          <div key={question.id} className="space-y-3">
            <Label className="text-sm font-medium">
              {question.label}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup disabled className="space-y-2">
              {question.options?.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={option} 
                    id={`${questionId}-${optionIndex}`}
                    disabled 
                  />
                  <Label 
                    htmlFor={`${questionId}-${optionIndex}`}
                    className="text-sm text-gray-600"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'multiple_select':
        return (
          <div key={question.id} className="space-y-3">
            <Label className="text-sm font-medium">
              {question.label}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              {question.options?.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`${questionId}-${optionIndex}`}
                    disabled 
                  />
                  <Label 
                    htmlFor={`${questionId}-${optionIndex}`}
                    className="text-sm text-gray-600"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
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
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-white/70 backdrop-blur-sm border-white/60 shadow-lg">
          <CardContent className="p-6 sm:p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Preview Unavailable</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/dashboard')} size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-white/70 backdrop-blur-sm border-white/60 shadow-lg">
          <CardContent className="p-6 sm:p-8 text-center">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Form Not Found</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4">The form you&apos;re trying to preview could not be found.</p>
            <Button onClick={() => router.push('/dashboard')} size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Preview Header */}
      <div className="relative z-10 bg-yellow-100 border-b border-yellow-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 gap-3 sm:gap-0">
            <div className="flex items-center space-x-3">
              <Eye className="w-5 h-5 text-yellow-600" />
              <div>
                <h1 className="text-sm font-medium text-yellow-800">Form Preview Mode</h1>
                <p className="text-xs text-yellow-600">This is how applicants will see your form</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBackToBuilder}
              className="border-yellow-300 bg-white/80 hover:bg-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Form Builder
            </Button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-white/70 backdrop-blur-sm border-white/60 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              {form.title}
            </CardTitle>
            {form.description && (
              <p className="text-gray-600 mt-2">{form.description}</p>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Form Status */}
            <div className="flex flex-wrap gap-2 justify-center">
              <span className={`px-2 py-1 text-xs rounded-full ${
                form.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {form.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                form.isPublic 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {form.isPublic ? 'Public' : 'Private'}
              </span>
            </div>

            {/* Questions */}
            <div className="space-y-6">
              {form.questions.map((question) => renderQuestion(question))}
            </div>

            {/* Submit Button (Disabled) */}
            <div className="pt-6 border-t border-gray-200">
              <Button 
                className="w-full" 
                size="lg" 
                disabled
              >
                Submit Application (Preview Mode)
              </Button>
              <p className="text-center text-xs text-gray-500 mt-2">
                This form is in preview mode - submissions are disabled
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preview Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Public URL: <code className="bg-gray-100 px-2 py-1 rounded text-xs">
              {typeof window !== 'undefined' ? window.location.origin : ''}/apply/{form.customSlug}
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <PreviewPageContent />
    </Suspense>
  );
}