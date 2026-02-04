import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
});

export async function uploadToPHIBucket(
  bucket: string,
  key: string,
  body: Buffer | string,
  contentType: string = "application/octet-stream",
): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ServerSideEncryption: "aws:kms",
    }),
  );
  return key;
}

export async function getPresignedDownloadURL(
  bucket: string,
  key: string,
  expiresIn: number = 300,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  return await getSignedUrl(s3Client, command, { expiresIn });
}
