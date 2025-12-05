import { Router } from "express";
import notificationController from "./notification.controller.js";
import validate from "../../middleware/validate.middleware.js";
import { verifyToken } from "../../middleware/auth.middleware.js";
import { registerDeviceSchema } from "./notification.schema.js";

const router = Router();

// Endpoint: POST /api/v1/notifications/device
router.post(
  "/device",
  verifyToken,
  validate(registerDeviceSchema),
  notificationController.registerDevice
);

export default router;