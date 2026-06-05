import type { Request, Response, NextFunction } from "express";
import * as ticketService from "../services/ticket.service.js";
import { getOrCreateChatSession, addMessage } from "../services/chat.service.js";
import * as hindsightService from "../services/hindsight.service.js";

/**
 * Get all tickets.
 */
export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tickets = await ticketService.getAllTickets();
    res.json({ success: true, data: tickets });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single ticket by ID.
 */
export async function get(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const ticket = await ticketService.getTicketById(id);
    if (!ticket) {
      res.status(404).json({ success: false, error: { message: "Ticket not found" } });
      return;
    }
    res.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new ticket, start a chat session, and post the description as the first message.
 */
export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId, subject, description, priority } = req.body;

    if (!userId || !subject || !description || !priority) {
      res.status(400).json({
        success: false,
        error: { message: "userId, subject, description, and priority are required" },
      });
      return;
    }

    // 1. Create the ticket
    const ticket = await ticketService.createTicket(userId, subject, description, priority);

    // 2. Create an associated chat session
    const session = await getOrCreateChatSession(ticket.id, userId);

    // 3. Add the ticket description as the first user message in the chat session
    await addMessage(session.id, 'user', description);

    // 4. Retain the ticket details in customer memory (Phase 3)
    try {
      await hindsightService.retainMemory(
        userId,
        `Opened ticket "${subject}" with description: ${description}`
      );
    } catch (err) {
      console.error("Failed to retain ticket creation in memory:", err);
    }

    res.status(201).json({
      success: true,
      data: {
        ticket,
        sessionId: session.id,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update a ticket's status.
 */
export async function updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ success: false, error: { message: "status is required" } });
      return;
    }

    const ticket = await ticketService.updateTicketStatus(id, status);
    if (!ticket) {
      res.status(404).json({ success: false, error: { message: "Ticket not found" } });
      return;
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
}
