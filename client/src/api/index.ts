import type { ApiResponse, HealthCheckResponse, User, Ticket, Message, Feedback } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Check server health status.
 */
export async function checkHealth(): Promise<ApiResponse<HealthCheckResponse>> {
  const response = await fetch(`${API_URL}/health`);
  return response.json();
}

/**
 * Fetch all seeded users.
 */
export async function getUsers(): Promise<ApiResponse<User[]>> {
  const response = await fetch(`${API_URL}/users`);
  return response.json();
}

/**
 * Fetch a user profile by ID.
 */
export async function getUserById(id: string): Promise<ApiResponse<User>> {
  const response = await fetch(`${API_URL}/users/${id}`);
  return response.json();
}

/**
 * Identify or register a user by email.
 */
export async function identifyUser(email: string, name?: string): Promise<ApiResponse<User>> {
  const response = await fetch(`${API_URL}/users/identify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, name }),
  });
  return response.json();
}

/**
 * Fetch all tickets (admin use).
 */
export async function getTickets(): Promise<ApiResponse<(Ticket & { customer_name: string; customer_email: string; session_id: string })[]>> {
  const response = await fetch(`${API_URL}/tickets`);
  return response.json();
}

/**
 * Fetch tickets for a specific user (customer portal).
 */
export async function getTicketsByUser(userId: string): Promise<ApiResponse<(Ticket & { customer_name: string; customer_email: string; session_id: string })[]>> {
  const response = await fetch(`${API_URL}/tickets?userId=${encodeURIComponent(userId)}`);
  return response.json();
}

/**
 * Fetch a single ticket by ID.
 */
export async function getTicket(id: string): Promise<ApiResponse<Ticket & { customer_name: string; customer_email: string; session_id: string }>> {
  const response = await fetch(`${API_URL}/tickets/${id}`);
  return response.json();
}

/**
 * Create a new support ticket.
 */
export async function createTicket(
  userId: string,
  subject: string,
  description: string,
  priority: Ticket['priority']
): Promise<ApiResponse<{ ticket: Ticket; sessionId: string }>> {
  const response = await fetch(`${API_URL}/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, subject, description, priority }),
  });
  return response.json();
}

/**
 * Get messages history for a session.
 */
export async function getSessionMessages(sessionId: string): Promise<ApiResponse<Message[]>> {
  const response = await fetch(`${API_URL}/chat/sessions/${sessionId}/messages`);
  return response.json();
}

/**
 * Send message in session and get AI response.
 */
export async function sendMessage(
  sessionId: string,
  content: string
): Promise<ApiResponse<{ userMessage: Message; agentMessage: Message }>> {
  const response = await fetch(`${API_URL}/chat/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });
  return response.json();
}

/**
 * Resolve ticket and submit rating/feedback.
 */
export async function resolveTicket(
  ticketId: string,
  rating: Feedback['rating'],
  comment: string | null,
  messageId: string | null = null
): Promise<ApiResponse<{ status: string; feedback: Feedback }>> {
  const response = await fetch(`${API_URL}/chat/tickets/${ticketId}/resolve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rating, comment, messageId }),
  });
  return response.json();
}
