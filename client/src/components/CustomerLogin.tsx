import React, { useState } from "react";
import { identifyUser } from "../api";
import type { User } from "../types";

interface CustomerLoginProps {
  onIdentifySuccess: (user: User) => void;
}

export default function CustomerLogin({ onIdentifySuccess }: CustomerLoginProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await identifyUser(email.trim(), name.trim() || undefined);
      if (res.success && res.data) {
        onIdentifySuccess(res.data);
      } else {
        setError(res.error?.message || "Failed to identify customer");
      }
    } catch (err) {
      console.error("Identify error", err);
      setError("Unable to connect to support server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon-wrapper">
            <span className="material-symbols-outlined">support_agent</span>
          </div>
          <h3 className="login-title">Customer Support Panel</h3>
          <p className="login-subtitle">
            Enter your email to view your tickets and chat with our support AI.
          </p>
        </div>

        {error && (
          <div className="modal-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. alice@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* Optional Name (For new registrations) */}
          <div className="form-group">
            <label className="form-label">
              Full Name <span style={{ textTransform: "none", color: "var(--color-text-muted)", fontWeight: "normal" }}>(Optional)</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Alice Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn-primary login-submit-btn"
            disabled={loading || !email.trim()}
          >
            {loading ? "Verifying..." : "Access Support Panel"}
          </button>
        </form>

        <div className="login-tips">
          <p>
            Tip: You can use seeded accounts like <strong>alice@example.com</strong>, <strong>bob@example.com</strong>, or <strong>carol@example.com</strong> to test existing data.
          </p>
        </div>
      </div>
    </div>
  );
}
