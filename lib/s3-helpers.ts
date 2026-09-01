// src/lib/s3-helpers.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  endpoint: process.env.LIARA_ENDPOINT,
  region: "default",
  credentials: {
    accessKeyId: process.env.LIARA_ACCESS_KEY || "",
    secretAccessKey: process.env.LIARA_SECRET_KEY || "",
  },
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.LIARA_BUCKET_NAME || "";
const PUBLIC_URL = process.env.LIARA_PUBLIC_URL || "";

export async function uploadBufferToS3(
  buffer: Buffer,
  folder: string = "products",
  fileName?: string
): Promise<string | null> {
  try {
    const uniqueName = fileName || `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.jpg`;
    const key = `${folder}/${uniqueName}`;

    console.log(`📤 Uploading to S3: ${key}`);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: 'image/jpeg',
      // ❌ حذف ACL چون پارس‌پک ممکنه پشتیبانی نکنه
      CacheControl: 'public, max-age=31536000',
    });

    await s3Client.send(command);

    const url = `${PUBLIC_URL}/${key}`;
    console.log(`✅ S3 URL: ${url}`);

    return url;
  } catch (error) {
    console.error("❌ Error uploading:", error);
    return null;
  }
}

export async function uploadFileToS3(
  file: File | Buffer,
  folder: string = "products",
  fileName?: string
): Promise<string | null> {
  try {
    const buffer = file instanceof File 
      ? Buffer.from(await file.arrayBuffer()) 
      : file;
    
    const fileExt = file instanceof File 
      ? file.name.split('.').pop() || 'jpg' 
      : 'jpg';
    
    const uniqueName = fileName || `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const key = `${folder}/${uniqueName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file instanceof File ? file.type : 'image/jpeg',
      // ❌ حذف ACL
      CacheControl: 'public, max-age=31536000',
    });

    await s3Client.send(command);

    const url = `${PUBLIC_URL}/${key}`;
    console.log(`✅ S3 URL: ${url}`);

    return url;
  } catch (error) {
    console.error("❌ Error uploading:", error);
    return null;
  }
}

export async function deleteFileFromS3(key: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error("Error deleting from S3:", error);
    return false;
  }
}

export function getKeyFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1);
  } catch {
    return url;
  }
}