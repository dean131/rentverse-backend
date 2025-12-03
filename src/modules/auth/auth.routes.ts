import { Router } from "express";
import authController from "./auth.controller.js";
import validate from "../../middleware/validate.middleware.js";
import { verifyToken } from '../../middleware/auth.middleware.js';
import { registerSchema, loginSchema, updateProfileSchema } from "./auth.schema.js";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.get("/me", verifyToken, authController.getMe);
router.put('/profile', verifyToken, validate(updateProfileSchema), authController.updateProfile);

export default router;
