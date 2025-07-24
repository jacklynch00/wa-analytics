import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;

/**
 * Generate a secure, non-predictable file key for user files
 */
export function generateSecureFileKey(userId: string, filename: string): string {
  const uuid = randomUUID();
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `users/${userId}/uploads/${uuid}-${timestamp}-${sanitizedFilename}`;
}

/**
 * Upload file with secure key generation
 */
export async function uploadFileSecurely(
  file: Buffer, 
  userId: string, 
  filename: string,
  contentType: string = 'text/plain'
): Promise<string> {
  const key = generateSecureFileKey(userId, filename);
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
    Metadata: {
      'uploaded-by': userId,
      'original-filename': filename,
      'upload-timestamp': Date.now().toString(),
    },
  });

  await s3Client.send(command);
  return key;
}

/**
 * Generate a signed URL for temporary file access (expires in 1 hour)
 */
export async function generateSignedDownloadUrl(
  fileKey: string, 
  userId: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string> {
  // Verify the file belongs to the user
  if (!fileKey.includes(`users/${userId}/`)) {
    throw new Error('Unauthorized: File does not belong to user');
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Get file stream for server-side serving
 */
export async function getFileStream(fileKey: string, userId: string) {
  // Verify the file belongs to the user
  if (!fileKey.includes(`users/${userId}/`)) {
    throw new Error('Unauthorized: File does not belong to user');
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
  });

  const response = await s3Client.send(command);
  return response.Body;
}