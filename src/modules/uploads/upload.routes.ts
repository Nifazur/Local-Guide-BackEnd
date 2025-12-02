import { Router } from 'express';
import * as uploadController from './upload.controller';
import upload from '../../middleware/upload';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/single', upload.single('image'), uploadController.uploadSingle);
router.post('/multiple', upload.array('images', 10), uploadController.uploadMultiple);
router.delete('/', uploadController.deleteFile);

export default router;