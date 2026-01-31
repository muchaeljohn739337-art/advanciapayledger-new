import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT || 'nyc3.digitaloceanspaces.com');

export const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET,
  region: process.env.DO_SPACES_REGION || 'nyc3'
});

export const uploadToSpaces = async (
  file: Express.Multer.File,
  folder: string = 'uploads'
): Promise<string> => {
  const fileName = `${folder}/${Date.now()}-${file.originalname}`;
  const bucketName = process.env.DO_SPACES_BUCKET || 'advancia-payledger';

  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: file.buffer,
    ACL: 'public-read',
    ContentType: file.mimetype
  };

  try {
    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    console.error('Error uploading to Digital Ocean Spaces:', error);
    throw new Error('Failed to upload file');
  }
};

export const deleteFromSpaces = async (fileUrl: string): Promise<void> => {
  const bucketName = process.env.DO_SPACES_BUCKET || 'advancia-payledger';
  const key = fileUrl.split('.com/')[1];

  const params = {
    Bucket: bucketName,
    Key: key
  };

  try {
    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('Error deleting from Digital Ocean Spaces:', error);
    throw new Error('Failed to delete file');
  }
};

export default s3;
