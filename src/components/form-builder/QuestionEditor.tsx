'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Plus, GripVertical } from 'lucide-react';
import { FormQuestion } from '@/types';

interface QuestionEditorProps {
  question: FormQuestion;
  onUpdate: (question: FormQuestion) => void;
  onDelete: () => void;
  isFirst?: boolean;
  dragHandleProps?: Record<string, unknown>;
}

export default function QuestionEditor({ 
  question, 
  onUpdate, 
  onDelete, 
  isFirst = false,
  dragHandleProps 
}: QuestionEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleUpdate = (updates: Partial<FormQuestion>) => {
    onUpdate({ ...question, ...updates });
  };

  const addOption = () => {
    const newOptions = [...(question.options || []), ''];
    handleUpdate({ options: newOptions });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(question.options || [])];
    newOptions[index] = value;
    handleUpdate({ options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = [...(question.options || [])];
    newOptions.splice(index, 1);
    handleUpdate({ options: newOptions });
  };

  const needsOptions = question.type === 'multiple_choice' || question.type === 'multiple_select';

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader 
        className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div 
              {...dragHandleProps} 
              className={`cursor-grab hover:text-gray-600 transition-colors ${isFirst ? 'opacity-30 cursor-not-allowed' : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>
            
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-medium truncate">
                {question.label || 'Untitled Question'}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {question.type === 'multiple_choice' ? 'Multiple Choice' :
                   question.type === 'multiple_select' ? 'Multiple Select' :
                   'Text'}
                </Badge>
                {question.required && (
                  <Badge variant="secondary" className="text-xs">
                    Required
                  </Badge>
                )}
                {isFirst && (
                  <Badge className="text-xs bg-blue-100 text-blue-800">
                    Email (Required)
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isFirst && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Question Label */}
            <div>
              <Label htmlFor={`label-${question.id}`}>Question Text</Label>
              <Input
                id={`label-${question.id}`}
                value={question.label}
                onChange={(e) => handleUpdate({ label: e.target.value })}
                placeholder="Enter your question..."
                className="mt-1"
              />
            </div>

            {/* Question Type */}
            <div>
              <Label htmlFor={`type-${question.id}`}>Question Type</Label>
              <Select
                value={question.type}
                onValueChange={(value: 'text' | 'multiple_choice' | 'multiple_select') =>
                  handleUpdate({ type: value, options: value !== 'text' ? (question.options || ['']) : undefined })
                }
                disabled={isFirst}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text Input</SelectItem>
                  <SelectItem value="multiple_choice">Multiple Choice (Single Select)</SelectItem>
                  <SelectItem value="multiple_select">Multiple Select (Checkboxes)</SelectItem>
                </SelectContent>
              </Select>
              {isFirst && (
                <p className="text-xs text-gray-500 mt-1">
                  Email field type cannot be changed
                </p>
              )}
            </div>

            {/* Placeholder (for text questions) */}
            {question.type === 'text' && (
              <div>
                <Label htmlFor={`placeholder-${question.id}`}>Placeholder Text (Optional)</Label>
                <Input
                  id={`placeholder-${question.id}`}
                  value={question.placeholder || ''}
                  onChange={(e) => handleUpdate({ placeholder: e.target.value })}
                  placeholder="Enter placeholder text..."
                  className="mt-1"
                />
              </div>
            )}

            {/* Options (for multiple choice/select questions) */}
            {needsOptions && (
              <div>
                <Label>Answer Options</Label>
                <div className="mt-2 space-y-2">
                  {(question.options || []).map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(index)}
                        disabled={(question.options?.length || 0) <= 1}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              </div>
            )}

            {/* Required Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor={`required-${question.id}`}>Required Question</Label>
                <p className="text-sm text-gray-500">Applicants must answer this question</p>
              </div>
              <Switch
                id={`required-${question.id}`}
                checked={question.required}
                onCheckedChange={(checked) => handleUpdate({ required: checked })}
                disabled={isFirst}
              />
            </div>
            {isFirst && (
              <p className="text-xs text-gray-500">
                Email field is always required
              </p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}