// ──────────────────────────────────────────────
// Shared TypeScript types for the frontend
// ──────────────────────────────────────────────

/**
 * Standard API response envelope (mirrors backend).
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
 * Health check response from GET /api/health.
 */
export interface HealthCheckResponse {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  uptime: number;
  database: {
    connected: boolean;
  };
}

/**
 * User record.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

/**
 * Ticket record.
 */
export interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
  customer_name?: string;
  customer_email?: string;
  session_id?: string;
}

/**
 * Chat session record.
 */
export interface ChatSession {
  id: string;
  ticket_id: string;
  user_id: string;
  started_at: string;
  ended_at?: string;
}

/**
 * Message record.
 */
export interface Message {
  id: string;
  session_id: string;
  role: 'user' | 'agent';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

/**
 * Resolution Feedback record.
 */
export interface Feedback {
  id: string;
  ticket_id: string;
  message_id?: string;
  rating: 'positive' | 'negative' | 'no_response';
  comment?: string;
  created_at: string;
}
