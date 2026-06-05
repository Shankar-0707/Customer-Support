import { z } from "zod";
import dotenv from "dotenv";

// Load .env file from project root (one level up from server/)
dotenv.config({ path: "../.env" });

/**
 * Zod schema for environment variable validation.
 * Fails fast at startup if required vars are missing.
 */
const envSchema = z.object({
  // Server
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Neon PostgreSQL
  DB_HOST: z.string().min(1, "DB_HOST is required"),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string().min(1, "DB_NAME is required"),
  DB_USER: z.string().min(1, "DB_USER is required"),
  DB_PASSWORD: z.string().min(1, "DB_PASSWORD is required"),
  DB_SSL: z
    .string()
    .transform((val) => val === "true")
    .default(true),
  DATABASE_URL: z.string().url().optional(),

  // Groq (Phase 2 — optional for now)
  GROQ_API_KEY: z.string().optional(),

  // Hindsight Cloud (Phase 3 — optional for now)
  HINDSIGHT_API_KEY: z.string().optional(),
  HINDSIGHT_API_URL: z
    .string()
    .url()
    .default("https://api.hindsight.vectorize.io"),
});

/**
 * Validated environment variables.
 * If validation fails, the app will crash immediately with a clear error message.
 */
function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Environment variable validation failed:");
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();

export type Env = z.infer<typeof envSchema>;
