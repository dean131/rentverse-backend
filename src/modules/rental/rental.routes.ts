import { Router } from 'express';
import rentalController from './rental.controller.js';

const router = Router();

// Public Reference Routes
router.get('/references', rentalController.getReferences);

export default router;