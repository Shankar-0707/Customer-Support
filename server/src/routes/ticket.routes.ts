import { type Router as RouterType, Router } from "express";
import * as ticketController from "../controllers/ticket.controller.js";

const router: RouterType = Router();

router.get("/", ticketController.list);
router.get("/:id", ticketController.get);
router.post("/", ticketController.create);
router.patch("/:id/status", ticketController.updateStatus);

export default router;
