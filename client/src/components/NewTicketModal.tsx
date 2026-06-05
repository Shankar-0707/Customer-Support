import React, { useState, useEffect } from "react";
import { getUsers, createTicket } from "../api";
import type { User } from "../types";

interface NewTicketModalProps {
  onClose: () => void;
  onSuccess: (ticketId: string) => void;
  preselectedUserId?: string;
}

export default function NewTicketModal({ onClose, onSuccess, preselectedUserId }: NewTicketModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [userId, setUserId] = useState(preselectedUserId || "");
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [description, setDescription] = useState("");
  
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load seeded users on mount
  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await getUsers();
        if (res.success && res.data) {
          setUsers(res.data);
          if (res.data.length > 0 && !preselectedUserId) {
            setUserId(res.data[0].id); // default to first user if not preselected
          }
        }
      } catch (err) {
        console.error("Failed to load users", err);
        setError("Failed to load customer list");
      } finally {
        setLoadingUsers(false);
      }
    }
    loadUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !subject.trim() || !description.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await createTicket(userId, subject, description, priority);
      if (res.success && res.data) {
        onSuccess(res.data.ticket.id);
      } else {
        setError(res.error?.message || "Failed to create ticket");
      }
    } catch (err) {
      console.error("Error creating ticket", err);
      setError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-lg)" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "800", color: "var(--color-text-primary)" }}>
            File Support Ticket
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-muted)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "10px",
              backgroundColor: "var(--color-error-container)",
              color: "var(--color-error)",
              borderRadius: "var(--radius-md)",
              fontSize: "12px",
              marginBottom: "var(--spacing-md)",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Customer Selection */}
          <div className="form-group">
            <label className="form-label">Customer Contact</label>
            {loadingUsers ? (
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Loading customers...</div>
            ) : (
              <select
                className="form-select"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                disabled={!!preselectedUserId}
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Subject */}
          <div className="form-group">
            <label className="form-label">Issue Subject</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. SSO Login Loop, API Rate Limiting"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              maxLength={200}
            />
          </div>

          {/* Priority */}
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select
              className="form-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              required
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Description */}
          <div className="form-group" style={{ marginBottom: "var(--spacing-lg)" }}>
            <label className="form-label">Complaint / Problem Description</label>
            <textarea
              className="form-textarea"
              placeholder="Describe the technical issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              style={{ resize: "none" }}
            />
          </div>

          {/* Form Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--spacing-sm)" }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || loadingUsers || !userId}
            >
              {submitting ? "Submitting..." : "Create Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
