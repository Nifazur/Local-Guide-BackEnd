import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import config from './index';
import { ICloudinaryResult } from '../types';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export const uploadToCloudinary = async (
  filePath: string,
  folder: string = 'local-guide'
): Promise<ICloudinaryResult> => {
  try {
    const result: UploadApiResponse = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto',
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    const err = error as Error;
    throw new Error(`Cloudinary upload failed: ${err.message}`);
  }
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    const err = error as Error;
    throw new Error(`Cloudinary delete failed: ${err.message}`);
  }
};

export { cloudinary };