import { env } from "../config/env.js";
import { query } from "../config/db.js";
import { HindsightClient, recallResponseToPromptString } from "@vectorize-io/hindsight-client";

let hindsightClient: HindsightClient | null = null;
let isMockMode = true;

// Initialize the Hindsight Client if key is configured
const apiKey = env.HINDSIGHT_API_KEY;
if (apiKey && apiKey !== "your_hindsight_api_key_here" && apiKey.trim() !== "") {
  try {
    hindsightClient = new HindsightClient({
      baseUrl: env.HINDSIGHT_API_URL,
      apiKey: apiKey,
    });
    isMockMode = false;
    console.log("🧠 Hindsight Cloud client initialized successfully using: " + env.HINDSIGHT_API_URL);
  } catch (error) {
    console.error("⚠️ Failed to initialize Hindsight Client, falling back to mock database memory:", error);
  }
} else {
  console.log("ℹ️ No Hindsight API Key configured. Running in Mock Database Memory Mode.");
}

/**
 * Retain memory under a specific bank ID (either user ID or "global_resolutions").
 */
export async function retainMemory(bankId: string, content: string): Promise<void> {
  if (isMockMode || !hindsightClient) {
    await query(
      `INSERT INTO hindsight_mock_memories (bank_id, content) 
       VALUES ($1, $2)`,
      [bankId, content]
    );
    console.log(`[Mock Memory] Retained in bank ${bankId}: "${content}"`);
    return;
  }

  try {
    // Attempt to automatically create the bank if it doesn't exist
    // (createBank is idempotent on Hindsight Cloud)
    await hindsightClient.createBank(bankId, {
      name: bankId === "global_resolutions" ? "Global Resolutions" : `User ${bankId}`,
      reflectMission: bankId === "global_resolutions"
        ? "You are recalling past resolutions to support queries across all customers."
        : "You are recalling past conversations, user environment, and preferences for this specific customer.",
    });

    await hindsightClient.retain(bankId, content);
    console.log(`[Hindsight Cloud] Retained in bank ${bankId}: "${content}"`);
  } catch (error) {
    console.error(`❌ Hindsight Cloud retain failed for bank ${bankId}:`, error);
    // Write to mock DB as backup
    await query(
      `INSERT INTO hindsight_mock_memories (bank_id, content) 
       VALUES ($1, $2)`,
      [bankId, content]
    );
  }
}

/**
 * Recall memories for a given bank ID based on query text, formatting it as a string
 * suitable for appending to the LLM system prompt.
 */
export async function recallMemory(bankId: string, queryText: string): Promise<string> {
  if (isMockMode || !hindsightClient) {
    return recallMemoryMockFallback(bankId, queryText);
  }

  try {
    const recallResponse = await hindsightClient.recall(bankId, queryText, {
      budget: "mid",
      maxTokens: 2048,
    });
    return recallResponseToPromptString(recallResponse);
  } catch (error) {
    console.error(`❌ Hindsight Cloud recall failed for bank ${bankId}:`, error);
    // Fall back to database query if cloud service fails
    return recallMemoryMockFallback(bankId, queryText);
  }
}

/**
 * Internal helper for mock lookup fallback when Hindsight Cloud fails mid-operation.
 */
async function recallMemoryMockFallback(bankId: string, queryText: string): Promise<string> {
  try {
    const words = queryText
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .map((w) => w.toLowerCase())
      .filter((w) => w.length > 3);

    const rowsByContent = new Map<string, { content: string; context: string }>();

    if (words.length > 0) {
      const clauses = words.map((_, i) => `content ILIKE $${i + 2}`);
      const keywordResults = await query<{ content: string }>(
        `SELECT content FROM hindsight_mock_memories 
         WHERE bank_id = $1 AND (${clauses.join(" OR ")}) 
         ORDER BY created_at DESC LIMIT 5`,
        [bankId, ...words.map((w) => `%${w}%`)]
      );

      for (const row of keywordResults.rows) {
        rowsByContent.set(row.content, {
          content: row.content,
          context: "Keyword-matched local memory",
        });
      }
    }

    // Always include recent entries from the bank. Questions like "what did we
    // discuss earlier?" often have no useful overlap with the stored facts.
    const recentResults = await query<{ content: string }>(
      `SELECT content FROM hindsight_mock_memories 
       WHERE bank_id = $1 
       ORDER BY created_at DESC LIMIT 5`,
      [bankId]
    );

    for (const row of recentResults.rows) {
      if (!rowsByContent.has(row.content)) {
        rowsByContent.set(row.content, {
          content: row.content,
          context: "Recent local memory from this bank",
        });
      }
    }

    if (rowsByContent.size === 0) {
      return "FACTS: []";
    }

    const formattedFacts = Array.from(rowsByContent.values())
      .slice(0, 8)
      .map((row) => ({
        text: row.content,
        context: row.context,
      }));

    return "FACTS:\n" + JSON.stringify(formattedFacts, null, 2);
  } catch (error) {
    console.error(`Mock memory recall failed for bank ${bankId}:`, error);
    return "FACTS: []";
  }
}

/**
 * Retain a lightweight transcript note for the current user.
 * This gives future tickets memory even if the current ticket is never formally resolved.
 */
export async function retainConversationMemory(
  bankId: string,
  customerMessage: string,
  agentMessage: string
): Promise<void> {
  const content = [
    "Past conversation:",
    `Customer: ${customerMessage}`,
    `Agent: ${agentMessage}`,
  ].join("\n");

  await retainMemory(bankId, content);
}
