import { Router } from 'express';
import propertiesController from './properties.controller.js';
import upload from '../../middleware/upload.middleware.js';
import validate from '../../middleware/validate.middleware.js';
import { createPropertySchema } from './properties.schema.js';
import { verifyToken, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

/**
 * PUBLIC ROUTES
 * Anyone can search and view properties.
 */
router.get('/', propertiesController.getAll);
router.get('/:id', propertiesController.getOne);

/**
 * PROTECTED ROUTES (LANDLORD ONLY)
 * Only Verified Landlords can create listings.
 */
router.post(
  '/', 
  verifyToken, 
  requireRole('LANDLORD'), 
  upload.array('images', 10), // Allow up to 10 images
  validate(createPropertySchema), 
  propertiesController.create
);

export default router;