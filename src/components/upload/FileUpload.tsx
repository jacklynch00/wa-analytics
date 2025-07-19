'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export default function FileUpload({ onFileSelect }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const validateFile = (file: File): boolean => {
    if (!file.name.endsWith('.txt')) {
      setError('Please upload a .txt file (WhatsApp export)');
      return false;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      onFileSelect(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <div className="app-container py-12">
      <div className="text-center mb-8">
        <h1 className="page-title text-center">
          WhatsApp Community Analytics
        </h1>
        <p className="text-lg text-[var(--text-secondary)] mb-2 leading-7">
          Upload your WhatsApp group chat export to gain insights into member engagement and community activity
        </p>
        <p className="metric-neutral">
          Supports standard WhatsApp export format (.txt files)
        </p>
      </div>

      <Card className={`border-2 border-dashed transition-colors max-w-2xl mx-auto ${
        isDragging ? 'border-[var(--brand)] bg-[var(--tag-nutrition-bg)]' : 'border-[var(--border)]'
      }`}>
        <CardContent
          className="p-12 text-center"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className={`p-4 rounded-full ${
              isDragging ? 'bg-[var(--tag-nutrition-bg)]' : 'bg-[var(--card-hover-bg)]'
            }`}>
              <Upload className={`w-8 h-8 ${
                isDragging ? 'text-[var(--brand)]' : 'text-[var(--neutral)]'
              }`} />
            </div>
            
            <div>
              <h3 className="section-title text-center mb-2">
                Drop your WhatsApp export here
              </h3>
              <p className="text-[var(--text-secondary)] mb-4">
                or click to browse files
              </p>
            </div>

            <input
              type="file"
              accept=".txt"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            
            <Button asChild className="cursor-pointer">
              <label htmlFor="file-upload">
                <FileText className="w-4 h-4 mr-2" />
                Select File
              </label>
            </Button>

            {error && (
              <div className="flex items-center space-x-2 text-[var(--warning)] bg-[var(--tag-security-bg)] border border-[var(--tag-security-border)] p-3 rounded-[var(--radius-large)]">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 space-y-6 max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-5">
            <h3 className="section-title">How to export your WhatsApp chat:</h3>
            <ol className="list-decimal list-inside space-y-2 text-[var(--text-secondary)] text-sm leading-6">
              <li>Open your WhatsApp group chat</li>
              <li>Tap the group name at the top</li>
              <li>Scroll down and tap &ldquo;Export Chat&rdquo;</li>
              <li>Choose &ldquo;Without Media&rdquo; for faster processing</li>
              <li>Save the .txt file and upload it here</li>
            </ol>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-5">
            <h4 className="card-title mb-2">Expected format:</h4>
            <code className="text-xs text-[var(--text-secondary)] block bg-[var(--card-hover-bg)] p-3 rounded-[var(--radius-small)] font-mono">
              [MM/DD/YY, HH:MM:SS AM/PM] Name: Message content
            </code>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}