import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

// Digital Ocean Spaces configuration
const spacesClient = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com',
  region: process.env.DO_SPACES_REGION || 'nyc3',
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY || '',
    secretAccessKey: process.env.DO_SPACES_SECRET || '',
  },
});

const BUCKET_NAME = process.env.DO_SPACES_BUCKET || 'advancia-payledger';

export async function uploadToSpaces(
  file: Express.Multer.File,
  folder: string = 'uploads'
): Promise<string> {
  const fileName = `${folder}/${Date.now()}-${file.originalname}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ACL: 'public-read',
    ContentType: file.mimetype,
  });

  try {
    await spacesClient.send(command);
    const fileUrl = `${process.env.DO_SPACES_ENDPOINT}/${BUCKET_NAME}/${fileName}`;
    return fileUrl;
  } catch (error) {
    console.error('Error uploading to Spaces:', error);
    throw new Error('Failed to upload file to Digital Ocean Spaces');
  }
}

export async function deleteFromSpaces(fileUrl: string): Promise<void> {
  try {
    // Extract the key from the URL
    const url = new URL(fileUrl);
    const key = url.pathname.split(`/${BUCKET_NAME}/`)[1];

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await spacesClient.send(command);
  } catch (error) {
    console.error('Error deleting from Spaces:', error);
    throw new Error('Failed to delete file from Digital Ocean Spaces');
  }
}
