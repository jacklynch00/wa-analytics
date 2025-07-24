import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateSignedDownloadUrl } from '@/lib/storage-secure';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { key } = await params;
    const fileKey = decodeURIComponent(key);

    // Generate a signed URL for the file (expires in 1 hour)
    const signedUrl = await generateSignedDownloadUrl(fileKey, userId, 3600);

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrl);

  } catch (error) {
    console.error('File access error:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: 'Failed to access file' },
      { status: 500 }
    );
  }
}