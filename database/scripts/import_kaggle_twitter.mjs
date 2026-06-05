/**
 * Kaggle Twitter Customer Support Dataset Importer
 * ================================================
 * Dataset: "Customer Support on Twitter" by thoughtvector
 * URL: https://www.kaggle.com/datasets/thoughtvector/customer-support-on-twitter
 *
 * USAGE:
 *   1. Download twcs.csv from Kaggle and place it in: database/scripts/twcs.csv
 *   2. Run: node database/scripts/import_kaggle_twitter.mjs
 *
 * This script reads the CSV and bulk-inserts into twitter_support_raw table.
 * After running this, execute: database/seeds/002_kaggle_twitter_to_memory.sql
 * in your Neon DB SQL editor to populate the AI memory bank.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createReadStream } from "fs";
import { createInterface } from "readline";
import pkg from "pg";
const { Pool } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Config ────────────────────────────────────────────────────────────────────
const DATABASE_URL =
  "postgresql://neondb_owner:npg_c9S2LkirAfnG@ep-purple-cell-aqp9jpyt-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require";

// Support both the sample file and the full Kaggle file
const CSV_FILE =
  fs.existsSync(path.join(__dirname, "sample.csv"))
    ? path.join(__dirname, "sample.csv")
    : path.join(__dirname, "twcs.csv");
const BATCH_SIZE = 500;       // rows per DB insert
const MAX_ROWS = 50_000;      // safety cap — remove to import all ~3M rows

// ─── DB ────────────────────────────────────────────────────────────────────────
const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

// ─── Helpers ───────────────────────────────────────────────────────────────────
function parseRow(headers, values) {
  const obj = {};
  headers.forEach((h, i) => (obj[h.trim()] = (values[i] || "").trim()));
  return obj;
}

/**
 * Parse a CSV line, handling quoted fields containing commas.
 */
function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(CSV_FILE)) {
    console.error(`❌ CSV file not found at: ${CSV_FILE}`);
    console.error("   Download twcs.csv from Kaggle and place it in database/scripts/");
    process.exit(1);
  }

  console.log("🚀 Starting Kaggle Twitter dataset import...");
  console.log(`   File: ${CSV_FILE}`);
  console.log(`   Batch size: ${BATCH_SIZE}`);
  console.log(`   Max rows: ${MAX_ROWS.toLocaleString()}`);

  const client = await pool.connect();
  let headers = null;
  let batch = [];
  let totalInserted = 0;
  let totalSkipped = 0;
  let lineCount = 0;

  const rl = createInterface({ input: createReadStream(CSV_FILE), crlfDelay: Infinity });

  for await (const line of rl) {
    if (!line.trim()) continue;

    const values = parseCsvLine(line);

    if (!headers) {
      headers = values.map((h) => h.toLowerCase().trim());
      console.log("📋 CSV headers detected:", headers.join(", "));
      continue;
    }

    if (lineCount >= MAX_ROWS) break;
    lineCount++;

    const row = parseRow(headers, values);

    try {
      const tweetId = row.tweet_id ? parseInt(row.tweet_id, 10) : null;
      const inResponseTo = row.in_response_to_tweet_id
        ? parseInt(row.in_response_to_tweet_id, 10)
        : null;
      const inbound = row.inbound?.toLowerCase() === "true";
      const createdAt = row.created_at || null;

      if (!tweetId || isNaN(tweetId)) {
        totalSkipped++;
        continue;
      }

      // Twitter date format: "Wed Oct 11 06:55:44 +0000 2017"
      // PostgreSQL can't parse this directly — convert to ISO 8601
      let parsedDate = null;
      if (createdAt) {
        const d = new Date(createdAt);
        parsedDate = isNaN(d.getTime()) ? null : d.toISOString();
      }

      batch.push([
        tweetId,
        row.author_id || null,
        inbound,
        parsedDate,
        row.text || "",
        row.response_tweet_id || null,
        inResponseTo && !isNaN(inResponseTo) ? inResponseTo : null,
      ]);
    } catch {
      totalSkipped++;
      continue;
    }

    if (batch.length >= BATCH_SIZE) {
      await insertBatch(client, batch);
      totalInserted += batch.length;
      batch = [];
      process.stdout.write(`\r   Inserted: ${totalInserted.toLocaleString()} rows...`);
    }
  }

  // Insert remaining rows
  if (batch.length > 0) {
    await insertBatch(client, batch);
    totalInserted += batch.length;
  }

  client.release();
  await pool.end();

  console.log(`\n\n✅ Import complete!`);
  console.log(`   Total inserted : ${totalInserted.toLocaleString()}`);
  console.log(`   Total skipped  : ${totalSkipped.toLocaleString()}`);
  console.log(`\n📌 Next step: Run database/seeds/002_kaggle_twitter_to_memory.sql`);
  console.log(`   in your Neon DB SQL editor to seed the AI memory bank.\n`);
}

async function insertBatch(client, rows) {
  // Build parameterized INSERT for the batch
  const values = [];
  const placeholders = rows.map((row, i) => {
    const base = i * 7;
    values.push(...row);
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`;
  });

  await client.query(
    `INSERT INTO twitter_support_raw
       (tweet_id, author_id, inbound, created_at, text, response_tweet_id, in_response_to_tweet_id)
     VALUES ${placeholders.join(", ")}
     ON CONFLICT (tweet_id) DO NOTHING`,
    values
  );
}

main().catch((err) => {
  if (err?.code === "42P01") {
    console.error("\n❌ Table 'twitter_support_raw' does not exist!");
    console.error("   ➡️  Run this first in your Neon DB SQL Editor:");
    console.error("   database/migrations/003_twitter_support_dataset.sql\n");
  } else {
    console.error("❌ Fatal error:", err);
  }
  process.exit(1);
});
