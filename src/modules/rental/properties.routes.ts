import { Router } from "express";
import propertiesController from "./properties.controller.js";
import upload from "../../middleware/upload.middleware.js";
import validate from "../../middleware/validate.middleware.js";
import {
  createPropertySchema,
  updatePropertySchema,
} from "./properties.schema.js";
import { verifyToken, requireRole } from "../../middleware/auth.middleware.js";

const router = Router();

// Public
router.get("/", propertiesController.getAll);
router.get("/:id", propertiesController.getOne);

// Protected (Landlord)
router.use(verifyToken, requireRole("LANDLORD")); // Guard below routes

// Create
router.post(
  "/",
  upload.array("images", 10),
  validate(createPropertySchema),
  propertiesController.create
);

//  Update (Metadata)
// We use upload.none() to parse multipart fields if sent as form-data,
// OR just JSON body if sent as raw JSON.
router.patch(
  "/:id",
  upload.none(),
  validate(updatePropertySchema),
  propertiesController.update
);

//  Delete
router.delete("/:id", propertiesController.delete);

export default router;
