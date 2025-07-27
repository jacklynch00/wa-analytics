'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Mail } from 'lucide-react';
import { ApplicationFormData } from '@/types';

interface SubmissionSuccessProps {
  form: ApplicationFormData;
}

export default function SubmissionSuccess({ form }: SubmissionSuccessProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Card className="w-full max-w-2xl bg-white/70 backdrop-blur-sm border-white/60 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Application Submitted Successfully!
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-6">
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-gray-800">
              Thank you for applying to {form.title}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Your application has been received and will be reviewed by our team.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-blue-900">What happens next?</h4>
            </div>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• You&apos;ll receive a confirmation email shortly</p>
              <p>• Our team will review your application</p>
              <p>• You&apos;ll be notified of the decision via email</p>
              {form.whatsappInviteUrl && (
                <p>• If accepted, you&apos;ll receive a WhatsApp group invitation</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <strong>Important:</strong> Please check your email (including spam folder) for updates on your application status.
            </p>
            <p className="text-xs text-gray-500">
              If you don&apos;t hear back within a reasonable time, feel free to reach out to the community administrators.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-400">
              Submission completed • Form: {form.customSlug}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}