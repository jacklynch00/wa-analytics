'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Library } from 'lucide-react';
import { FormQuestion } from '@/types';
import QuestionEditor from './QuestionEditor';
import QuestionTemplates from './QuestionTemplates';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableQuestionProps {
  question: FormQuestion;
  onUpdate: (question: FormQuestion) => void;
  onDelete: () => void;
  isFirst?: boolean;
}

function SortableQuestion({ question, onUpdate, onDelete, isFirst }: SortableQuestionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id, disabled: isFirst });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <QuestionEditor
        question={question}
        onUpdate={onUpdate}
        onDelete={onDelete}
        isFirst={isFirst}
        dragHandleProps={{
          ...attributes,
          ...listeners,
        }}
      />
    </div>
  );
}

interface QuestionBuilderProps {
  questions: FormQuestion[];
  onUpdate: (questions: FormQuestion[]) => void;
}

export default function QuestionBuilder({ questions, onUpdate }: QuestionBuilderProps) {
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addCustomQuestion = () => {
    if (questions.length >= 12) {
      return;
    }

    const newQuestion: FormQuestion = {
      id: `question_${Date.now()}`,
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
    };

    onUpdate([...questions, newQuestion]);
  };

  const addTemplateQuestion = (question: FormQuestion) => {
    if (questions.length >= 12) {
      return;
    }

    onUpdate([...questions, question]);
    setShowTemplatesModal(false); // Close modal after adding
  };

  const updateQuestion = (index: number, updatedQuestion: FormQuestion) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    onUpdate(newQuestions);
  };

  const deleteQuestion = (index: number) => {
    if (index === 0) return; // Cannot delete the email question
    
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    onUpdate(newQuestions);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      const oldIndex = questions.findIndex(q => q.id === active.id);
      const newIndex = questions.findIndex(q => q.id === over?.id);

      // Don't allow moving the first question (email question)
      if (oldIndex === 0) return;

      // Don't allow moving any question to replace the email question (position 0)
      if (newIndex === 0) return;

      // Allow moving between all other positions (1, 2, 3, etc.)
      if (oldIndex !== newIndex && oldIndex >= 0 && newIndex >= 0) {
        onUpdate(arrayMove(questions, oldIndex, newIndex));
      }
    }
  };

  const isAtLimit = questions.length >= 12;

  return (
    <div className="space-y-4">
      {/* Questions List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={questions.map(q => q.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {questions.map((question, index) => (
              <SortableQuestion
                key={question.id}
                question={question}
                onUpdate={(updatedQuestion) => updateQuestion(index, updatedQuestion)}
                onDelete={() => deleteQuestion(index)}
                isFirst={index === 0}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add Question Actions */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={addCustomQuestion}
            disabled={isAtLimit}
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Question
          </Button>
          
          <Dialog open={showTemplatesModal} onOpenChange={setShowTemplatesModal}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                disabled={isAtLimit}
                className="flex-1"
              >
                <Library className="w-4 h-4 mr-2" />
                Browse Templates
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Question Templates</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <QuestionTemplates
                  onAddQuestion={addTemplateQuestion}
                  usedQuestions={questions}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isAtLimit && (
          <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              You've reached the maximum of 12 questions per form. Remove a question to add a new one.
            </p>
          </div>
        )}
      </div>

      {/* Form Stats */}
      <div className="text-center pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          {questions.length} of 12 questions used • {questions.filter(q => q.required).length} required
        </p>
      </div>
    </div>
  );
}