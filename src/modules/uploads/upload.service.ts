import fs from 'fs';
import path from 'path';
import { uploadToCloudinary, deleteFromCloudinary } from '../../config/cloudinary';
import ApiError from '../../utils/ApiError';
import { ICloudinaryResult } from '../../types';

export const uploadSingle = async (
  file: Express.Multer.File,
  folder: string = 'local-guide'
): Promise<ICloudinaryResult> => {
  if (!file) {
    throw ApiError.badRequest('No file provided');
  }

  try {
    // Create temp file path
    const tempPath = path.join('uploads', `temp-${Date.now()}-${file.originalname}`);

    // Write buffer to temp file
    fs.writeFileSync(tempPath, file.buffer);

    // Upload to Cloudinary
    const result = await uploadToCloudinary(tempPath, folder);

    // Clean up temp file
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }

    return result;
  } catch (error) {
    const err = error as Error;
    throw ApiError.internal(`Upload failed: ${err.message}`);
  }
};

export const uploadMultiple = async (
  files: Express.Multer.File[],
  folder: string = 'local-guide'
): Promise<ICloudinaryResult[]> => {
  if (!files || files.length === 0) {
    throw ApiError.badRequest('No files provided');
  }

  const uploadPromises = files.map((file) => uploadSingle(file, folder));
  const results = await Promise.all(uploadPromises);

  return results;
};

export const deleteFile = async (publicId: string): Promise<boolean> => {
  if (!publicId) {
    throw ApiError.badRequest('No public ID provided');
  }

  try {
    await deleteFromCloudinary(publicId);
    return true;
  } catch (error) {
    const err = error as Error;
    throw ApiError.internal(`Delete failed: ${err.message}`);
  }
};