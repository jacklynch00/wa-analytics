'use client';

import { useState } from 'react';
import { Button } from './button';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
  text: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
}

export function CopyButton({ 
  text, 
  className, 
  variant = 'outline', 
  size = 'sm',
  showText = false 
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn(
        'transition-all duration-200',
        copied && 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
        className
      )}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          {showText && <span className="ml-2">Copied!</span>}
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          {showText && <span className="ml-2">Copy</span>}
        </>
      )}
    </Button>
  );
}

export function CopyText({ 
  text, 
  displayText, 
  className 
}: { 
  text: string; 
  displayText?: string; 
  className?: string; 
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'group inline-flex items-center space-x-2 text-sm font-mono bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md transition-colors',
        copied && 'bg-green-100 text-green-700',
        className
      )}
    >
      <span className="truncate">{displayText || text}</span>
      {copied ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : (
        <Copy className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
      )}
    </button>
  );
}