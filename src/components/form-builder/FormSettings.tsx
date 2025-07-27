'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ApplicationFormData } from '@/types';

interface FormSettingsProps {
  form: ApplicationFormData;
  onUpdate: (updates: Partial<ApplicationFormData>) => void;
}

export default function FormSettings({ form, onUpdate }: FormSettingsProps) {

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Form Title</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Join Our Community"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={form.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Tell applicants about your community..."
            className="mt-1"
            rows={3}
          />
        </div>
      </div>

      {/* WhatsApp Integration */}
      <div>
        <Label htmlFor="whatsappInviteUrl">
          WhatsApp Invite Link <span className="text-red-500">*</span>
        </Label>
        <Input
          id="whatsappInviteUrl"
          value={form.whatsappInviteUrl || ''}
          onChange={(e) => onUpdate({ whatsappInviteUrl: e.target.value })}
          placeholder="https://chat.whatsapp.com/..."
          className="mt-1"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          This link will be sent to accepted applicants
        </p>
      </div>

      {/* Privacy Settings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="isActive">Form Active</Label>
            <p className="text-sm text-gray-500">Allow new applications</p>
          </div>
          <Switch
            id="isActive"
            checked={form.isActive}
            onCheckedChange={(checked) => onUpdate({ isActive: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="isPublic">Public Form</Label>
            <p className="text-sm text-gray-500">Form visible to everyone</p>
          </div>
          <Switch
            id="isPublic"
            checked={form.isPublic}
            onCheckedChange={(checked) => onUpdate({ isPublic: checked })}
          />
        </div>

        {!form.isPublic && (
          <div>
            <Label htmlFor="password">Access Password</Label>
            <Input
              id="password"
              type="password"
              value={form.password || ''}
              onChange={(e) => onUpdate({ password: e.target.value })}
              placeholder="Enter password for private access"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to disable password protection
            </p>
          </div>
        )}
      </div>

      {/* Email Messages */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="acceptanceMessage">Custom Acceptance Message (Optional)</Label>
          <Textarea
            id="acceptanceMessage"
            value={form.acceptanceMessage || ''}
            onChange={(e) => onUpdate({ acceptanceMessage: e.target.value })}
            placeholder="Welcome to our community! We're excited to have you..."
            className="mt-1"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="denialMessage">Custom Denial Message (Optional)</Label>
          <Textarea
            id="denialMessage"
            value={form.denialMessage || ''}
            onChange={(e) => onUpdate({ denialMessage: e.target.value })}
            placeholder="Thank you for your interest. Unfortunately..."
            className="mt-1"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}