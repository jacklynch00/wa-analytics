'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertCircle, Send } from 'lucide-react';
import { ApplicationFormData, FormQuestion } from '@/types';
import { toast } from 'sonner';

interface ApplicationFormProps {
  form: ApplicationFormData;
  hasCooldown: boolean;
  onSubmissionSuccess: () => void;
}

function createFormSchema(questions: FormQuestion[]) {
  const schema: Record<string, z.ZodTypeAny> = {};

  questions.forEach((question) => {
    if (question.required) {
      switch (question.type) {
        case 'text':
          schema[question.id] = z.string().min(1, 'This field is required');
          break;
        case 'multiple_choice':
          schema[question.id] = z.string().min(1, 'Please select an option');
          break;
        case 'multiple_select':
          schema[question.id] = z.array(z.string()).min(1, 'Please select at least one option');
          break;
      }
    } else {
      switch (question.type) {
        case 'text':
          schema[question.id] = z.string().optional();
          break;
        case 'multiple_choice':
          schema[question.id] = z.string().optional();
          break;
        case 'multiple_select':
          schema[question.id] = z.array(z.string()).optional();
          break;
      }
    }
  });

  return z.object(schema);
}

export default function ApplicationForm({ form, hasCooldown, onSubmissionSuccess }: ApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [multiSelectValues, setMultiSelectValues] = useState<Record<string, string[]>>({});

  const formSchema = createFormSchema(form.questions);
  type FormData = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: form.questions.reduce((acc, question) => {
      if (question.type === 'multiple_select') {
        acc[question.id] = [];
        setMultiSelectValues(prev => ({ ...prev, [question.id]: [] }));
      }
      return acc;
    }, {} as Record<string, any>),
  });

  const handleMultiSelectChange = (questionId: string, option: string, checked: boolean) => {
    const currentValues = multiSelectValues[questionId] || [];
    const newValues = checked 
      ? [...currentValues, option]
      : currentValues.filter(v => v !== option);
    
    setMultiSelectValues(prev => ({ ...prev, [questionId]: newValues }));
    setValue(questionId, newValues as any);
  };

  const onSubmit = async (data: FormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/apply/${form.customSlug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses: data,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit application');
      }

      // Set cooldown cookie
      const COOLDOWN_DAYS = 5;
      const maxAge = COOLDOWN_DAYS * 24 * 60 * 60;
      document.cookie = `submitted_${form.id}=true; max-age=${maxAge}; path=/`;

      onSubmissionSuccess();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: FormQuestion) => {
    const error = errors[question.id];

    switch (question.type) {
      case 'text':
        return (
          <div key={question.id} className="space-y-2">
            <Label htmlFor={question.id} className="text-sm font-medium">
              {question.label}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={question.id}
              {...register(question.id)}
              placeholder={question.placeholder || 'Enter your answer...'}
              className={error ? 'border-red-500' : ''}
            />
            {error && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error.message}
              </p>
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
            <RadioGroup
              onValueChange={(value) => setValue(question.id, value as any)}
              className="space-y-2"
            >
              {question.options?.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={option} 
                    id={`${question.id}-${optionIndex}`}
                  />
                  <Label 
                    htmlFor={`${question.id}-${optionIndex}`}
                    className="text-sm cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              )) || []}
            </RadioGroup>
            {error && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error.message}
              </p>
            )}
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
                    id={`${question.id}-${optionIndex}`}
                    checked={(multiSelectValues[question.id] || []).includes(option)}
                    onCheckedChange={(checked) => 
                      handleMultiSelectChange(question.id, option, checked as boolean)
                    }
                  />
                  <Label 
                    htmlFor={`${question.id}-${optionIndex}`}
                    className="text-sm cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              )) || []}
            </div>
            {error && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error.message}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (hasCooldown) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Card className="w-full max-w-2xl bg-white/70 backdrop-blur-sm border-white/60 shadow-lg">
          <CardContent className="p-6 sm:p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-orange-500 mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Application Recently Submitted</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              You have already submitted an application for this community recently. 
              Please wait 5 days before submitting another application.
            </p>
            <p className="text-xs text-gray-500">
              If you believe this is an error, please contact the community administrators.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-white/70 backdrop-blur-sm border-white/60 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">
              {form.title}
            </CardTitle>
            {form.description && (
              <p className="text-gray-600 mt-3 text-lg leading-relaxed">
                {form.description}
              </p>
            )}
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Questions */}
              {form.questions.map((question) => (
                <div key={question.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50/30">
                  {renderQuestion(question)}
                </div>
              ))}

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-200">
                <Button 
                  type="submit"
                  className="w-full" 
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Application
                    </>
                  )}
                </Button>
                
                <p className="text-center text-xs text-gray-500 mt-3">
                  By submitting this application, you agree to be contacted by the community administrators.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}