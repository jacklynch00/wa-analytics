import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

const s3Client = new S3Client({
  region: "auto", // For Cloudflare R2
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadFile(
  file: Buffer,
  key: string,
  contentType: string = 'application/octet-stream'
): Promise<string> {
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: file,
      ContentType: contentType,
    },
  });

  await upload.done();
  
  // Return the public URL if available, otherwise construct it
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (publicUrl) {
    return `${publicUrl}/${key}`;
  }
  
  return `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}/${key}`;
}

export async function deleteFile(key: string): Promise<void> {
  const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
  
  await s3Client.send(new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  }));
}