import { NextRequest, NextResponse } from 'next/server';
import { applicationFormService } from '@/lib/application-forms';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    // Get the form by slug
    const form = await applicationFormService.getFormBySlug(slug);
    
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Check if form is public (no password needed)
    if (form.isPublic) {
      return NextResponse.json({ success: true });
    }

    // Check if form has password protection
    if (!form.password) {
      return NextResponse.json({ error: 'This form does not require a password' }, { status: 400 });
    }

    // Verify password
    if (password !== form.password) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying password:', error);
    return NextResponse.json({ error: 'Failed to verify password' }, { status: 500 });
  }
}