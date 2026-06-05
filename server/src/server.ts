import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { testConnection } from "./config/db.js";

/**
 * Server entry point.
 * 1. Validates environment variables (via env.ts import)
 * 2. Tests database connection
 * 3. Starts the Express server
 */
async function main(): Promise<void> {
  const app = createApp();

  // Test database connection on startup
  const dbConnected = await testConnection();
  if (dbConnected) {
    console.log("✅ Database connected successfully");
  } else {
    console.warn("⚠️  Database connection failed — server starting in degraded mode");
  }

  // Start listening
  app.listen(env.PORT, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║  🧠 Customer Support Agent — Server         ║
║──────────────────────────────────────────────║
║  Environment: ${env.NODE_ENV.padEnd(30)}║
║  Port:        ${String(env.PORT).padEnd(30)}║
║  Database:    ${(dbConnected ? "Connected ✅" : "Disconnected ❌").padEnd(30)}║
║  Health:      http://localhost:${env.PORT}/api/health  ║
╚══════════════════════════════════════════════╝
    `);
  });
}

main().catch((error) => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});
