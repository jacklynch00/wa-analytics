import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getFileStream } from '@/lib/storage-secure';

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
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
    const fileKey = decodeURIComponent(params.key);

    // Get file stream with user validation
    const fileStream = await getFileStream(fileKey, userId);
    
    if (!fileStream) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Convert stream to response
    const chunks: Uint8Array[] = [];
    const reader = fileStream.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const fileBuffer = Buffer.concat(chunks);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment',
        'Cache-Control': 'private, no-cache',
      },
    });

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