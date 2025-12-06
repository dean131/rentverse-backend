import { Router } from "express";
import kycController from "./kyc.controller.js";
import upload from "../../middleware/upload.middleware.js";
import { verifyToken } from "../../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/submit",
  verifyToken,
  upload.fields([
    { name: "ktp", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
  ]),
  kycController.submit
);

export default router;
