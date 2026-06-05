import type { Request, Response, NextFunction } from "express";
import { query } from "../config/db.js";

/**
 * List all users.
 */
export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await query("SELECT * FROM users ORDER BY name ASC");
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
}

/**
 * Identify or register a customer user by email.
 */
export async function identify(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, name } = req.body;

    if (!email) {
      res.status(400).json({ success: false, error: { message: "Email is required" } });
      return;
    }

    const trimmedEmail = email.toLowerCase().trim();

    // 1. Check if user exists
    const searchResult = await query("SELECT * FROM users WHERE email = $1 LIMIT 1", [trimmedEmail]);
    if (searchResult.rows[0]) {
      res.json({ success: true, data: searchResult.rows[0] });
      return;
    }

    // 2. Create new user on the fly if not found
    const userName = name?.trim() || `User - ${trimmedEmail.split('@')[0]}`;
    const insertResult = await query(
      "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
      [userName, trimmedEmail]
    );

    res.status(201).json({ success: true, data: insertResult.rows[0] });
  } catch (error) {
    next(error);
  }
}
export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const result = await query("SELECT * FROM users WHERE id = $1 LIMIT 1", [id]);
    if (!result.rows[0]) {
      res.status(404).json({ success: false, error: { message: "User not found" } });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
}
