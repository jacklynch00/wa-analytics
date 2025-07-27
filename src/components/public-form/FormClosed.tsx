'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { ApplicationFormData } from '@/types';

interface FormClosedProps {
  form: ApplicationFormData;
}

export default function FormClosed({ form }: FormClosedProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Card className="w-full max-w-2xl bg-white/70 backdrop-blur-sm border-white/60 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-gray-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Application Form Closed
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-gray-800">
              {form.title}
            </h3>
            {form.description && (
              <p className="text-gray-600 leading-relaxed">
                {form.description}
              </p>
            )}
          </div>

          <div className="py-6">
            <p className="text-lg text-gray-700 mb-2">
              This application form is currently not accepting new submissions.
            </p>
            <p className="text-sm text-gray-500">
              The community administrators have temporarily closed applications. 
              Please check back later or contact the community directly for more information.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-400">
              Form ID: {form.customSlug}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}