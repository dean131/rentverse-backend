import { Router } from "express";
import authController from "./auth.controller.js";
import validate from "../../middleware/validate.middleware.js";
import { registerSchema, loginSchema } from "./auth.schema.js";

const router = Router();

/**
 * @swagger
 * tags:
 * name: Auth
 * description: Authentication endpoints
 */

/**
 * @swagger
 * /auth/register:
 * post:
 * summary: Register as Tenant or Landlord
 * tags: [Auth]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/RegisterInput'
 * responses:
 * 201:
 * description: User created
 */
router.post("/register", validate(registerSchema), authController.register);

/**
 * @swagger
 * /auth/login:
 * post:
 * summary: Login to get Access Token
 * tags: [Auth]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/LoginInput'
 * responses:
 * 200:
 * description: Success
 */
router.post("/login", validate(loginSchema), authController.login);

export default router;
