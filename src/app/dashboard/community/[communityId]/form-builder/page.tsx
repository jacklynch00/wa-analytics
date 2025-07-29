'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { ApplicationFormData, FormQuestion } from '@/types';
import FormSettings from '@/components/form-builder/FormSettings';
import FormUrlSettings from '@/components/form-builder/FormUrlSettings';
import QuestionBuilder from '@/components/form-builder/QuestionBuilder';
import FormPreviewModal from '@/components/form-builder/FormPreviewModal';

interface Community {
  id: string;
  name: string;
  description: string | null;
}

function FormBuilderPageContent() {
  const [community, setCommunity] = useState<Community | null>(null);
  const [form, setForm] = useState<ApplicationFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();
  const params = useParams();
  const communityId = params.communityId as string;

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load community
        const communityResponse = await fetch(`/api/communities/${communityId}`);
        if (!communityResponse.ok) {
          const errorText = await communityResponse.text();
          console.error('Community API error:', errorText);
          throw new Error('Failed to load community');
        }
        const communityResult = await communityResponse.json();
        setCommunity(communityResult.community);

        // Load existing form if it exists
        try {
          const formResponse = await fetch(`/api/communities/${communityId}/form`);
          if (formResponse.ok) {
            const formResult = await formResponse.json();
            setForm(formResult.form);
          } else if (formResponse.status === 404) {
            // No form exists yet, create default form structure
            setForm({
              id: '',
              communityId: communityId,
              title: `Join ${communityResult.community.name}`,
              description: `Apply to become a member of ${communityResult.community.name}`,
              isActive: true,
              isPublic: true,
              password: '',
              customSlug: '',
              whatsappInviteUrl: '',
              questions: [
                {
                  id: 'email',
                  label: 'Best email for WhatsApp invite',
                  type: 'text',
                  required: true,
                  placeholder: 'your@email.com'
                }
              ],
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          } else {
            const errorText = await formResponse.text();
            console.error('Form API error:', formResponse.status, errorText);
            throw new Error(`Failed to load form: ${formResponse.status}`);
          }
        } catch (formError) {
          console.error('Form loading error:', formError);
          // If form loading fails, still create a default form
          setForm({
            id: '',
            communityId: communityId,
            title: `Join ${communityResult.community.name}`,
            description: `Apply to become a member of ${communityResult.community.name}`,
            isActive: true,
            isPublic: true,
            password: '',
            customSlug: '',
            whatsappInviteUrl: '',
            questions: [
              {
                id: 'email',
                label: 'Best email for WhatsApp invite',
                type: 'text',
                required: true,
                placeholder: 'your@email.com'
              }
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error(`Failed to load form builder: ${error instanceof Error ? error.message : 'Unknown error'}`);
        router.push(`/dashboard/community/${communityId}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router, communityId]);

  const handleSaveForm = async () => {
    if (!form) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/communities/${communityId}/form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save form');
      }

      const result = await response.json();
      setForm(result.form);
      toast.success('Form saved successfully!');
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewForm = () => {
    setShowPreview(true);
  };

  const updateForm = (updates: Partial<ApplicationFormData>) => {
    if (!form) return;
    setForm({ ...form, ...updates });
  };

  const updateQuestions = (questions: FormQuestion[]) => {
    updateForm({ questions });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!community || !form) {
    return (
      <div className="flex items-center justify-center py-8">
        <Card className="w-full max-w-md bg-white/70 backdrop-blur-sm border-white/60 shadow-lg">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold mb-4">Error Loading Form Builder</h2>
            <p className="text-sm text-gray-600 mb-4">Could not load the form builder.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Action Buttons */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3 justify-end">
          <Button 
            variant="outline" 
            onClick={handlePreviewForm}
            className="w-full sm:w-auto"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview Form
          </Button>
          <Button 
            onClick={handleSaveForm}
            disabled={saving || !form.customSlug}
            className="w-full sm:w-auto"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Form'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Builder */}
          <div className="lg:col-span-2">
            {/* Questions Section */}
            <Card className="bg-white/70 backdrop-blur-sm border-white/60 shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Application Questions</CardTitle>
                  <div className="text-sm text-gray-500">
                    {form.questions.length}/12 questions
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <QuestionBuilder 
                  questions={form.questions} 
                  onUpdate={updateQuestions}
                />
              </CardContent>
            </Card>
          </div>

          {/* Form Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Custom URL Section */}
            <Card className="bg-blue-50/50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">Form URL</CardTitle>
              </CardHeader>
              <CardContent>
                <FormUrlSettings form={form} onUpdate={updateForm} />
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-white/60 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Form Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <FormSettings form={form} onUpdate={updateForm} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Preview Modal */}
        {form && (
          <FormPreviewModal
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            form={form}
          />
        )}
    </div>
  );
}

export default function FormBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <FormBuilderPageContent />
    </Suspense>
  );
}