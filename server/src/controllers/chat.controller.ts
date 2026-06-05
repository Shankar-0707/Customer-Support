import type { Request, Response, NextFunction } from "express";
import * as chatService from "../services/chat.service.js";
import { generateAgentResponse, generateTicketSummary } from "../services/llm.service.js";
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

      // Retain this message in customer memory bank asynchronously (Phase 3)
      hindsightService.retainMemory(userId, `Customer said: ${content}`).catch((err) => {
        console.error("Failed to retain customer message in memory:", err);
      });

      try {
        // Query specific customer memory
        customerMemories = await hindsightService.recallMemory(userId, content);
      } catch (err) {
        console.error("Failed to retrieve customer memory context:", err);
      }

      try {
        // Query global resolution memory (cross-customer learning)
        sharedResolutions = await hindsightService.recallMemory("global_resolutions", content);
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

        const summary = await generateTicketSummary(
          ticket.subject,
          ticket.description,
          chatHistoryText
        );

        console.log(`📝 Generated Ticket Summary: "${summary}"`);

        const cleanSummary = summary ? summary.trim() : "";
        const isNone = cleanSummary.toUpperCase() === "NONE" || cleanSummary === "";

        if (!isNone) {
          // Retain the technical summary in customer bank (Phase 3)
          await hindsightService.retainMemory(ticket.user_id, cleanSummary);

          // Retain the technical summary in global resolutions bank (Phase 4)
          await hindsightService.retainMemory("global_resolutions", cleanSummary);
        } else {
          // If the summary is NONE, it means it's a personal/chitchat ticket.
          // Retain ONLY in the specific customer's bank as general history context (Phase 3)
          await hindsightService.retainMemory(ticket.user_id, `Resolved ticket "${ticket.subject}"`);
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
