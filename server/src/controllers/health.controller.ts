import type { Request, Response } from "express";
import { testConnection } from "../config/db.js";
import type { ApiResponse, HealthCheckResponse } from "../types/index.js";

/**
 * GET /api/health
 *
 * Health check endpoint that verifies:
 * - Server is running
 * - Database is connected
 */
export async function getHealth(
  _req: Request,
  res: Response<ApiResponse<HealthCheckResponse>>
): Promise<void> {
  const dbConnected = await testConnection();

  const health: HealthCheckResponse = {
    status: dbConnected ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      connected: dbConnected,
    },
  };

  const statusCode = dbConnected ? 200 : 503;

  res.status(statusCode).json({
    success: dbConnected,
    data: health,
  });
}
