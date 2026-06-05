// Ticket service — business logic for ticket operations

import { query } from "../config/db.js";
import type { Ticket } from "../types/index.js";

/**
 * Get all tickets, joined with user information to fetch the customer's name.
 */
export async function getAllTickets(): Promise<(Ticket & { customer_name: string; customer_email: string; session_id: string })[]> {
  const result = await query<Ticket & { customer_name: string; customer_email: string; session_id: string }>(
    `SELECT t.*, u.name as customer_name, u.email as customer_email, s.id as session_id
     FROM tickets t 
     JOIN users u ON t.user_id = u.id 
     LEFT JOIN chat_sessions s ON s.ticket_id = t.id
     ORDER BY t.created_at DESC`
  );
  return result.rows;
}

/**
 * Get all tickets for a specific user, joined with user information.
 */
export async function getTicketsByUserId(userId: string): Promise<(Ticket & { customer_name: string; customer_email: string; session_id: string })[]> {
  const result = await query<Ticket & { customer_name: string; customer_email: string; session_id: string }>(
    `SELECT t.*, u.name as customer_name, u.email as customer_email, s.id as session_id
     FROM tickets t 
     JOIN users u ON t.user_id = u.id 
     LEFT JOIN chat_sessions s ON s.ticket_id = t.id
     WHERE t.user_id = $1
     ORDER BY t.created_at DESC`,
    [userId]
  );
  return result.rows;
}

/**
 * Get a single ticket by ID, joined with user info.
 */
export async function getTicketById(id: string): Promise<(Ticket & { customer_name: string; customer_email: string; session_id: string }) | null> {
  const result = await query<Ticket & { customer_name: string; customer_email: string; session_id: string }>(
    `SELECT t.*, u.name as customer_name, u.email as customer_email, s.id as session_id
     FROM tickets t 
     JOIN users u ON t.user_id = u.id 
     LEFT JOIN chat_sessions s ON s.ticket_id = t.id
     WHERE t.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Create a new support ticket.
 */
export async function createTicket(
  userId: string,
  subject: string,
  description: string,
  priority: 'low' | 'medium' | 'high' | 'critical'
): Promise<Ticket> {
  const result = await query<Ticket>(
    `INSERT INTO tickets (user_id, subject, description, priority, status)
     VALUES ($1, $2, $3, $4, 'open')
     RETURNING *`,
    [userId, subject, description, priority]
  );
  return result.rows[0];
}

/**
 * Update the status of an existing ticket.
 */
export async function updateTicketStatus(id: string, status: Ticket['status']): Promise<Ticket | null> {
  const result = await query<Ticket>(
    `UPDATE tickets 
     SET status = $1, updated_at = NOW() 
     WHERE id = $2 
     RETURNING *`,
    [status, id]
  );
  return result.rows[0] || null;
}
