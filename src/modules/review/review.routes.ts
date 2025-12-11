import { Router } from "express";
import reviewController from "./review.controller.js";
import { verifyToken } from "../../middleware/auth.middleware.js";
import validate from "../../middleware/validate.middleware.js";
import { createReviewSchema } from "./review.schema.js";

const router = Router();

// Submit Review (Protected)
router.post(
  "/",
  verifyToken,
  validate(createReviewSchema),
  reviewController.create
);

// Get Property Reviews (Public)
router.get(
  "/property/:propertyId",
  reviewController.listByProperty
);

export default router;