import type { Request, Response, NextFunction } from "express";

/**
 * Simple request logging middleware.
 * Logs HTTP method, URL, status code, and response time.
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  // Log when response finishes
  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusColor =
      res.statusCode >= 500
        ? "\x1b[31m" // Red
        : res.statusCode >= 400
          ? "\x1b[33m" // Yellow
          : res.statusCode >= 300
            ? "\x1b[36m" // Cyan
            : "\x1b[32m"; // Green

    const reset = "\x1b[0m";

    console.log(
      `${statusColor}${req.method}${reset} ${req.originalUrl} → ${statusColor}${res.statusCode}${reset} (${duration}ms)`
    );
  });

  next();
}
