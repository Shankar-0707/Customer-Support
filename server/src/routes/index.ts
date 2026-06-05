import { type Router as RouterType, Router } from "express";
import healthRoutes from "./health.routes.js";
import ticketRoutes from "./ticket.routes.js";
import chatRoutes from "./chat.routes.js";
import userRoutes from "./user.routes.js";

/**
 * Route aggregator.
 * All API routes are mounted here under /api.
 */
const router: RouterType = Router();

router.use("/health", healthRoutes);
router.use("/tickets", ticketRoutes);
router.use("/chat", chatRoutes);
router.use("/users", userRoutes);

export default router;
