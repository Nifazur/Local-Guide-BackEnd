import { Request, Response } from 'express';
import * as uploadService from './upload.service';
import asyncHandler from '../../utils/asyncHandler';
import ApiResponse from '../../utils/ApiResponse';

export const uploadSingle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No file provided' });
    return;
  }

  const result = await uploadService.uploadSingle(req.file, 'local-guide');

  res.status(200).json(ApiResponse.success(result, 'File uploaded successfully'));
});

export const uploadMultiple = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    res.status(400).json({ success: false, message: 'No files provided' });
    return;
  }

  const results = await uploadService.uploadMultiple(req.files as Express.Multer.File[], 'local-guide');

  res.status(200).json(ApiResponse.success(results, 'Files uploaded successfully'));
});

export const deleteFile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await uploadService.deleteFile(req.body.publicId);

  res.status(200).json(ApiResponse.success(null, 'File deleted successfully'));
});