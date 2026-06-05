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
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-bg)",
        minHeight: "calc(100vh - var(--header-height))",
        padding: "var(--spacing-lg)",
      }}
    >
      <div
        className="bento-card"
        style={{
          width: "400px",
          maxWidth: "100%",
          padding: "var(--spacing-xl) var(--spacing-lg)",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--color-surface)",
          animation: "scale-up 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "var(--spacing-lg)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "var(--color-primary)", marginBottom: "var(--spacing-sm)" }}>
            support_agent
          </span>
          <h3 style={{ fontSize: "20px", fontWeight: "800", color: "var(--color-text-primary)", marginBottom: "4px" }}>
            Customer Support Panel
          </h3>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            Enter your email to view your tickets and chat with our support AI.
          </p>
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
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
          {/* Email */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: "11px" }}>Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. alice@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={{ fontSize: "14px" }}
            />
          </div>

          {/* Optional Name (For new registrations) */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: "11px" }}>
              Full Name <span style={{ textTransform: "none", color: "var(--color-text-muted)", fontWeight: "normal" }}>(Optional - for new accounts)</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Alice Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              style={{ fontSize: "14px" }}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !email.trim()}
            style={{
              marginTop: "var(--spacing-sm)",
              justifyContent: "center",
              width: "100%",
              padding: "12px",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            {loading ? "Verifying..." : "Access Support Panel"}
          </button>
        </form>

        <div style={{ marginTop: "var(--spacing-lg)", borderTop: "1px solid var(--color-surface)", paddingTop: "var(--spacing-md)", textAlign: "center" }}>
          <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
            Tip: You can use seeded accounts like <strong>alice@example.com</strong>, <strong>bob@example.com</strong>, or <strong>carol@example.com</strong> to test existing data.
          </p>
        </div>
      </div>
    </div>
  );
}
