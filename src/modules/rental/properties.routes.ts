import { Router } from 'express';
import propertiesController from './properties.controller.js';
import upload from '../../middleware/upload.middleware.js';
import validate from '../../middleware/validate.middleware.js';
import { createPropertySchema } from './properties.schema.js';
import { verifyToken, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// ==========================
// PUBLIC ROUTES (Search)
// ==========================
router.get('/', propertiesController.getAll);
router.get('/:id', propertiesController.getOne);

// ==========================
// PROTECTED ROUTES (Landlord)
// ==========================
router.post(
  '/', 
  verifyToken, 
  requireRole('LANDLORD'), 
  upload.array('images', 5), 
  validate(createPropertySchema), 
  propertiesController.create
);

export default router;