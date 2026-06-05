import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { requestLogger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";

/**
 * Creates and configures the Express application.
 * Separated from server.ts so we can test the app without starting a listener.
 */
export function createApp(): express.Express {
  const app = express();

  // ──── Core Middleware ────
  const frontendUrl = process.env.FRONTEND_URL;
  app.use(
    cors({
      origin: frontendUrl ? [frontendUrl, "http://localhost:5173"] : "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // ──── API Routes ────
  app.use("/api", routes);

  // ──── 404 Handler ────
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: { message: "Route not found" },
    });
  });

  // ──── Global Error Handler (must be last) ────
  app.use(errorHandler);

  return app;
}
