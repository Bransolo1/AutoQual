import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl as sign } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "sensehub",
    secretAccessKey: process.env.S3_SECRET_KEY || "sensehubstorage",
  },
  forcePathStyle: true,
});

export async function getSignedMediaUrl(storageKey: string) {
  const bucket = process.env.S3_BUCKET || "sensehub";
  const command = new GetObjectCommand({ Bucket: bucket, Key: storageKey });
  return sign(s3, command, { expiresIn: 3600 });
}

export async function getSignedUploadUrl(storageKey: string, contentType?: string) {
  const bucket = process.env.S3_BUCKET || "sensehub";
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: storageKey,
    ContentType: contentType,
  });
  return sign(s3, command, { expiresIn: 900 });
}

export async function putObject(storageKey: string, body: string | Buffer, contentType?: string) {
  const bucket = process.env.S3_BUCKET || "sensehub";
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: storageKey,
    Body: body,
    ContentType: contentType,
  });
  return s3.send(command);
}

export async function createMultipartUpload(storageKey: string, contentType?: string) {
  const bucket = process.env.S3_BUCKET || "sensehub";
  const command = new CreateMultipartUploadCommand({
    Bucket: bucket,
    Key: storageKey,
    ContentType: contentType,
  });
  const res = await s3.send(command);
  return { uploadId: res.UploadId as string, bucket, key: storageKey };
}

export async function getSignedPartUrl(
  storageKey: string,
  uploadId: string,
  partNumber: number
) {
  const bucket = process.env.S3_BUCKET || "sensehub";
  const command = new UploadPartCommand({
    Bucket: bucket,
    Key: storageKey,
    UploadId: uploadId,
    PartNumber: partNumber,
  });
  return sign(s3, command, { expiresIn: 900 });
}

export async function completeMultipartUpload(
  storageKey: string,
  uploadId: string,
  parts: { ETag: string; PartNumber: number }[]
) {
  const bucket = process.env.S3_BUCKET || "sensehub";
  const command = new CompleteMultipartUploadCommand({
    Bucket: bucket,
    Key: storageKey,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts },
  });
  return s3.send(command);
}
