import { type Router as RouterType, Router } from "express";
import * as chatController from "../controllers/chat.controller.js";

const router: RouterType = Router();

router.get("/sessions/:sessionId/messages", chatController.getSessionMessages);
router.post("/sessions/:sessionId/messages", chatController.sendMessage);
router.post("/tickets/:ticketId/resolve", chatController.resolveAndFeedback);

export default router;
