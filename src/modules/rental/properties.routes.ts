import { Router } from 'express';
import propertiesController from './properties.controller.js';
import upload from '../../middleware/upload.middleware.js';
import validate from '../../middleware/validate.middleware.js';
import { createPropertySchema } from './properties.schema.js';
import { verifyToken, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// Protected Route: Only Landlords can create
router.post(
  '/', 
  verifyToken, 
  requireRole('LANDLORD'), 
  upload.array('images', 5), // Max 5 images
  validate(createPropertySchema), 
  propertiesController.create
);

export default router;