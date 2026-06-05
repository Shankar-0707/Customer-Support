import type { Request, Response, NextFunction } from "express";
import * as chatService from "../services/chat.service.js";
import { generateAgentResponse, generateTicketSummary, generateUserContextFacts } from "../services/llm.service.js";
import { updateTicketStatus, getTicketById } from "../services/ticket.service.js";
import * as hindsightService from "../services/hindsight.service.js";

/**
 * Get message history for a session.
 */
export async function getSessionMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId } = req.params as { sessionId: string };
    const messages = await chatService.getMessagesBySession(sessionId);
    res.json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
}

/**
 * Send a user message and trigger the Groq LLM response.
 */
export async function sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId } = req.params as { sessionId: string };
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ success: false, error: { message: "Message content is required" } });
      return;
    }

    // 1. Add user message to DB
    const userMessage = await chatService.addMessage(sessionId, 'user', content);

    // 2. Fetch full message history to provide context to LLM
    const history = await chatService.getMessagesBySession(sessionId);
    
    // Format history for LLM service (role must be 'user' or 'agent')
    const formattedHistory = history.map((m) => ({
      role: m.role as "user" | "agent",
      content: m.content,
    }));

    // 3. Fetch related memory context from Hindsight (Phase 3 & Phase 4)
    let customerMemories = "";
    let sharedResolutions = "";

    const session = await chatService.getChatSessionById(sessionId);
    if (session) {
      const userId = session.user_id;
      const memoryRecallQuery = [
        `Current customer message: ${content}`,
        "Recent conversation:",
        formattedHistory
          .slice(-8)
          .map((m) => `${m.role === "user" ? "Customer" : "Agent"}: ${m.content}`)
          .join("\n"),
      ].join("\n");

      try {
        // Query specific customer memory
        customerMemories = await hindsightService.recallMemory(userId, memoryRecallQuery);
      } catch (err) {
        console.error("Failed to retrieve customer memory context:", err);
      }

      try {
        // Query global resolution memory (cross-customer learning)
        sharedResolutions = await hindsightService.recallMemory("global_resolutions", memoryRecallQuery);
      } catch (err) {
        console.error("Failed to retrieve shared resolution context:", err);
      }
    }

    // 4. Generate response using Groq LLM
    const agentReplyContent = await generateAgentResponse(
      formattedHistory,
      customerMemories,
      sharedResolutions
    );

    // 5. Save AI agent response to DB
    const agentMessage = await chatService.addMessage(sessionId, 'agent', agentReplyContent);

    if (session) {
      try {
        await hindsightService.retainConversationMemory(session.user_id, content, agentReplyContent);
      } catch (err) {
        console.error("Failed to retain conversation memory:", err);
      }
    }

    res.status(201).json({
      success: true,
      data: {
        userMessage,
        agentMessage,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Resolve a ticket and submit feedback.
 */
export async function resolveAndFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { ticketId } = req.params as { ticketId: string };
    const { rating, comment, messageId } = req.body;

    if (!rating) {
      res.status(400).json({ success: false, error: { message: "rating is required" } });
      return;
    }

    // 1. Update ticket status to 'resolved'
    await updateTicketStatus(ticketId, 'resolved');

    // 2. Insert feedback
    const feedback = await chatService.submitFeedback(ticketId, messageId || null, rating, comment || null);

    // 3. Generate ticket summary & store in Hindsight memory (Phase 3 & Phase 4)
    try {
      const ticket = await getTicketById(ticketId);
      if (ticket) {
        const session = await chatService.getChatSessionByTicketId(ticketId);
        let chatHistoryText = "";

        if (session) {
          const messages = await chatService.getMessagesBySession(session.id);
          chatHistoryText = messages
            .map((m) => `${m.role === "user" ? "Customer" : "Agent"}: ${m.content}`)
            .join("\n");
        }

        // --- INDIVIDUAL BANK: Extract personal user-specific facts (not anonymized) ---
        const userFacts = await generateUserContextFacts(ticket.subject, chatHistoryText);
        const rawFacts = userFacts ? userFacts.trim() : "";

        // Robustly filter out negative/absent-fact bullets that the LLM may generate
        // e.g. "- Customer's name is not mentioned" → discard
        const NEGATIVE_PHRASES = ["not mentioned", "not provided", "not stated", "did not", "does not", "no mention", "unknown", "n/a"];
        const validBullets = rawFacts
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.startsWith("- "))
          .filter((line) => {
            const lower = line.toLowerCase();
            return !NEGATIVE_PHRASES.some((phrase) => lower.includes(phrase));
          });

        // Treat as NONE if: original was NONE, empty, or all bullets were negative
        const userFactsIsNone =
          rawFacts === "" ||
          rawFacts.toUpperCase() === "NONE" ||
          rawFacts.toUpperCase().includes("NONE") ||
          validBullets.length === 0;

        if (!userFactsIsNone) {
          const factsToStore = validBullets.join("\n");
          console.log(`👤 Storing user context facts for ${ticket.user_id}:\n${factsToStore}`);
          await hindsightService.retainMemory(ticket.user_id, factsToStore);
        } else {
          console.log(`ℹ️ No personal facts found for ticket "${ticket.subject}" — skipping individual bank write.`);
        }

        // --- GLOBAL BANK: Anonymized technical resolution only ---
        const summary = await generateTicketSummary(
          ticket.subject,
          ticket.description,
          chatHistoryText
        );

        console.log(`📝 Generated Ticket Summary: "${summary}"`);

        const cleanSummary = summary ? summary.trim() : "";
        const isNone = cleanSummary.toUpperCase() === "NONE" || cleanSummary === "";

        if (!isNone) {
          // Only anonymized technical resolutions go into the global bank
          await hindsightService.retainMemory("global_resolutions", cleanSummary);
        }
      }
    } catch (memoryError) {
      console.error("Failed to retain ticket resolution in memory:", memoryError);
    }

    res.json({
      success: true,
      data: {
        status: "resolved",
        feedback,
      },
    });
  } catch (error) {
    next(error);
  }
}
