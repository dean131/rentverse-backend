import { Router } from "express";
import notificationController from "./notification.controller.js";
import validate from "../../middleware/validate.middleware.js";
import { verifyToken } from "../../middleware/auth.middleware.js";
import { registerDeviceSchema } from "./notification.schema.js";

const router = Router();

router.use(verifyToken); // Guard all routes

router.post(
  "/device",
  validate(registerDeviceSchema),
  notificationController.registerDevice
);

// History
router.get("/", notificationController.list);
router.patch("/:id/read", notificationController.markRead);

export default router;
