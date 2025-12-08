import { Router } from "express";
import chatController from "./chat.controller.js";
import { verifyToken } from "../../middleware/auth.middleware.js";
import validate from "../../middleware/validate.middleware.js";
import { startChatSchema } from "./chat.schema.js";

const router = Router();

router.use(verifyToken); // All routes require login

// Start new chat (or get existing)
router.post(
  "/start", 
  validate(startChatSchema), 
  chatController.start
);

// Get list of conversations
router.get("/", chatController.list);

// Get messages history
// Note: Cursor/limit params are optional, so we skip strict query validation here for simplicity
// or you can add `validate(getMessagesSchema, 'query')` if you extend your middleware.
router.get("/:roomId/messages", chatController.messages);

export default router;