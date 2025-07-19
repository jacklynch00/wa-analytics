'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';

interface LoadingStep {
  label: string;
  duration: number;
}

const steps: LoadingStep[] = [
  { label: 'Parsing chat messages...', duration: 2000 },
  { label: 'Identifying members...', duration: 1500 },
  { label: 'Analyzing resources...', duration: 2000 },
  { label: 'Generating AI insights...', duration: 8000 },
];

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let totalDuration = 0;
    let currentDuration = 0;

    steps.forEach((step, index) => {
      totalDuration += step.duration;
      
      setTimeout(() => {
        setCurrentStep(index);
        
        const stepInterval = setInterval(() => {
          currentDuration += 100;
          const newProgress = (currentDuration / totalDuration) * 100;
          setProgress(Math.min(newProgress, 100));
          
          if (currentDuration >= totalDuration) {
            clearInterval(stepInterval);
            setTimeout(onComplete, 500);
          }
        }, 100);
        
        return () => clearInterval(stepInterval);
      }, currentDuration);
      
      currentDuration += step.duration;
    });
  }, [onComplete]);

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
                      index < currentStep
                        ? 'text-green-600'
                        : index === currentStep
                        ? 'text-blue-600'
                        : 'text-gray-400'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      index < currentStep
                        ? 'bg-green-600'
                        : index === currentStep
                        ? 'bg-blue-600 animate-pulse'
                        : 'bg-gray-300'
                    }`} />
                    <span>{step.label}</span>
                    {index < currentStep && (
                      <span className="text-green-600">✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              <strong>Estimated time:</strong> {Math.ceil((steps.reduce((acc, step) => acc + step.duration, 0)) / 1000)}s
              <br />
              <span className="text-xs">AI analysis may take longer for large chats</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}