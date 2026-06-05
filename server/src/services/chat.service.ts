// Chat service — business logic for sessions, messages, and feedback

import { query } from "../config/db.js";
import type { ChatSession, Message, Feedback } from "../types/index.js";

/**
 * Get or create a chat session for a ticket.
 */
export async function getOrCreateChatSession(ticketId: string, userId: string): Promise<ChatSession> {
  // Check if session already exists
  const existing = await query<ChatSession>(
    "SELECT * FROM chat_sessions WHERE ticket_id = $1 LIMIT 1",
    [ticketId]
  );

  if (existing.rows[0]) {
    return existing.rows[0];
  }

  // Create new session
  const result = await query<ChatSession>(
    `INSERT INTO chat_sessions (ticket_id, user_id)
     VALUES ($1, $2)
     RETURNING *`,
    [ticketId, userId]
  );
  return result.rows[0];
}

/**
 * Get chat session by ticket ID.
 */
export async function getChatSessionByTicketId(ticketId: string): Promise<ChatSession | null> {
  const result = await query<ChatSession>(
    "SELECT * FROM chat_sessions WHERE ticket_id = $1 LIMIT 1",
    [ticketId]
  );
  return result.rows[0] || null;
}

/**
 * Get chat session by session ID.
 */
export async function getChatSessionById(id: string): Promise<ChatSession | null> {
  const result = await query<ChatSession>(
    "SELECT * FROM chat_sessions WHERE id = $1 LIMIT 1",
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Get message history for a chat session.
 */
export async function getMessagesBySession(sessionId: string): Promise<Message[]> {
  const result = await query<Message>(
    `SELECT * FROM messages 
     WHERE session_id = $1 
     ORDER BY created_at ASC`,
    [sessionId]
  );
  return result.rows;
}

/**
 * Add a message to a session.
 */
export async function addMessage(
  sessionId: string,
  role: 'user' | 'agent',
  content: string,
  metadata: Record<string, any> = {}
): Promise<Message> {
  const result = await query<Message>(
    `INSERT INTO messages (session_id, role, content, metadata)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [sessionId, role, content, JSON.stringify(metadata)]
  );
  return result.rows[0];
}

/**
 * Record resolution feedback for a ticket.
 */
export async function submitFeedback(
  ticketId: string,
  messageId: string | null,
  rating: 'positive' | 'negative' | 'no_response',
  comment: string | null
): Promise<Feedback> {
  const result = await query<Feedback>(
    `INSERT INTO feedback (ticket_id, message_id, rating, comment)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [ticketId, messageId, rating, comment]
  );
  return result.rows[0];
}
