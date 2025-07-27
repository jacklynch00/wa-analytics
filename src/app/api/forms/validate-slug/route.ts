import { NextRequest, NextResponse } from 'next/server';
import { applicationFormService } from '@/lib/application-forms';

export async function POST(request: NextRequest) {
  try {
    const { slug, excludeFormId } = await request.json();

    if (!slug) {
      return NextResponse.json({ 
        valid: false, 
        message: 'Slug is required' 
      }, { status: 400 });
    }

    const isValid = await applicationFormService.validateSlug(slug, excludeFormId);

    if (isValid) {
      return NextResponse.json({ valid: true });
    } else {
      return NextResponse.json({ 
        valid: false, 
        message: 'This URL is not available' 
      });
    }
  } catch (error) {
    console.error('Error validating slug:', error);
    return NextResponse.json({ 
      valid: false, 
      message: 'Failed to validate URL' 
    }, { status: 500 });
  }
}