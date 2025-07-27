'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { FormQuestion } from '@/types';

interface QuestionTemplate {
  label: string;
  type: 'text' | 'multiple_choice' | 'multiple_select';
  required: boolean;
  placeholder?: string;
  options?: string[];
  category: string;
}

const QUESTION_TEMPLATES: QuestionTemplate[] = [
  // Contact Information
  {
    label: "Best email for WhatsApp invite",
    type: "text",
    required: true,
    placeholder: "your@email.com",
    category: "Contact"
  },
  {
    label: "Full Name",
    type: "text", 
    required: true,
    placeholder: "John Doe",
    category: "Contact"
  },
  {
    label: "Phone Number",
    type: "text",
    required: false,
    placeholder: "+1 (555) 123-4567",
    category: "Contact"
  },
  
  // Professional Information
  {
    label: "Company",
    type: "text",
    required: false,
    placeholder: "Your company name",
    category: "Professional"
  },
  {
    label: "Role/Title",
    type: "text",
    required: false,
    placeholder: "Your job title",
    category: "Professional"
  },
  {
    label: "Years of Professional Experience",
    type: "multiple_choice",
    required: false,
    options: ["0-2 years", "3-5 years", "6-10 years", "10+ years"],
    category: "Professional"
  },
  {
    label: "Industry",
    type: "multiple_choice",
    required: false,
    options: ["Technology", "Healthcare", "Finance", "Education", "Marketing", "Other"],
    category: "Professional"
  },
  
  // Business Information
  {
    label: "Annual Company Revenue",
    type: "multiple_choice",
    required: false,
    options: ["Pre-revenue", "$1-100K", "$100K-1M", "$1M-10M", "$10M+"],
    category: "Business"
  },
  {
    label: "Company Size",
    type: "multiple_choice",
    required: false,
    options: ["Solo founder", "2-10 employees", "11-50 employees", "51-200 employees", "200+ employees"],
    category: "Business"
  },
  {
    label: "Biggest Business Challenges",
    type: "multiple_select",
    required: false,
    options: ["Engineering", "Marketing", "Sales", "Operations", "Fundraising", "Product"],
    category: "Business"
  },
  
  // Personal
  {
    label: "Location (City, Country)",
    type: "text",
    required: false,
    placeholder: "San Francisco, USA",
    category: "Personal"
  },
  {
    label: "How did you hear about us?",
    type: "multiple_choice",
    required: false,
    options: ["Social media", "Friend referral", "Search engine", "Newsletter", "Event", "Other"],
    category: "Personal"
  },
  {
    label: "What are you hoping to gain from this community?",
    type: "text",
    required: false,
    placeholder: "Share your goals and expectations...",
    category: "Personal"
  }
];

interface QuestionTemplatesProps {
  onAddQuestion: (question: FormQuestion) => void;
  usedQuestions: FormQuestion[];
}

export default function QuestionTemplates({ onAddQuestion, usedQuestions }: QuestionTemplatesProps) {
  const usedLabels = new Set(usedQuestions.map(q => q.label));
  
  const handleAddTemplate = (template: QuestionTemplate) => {
    const newQuestion: FormQuestion = {
      id: `question_${Date.now()}`,
      label: template.label,
      type: template.type,
      required: template.required,
      placeholder: template.placeholder,
      options: template.options,
    };
    
    onAddQuestion(newQuestion);
  };

  const categories = [...new Set(QUESTION_TEMPLATES.map(t => t.category))];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">Question Templates</h3>
        <p className="text-xs text-gray-500">Click to add pre-built questions to your form</p>
      </div>

      {categories.map(category => (
        <div key={category}>
          <h4 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
            {category}
          </h4>
          <div className="grid gap-2">
            {QUESTION_TEMPLATES
              .filter(template => template.category === category)
              .map((template, index) => {
                const isUsed = usedLabels.has(template.label);
                
                return (
                  <Card 
                    key={`${category}-${index}`}
                    className={`transition-all ${
                      isUsed 
                        ? 'opacity-50 bg-gray-50' 
                        : 'hover:shadow-md cursor-pointer bg-white'
                    }`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {template.label}
                            </p>
                            {template.required && (
                              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                Required
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {template.type === 'multiple_choice' ? 'Multiple Choice' :
                               template.type === 'multiple_select' ? 'Multiple Select' :
                               'Text'}
                            </Badge>
                            
                            {template.options && (
                              <span className="text-xs text-gray-500">
                                {template.options.length} options
                              </span>
                            )}
                          </div>
                          
                          {template.placeholder && (
                            <p className="text-xs text-gray-500 mt-1 italic">
                              &quot;{template.placeholder}&quot;
                            </p>
                          )}
                        </div>
                        
                        <Button
                          size="sm"
                          variant={isUsed ? "ghost" : "outline"}
                          disabled={isUsed}
                          onClick={() => !isUsed && handleAddTemplate(template)}
                          className="ml-2 flex-shrink-0"
                        >
                          {isUsed ? (
                            <span className="text-xs">Added</span>
                          ) : (
                            <>
                              <Plus className="w-3 h-3 mr-1" />
                              <span className="text-xs">Add</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}