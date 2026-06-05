import { type Router as RouterType, Router } from "express";
import { getHealth } from "../controllers/health.controller.js";

const router: RouterType = Router();

/**
 * GET /api/health
 * Returns server and database health status.
 */
router.get("/", getHealth);

export default router;
