import { Router } from "express";
import authController from "./auth.controller.js";
import validate from "../../middleware/validate.middleware.js";
import { verifyToken } from "../../middleware/auth.middleware.js";
import { sendOtpSchema, verifyOtpSchema } from "./auth.schema.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
} from "./auth.schema.js";

const router = Router();

// Public Routes
router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/refresh", validate(refreshTokenSchema), authController.refresh);
router.post("/logout", authController.logout); // Optional validation

// Protected Routes
router.get("/me", verifyToken, authController.getMe);
router.put(
  "/profile",
  verifyToken,
  validate(updateProfileSchema),
  authController.updateProfile
);

// [NEW] OTP Routes
router.post(
  "/otp/send",
  validate(sendOtpSchema),
  authController.sendOtp
);

router.post(
  "/otp/verify",
  validate(verifyOtpSchema),
  authController.verifyOtp
);

export default router;
