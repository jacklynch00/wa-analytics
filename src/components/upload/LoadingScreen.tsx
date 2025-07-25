'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';

interface LoadingStep {
  label: string;
  completed: boolean;
}

const initialSteps: LoadingStep[] = [
  { label: 'Uploading file...', completed: false },
  { label: 'Parsing chat messages...', completed: false },
  { label: 'Analyzing member activity...', completed: false },
  { label: 'Extracting resources...', completed: false },
  { label: 'Generating AI insights...', completed: false },
];

interface LoadingScreenProps {
  onComplete: () => void;
  progress?: number;
  currentStep?: string;
}

export default function LoadingScreen({ onComplete, progress: externalProgress, currentStep: externalCurrentStep }: LoadingScreenProps) {
  const [steps, setSteps] = useState(initialSteps);
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (externalProgress !== undefined) {
      setProgress(externalProgress);
      if (externalProgress >= 100) {
        setTimeout(onComplete, 500);
      }
    } else {
      // Fallback to simulated progress if no external progress provided
      const totalDuration = 15000; // 15 seconds
      const stepDuration = totalDuration / steps.length;
      
      steps.forEach((_, index) => {
        setTimeout(() => {
          setCurrentStepIndex(index);
          setSteps(prev => prev.map((step, i) => ({
            ...step,
            completed: i < index
          })));
          
          const stepProgress = ((index + 1) / steps.length) * 100;
          setProgress(stepProgress);
          
          if (index === steps.length - 1) {
            setTimeout(onComplete, 1000);
          }
        }, index * stepDuration);
      });
    }
  }, [onComplete, externalProgress, steps.length]);

  useEffect(() => {
    if (externalCurrentStep) {
      const stepIndex = initialSteps.findIndex(step => 
        step.label.toLowerCase().includes(externalCurrentStep.toLowerCase())
      );
      if (stepIndex !== -1) {
        setCurrentStepIndex(stepIndex);
        setSteps(prev => prev.map((step, i) => ({
          ...step,
          completed: i < stepIndex
        })));
      }
    }
  }, [externalCurrentStep]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Analyzing Your Chat
              </h2>
              <p className="text-gray-600 text-sm">
                This may take 30-60 seconds depending on chat size
              </p>
            </div>

            <div className="space-y-4">
              <Progress value={progress} className="w-full" />
              
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 text-sm ${
                      step.completed
                        ? 'text-green-600'
                        : index === currentStepIndex
                        ? 'text-blue-600'
                        : 'text-gray-400'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      step.completed
                        ? 'bg-green-600'
                        : index === currentStepIndex
                        ? 'bg-blue-600 animate-pulse'
                        : 'bg-gray-300'
                    }`} />
                    <span>{step.label}</span>
                    {step.completed && (
                      <span className="text-green-600">✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              <strong>Estimated time:</strong> 30-60s
              <br />
              <span className="text-xs">AI analysis may take longer for large chats</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}