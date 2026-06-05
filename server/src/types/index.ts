// ──────────────────────────────────────────────
// Shared TypeScript types for the backend
// ──────────────────────────────────────────────

/**
 * Standard API response envelope.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    stack?: string;
  };
}

/**
 * Ticket status enum.
 */
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

/**
 * Ticket priority enum.
 */
export type TicketPriority = "low" | "medium" | "high" | "critical";

/**
 * Message role — who sent the message.
 */
export type MessageRole = "user" | "agent";

/**
 * Feedback rating.
 */
export type FeedbackRating = "positive" | "negative" | "no_response";

/**
 * User record from the database.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Ticket record from the database.
 */
export interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: Date;
  updated_at: Date;
}

/**
 * Chat session record.
 */
export interface ChatSession {
  id: string;
  ticket_id: string;
  user_id: string;
  started_at: Date;
  ended_at: Date | null;
}

/**
 * Message record from a chat session.
 */
export interface Message {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: Date;
}

/**
 * Feedback record.
 */
export interface Feedback {
  id: string;
  ticket_id: string;
  message_id: string | null;
  rating: FeedbackRating;
  comment: string | null;
  created_at: Date;
}

/**
 * Health check response.
 */
export interface HealthCheckResponse {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  uptime: number;
  database: {
    connected: boolean;
  };
}
