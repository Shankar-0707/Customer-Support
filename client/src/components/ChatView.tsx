import React, { useState, useEffect, useRef } from "react";
import { getTicket, getSessionMessages, sendMessage, resolveTicket } from "../api";
import type { Ticket, Message } from "../types";

interface ChatViewProps {
  ticketId: string;
  onStatusUpdate: () => void;
  viewMode?: 'agent' | 'customer';
}

export default function ChatView({ ticketId, onStatusUpdate, viewMode = 'agent' }: ChatViewProps) {
  const [ticket, setTicket] = useState<(Ticket & { customer_name?: string; customer_email?: string; session_id?: string }) | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);

  // Feedback form state
  const [rating, setRating] = useState<'positive' | 'negative'>('positive');
  const [comment, setComment] = useState("");

  const historyEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch ticket and messages
  useEffect(() => {
    async function loadChatData() {
      setLoading(true);
      try {
        const ticketRes = await getTicket(ticketId);
        if (ticketRes.success && ticketRes.data) {
          const t = ticketRes.data;
          setTicket(t);

          if (t.session_id) {
            const msgRes = await getSessionMessages(t.session_id);
            if (msgRes.success && msgRes.data) {
              setMessages(msgRes.data);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load chat data", error);
      } finally {
        setLoading(false);
      }
    }
    loadChatData();
  }, [ticketId]);

  // 2. Scroll to bottom
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // 3. Send message handler
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !ticket?.session_id || sending) return;

    const text = inputText;
    setInputText("");
    setSending(true);

    // Optimistically add user message
    const tempUserMsg: Message = {
      id: "temp-user",
      session_id: ticket.session_id,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await sendMessage(ticket.session_id, text);
      if (res.success && res.data) {
        // Replace temp and add agent reply
        setMessages((prev) =>
          prev.filter((m) => m.id !== "temp-user").concat([res.data!.userMessage, res.data!.agentMessage])
        );
      }
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
    }
  };

  // 4. Resolve ticket submit
  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    try {
      const res = await resolveTicket(ticket.id, rating, comment || null);
      if (res.success) {
        setTicket((prev) => prev ? { ...prev, status: 'resolved' } : null);
        setResolving(false);
        onStatusUpdate();
      }
    } catch (err) {
      console.error("Failed to resolve ticket", err);
    }
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
        Loading chat history...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", color: "var(--color-error)" }}>
        Error: Ticket not found.
      </div>
    );
  }

  // Generate mock memory logs based on ticket subject
  const getMemoryInsights = () => {
    const s = ticket.subject.toLowerCase();
    if (s.includes("rate") || s.includes("limit")) {
      return {
        match: "92% Hindsight Confidence",
        summary: "Matched 2 past resolved issues. Incident ID #TK-1148 (Acme API Rate Limits) resolved on 2026-05-12. Solution: Instruct user to implement Exponential Backoff and rate limit request headers validation."
      };
    }
    if (s.includes("sso") || s.includes("login") || s.includes("auth")) {
      return {
        match: "88% Hindsight Confidence",
        summary: "Matched 1 past resolved issue. Incident ID #TK-0941 (Okta Loop Loop) resolved on 2026-04-30. Solution: Verify return redirect URIs match exactly between vendor dashboard and configuration settings."
      };
    }
    return {
      match: "New Context Detected (0 matches)",
      summary: "This issue does not match any previously resolved resolutions in Hindsight memory. The AI agent is responding based on general platform documentation. (Solution will be indexed into memory upon ticket resolution)."
    };
  };

  const insights = getMemoryInsights();

  return (
    <div className="chat-pane-layout animate-fade-in">
      {/* Left Pane - Ticket Info & Resolution Form (Agent only) */}
      {viewMode === 'agent' && (
        <div className="chat-side-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-md)" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--color-text-muted)" }}>
              TICKET METADATA
            </span>
            <span className={`badge ${ticket.status === 'resolved' ? 'badge-resolved' : 'badge-open'}`}>
              {ticket.status.replace('_', ' ')}
            </span>
          </div>

          <h3 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "var(--spacing-sm)", color: "var(--color-text-primary)" }}>
            {ticket.subject}
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "var(--spacing-md)" }}>
            <div><strong>Customer:</strong> {ticket.customer_name} ({ticket.customer_email})</div>
            <div><strong>Priority:</strong> <span style={{ textTransform: "capitalize" }}>{ticket.priority}</span></div>
            <div><strong>Opened:</strong> {new Date(ticket.created_at).toLocaleString()}</div>
          </div>

          <div style={{ borderTop: "1px solid var(--color-surface)", paddingTop: "var(--spacing-md)", marginBottom: "var(--spacing-md)" }}>
            <span className="form-label" style={{ fontSize: "10px" }}>Initial Complaint</span>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", whiteSpace: "pre-wrap" }}>
              {ticket.description}
            </p>
          </div>

          {/* Resolution Options */}
          <div style={{ marginTop: "auto", borderTop: "1px solid var(--color-surface)", paddingTop: "var(--spacing-md)" }}>
            {ticket.status !== 'resolved' && ticket.status !== 'closed' ? (
              !resolving ? (
                <button
                  onClick={() => setResolving(true)}
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <span className="material-symbols-outlined">check_circle</span>
                  Mark as Resolved
                </button>
              ) : (
                <form onSubmit={handleResolveSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="form-label" style={{ margin: 0 }}>Resolution Rating</span>
                    <div style={{ display: "flex", gap: "var(--spacing-xs)" }}>
                      <button
                        type="button"
                        onClick={() => setRating('positive')}
                        style={{
                          background: rating === 'positive' ? "rgba(16, 185, 129, 0.15)" : "none",
                          border: "1px solid var(--color-surface-high)",
                          color: rating === 'positive' ? "var(--color-tertiary-light)" : "var(--color-text-muted)",
                          padding: "4px 8px",
                          borderRadius: "var(--radius-sm)",
                          cursor: "pointer",
                        }}
                      >
                        👍
                      </button>
                      <button
                        type="button"
                        onClick={() => setRating('negative')}
                        style={{
                          background: rating === 'negative' ? "rgba(186, 26, 26, 0.15)" : "none",
                          border: "1px solid var(--color-surface-high)",
                          color: rating === 'negative' ? "var(--color-error)" : "var(--color-text-muted)",
                          padding: "4px 8px",
                          borderRadius: "var(--radius-sm)",
                          cursor: "pointer",
                        }}
                      >
                        👎
                      </button>
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <span className="form-label">Feedback Comments</span>
                    <textarea
                      className="form-textarea"
                      placeholder="Describe how the issue was resolved..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={2}
                      required
                      style={{ resize: "none", fontSize: "12px" }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "var(--spacing-xs)" }}>
                    <button type="submit" className="btn-primary" style={{ flex: 1, padding: "8px", fontSize: "12px", justifyContent: "center" }}>
                      Submit
                    </button>
                    <button
                      type="button"
                      onClick={() => setResolving(false)}
                      className="btn-secondary"
                      style={{ padding: "8px", fontSize: "12px" }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )
            ) : (
              <div
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.05)",
                  border: "1px solid var(--color-tertiary-light)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--spacing-md)",
                  textAlign: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", color: "var(--color-tertiary)", fontWeight: "700", fontSize: "13px" }}>
                  <span className="material-symbols-outlined">check_circle</span>
                  Issue Solved
                </div>
                <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                  Indexed into Hindsight resolution memory bank for future incidents.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Right Pane - Chat Window */}
      <div className="chat-main-panel">
        {/* Chat Pane Header */}
        <div
          style={{
            padding: "var(--spacing-md) var(--spacing-lg)",
            backgroundColor: "var(--color-surface-lowest)",
            borderBottom: "1px solid var(--color-surface)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              {ticket.subject}
              <span className={`badge ${ticket.status === 'resolved' ? 'badge-resolved' : 'badge-open'}`}>
                {ticket.status.replace('_', ' ')}
              </span>
            </h3>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
              Priority: <strong style={{ textTransform: "uppercase" }}>{ticket.priority}</strong> &bull; Opened: {new Date(ticket.created_at).toLocaleString()}
            </div>
          </div>

          {/* Action: Mark as Resolved (only for customer view when ticket is open) */}
          {viewMode === 'customer' && ticket.status !== 'resolved' && ticket.status !== 'closed' && !resolving && (
            <button
              onClick={() => setResolving(true)}
              className="btn-primary"
              style={{ padding: "8px 14px", fontSize: "12px", gap: "6px" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>check_circle</span>
              Mark as Resolved
            </button>
          )}
        </div>

        {/* Messages list */}
        <div className="chat-history-container">
          
          {/* Welcome/System prompt banner */}
          <div
            style={{
              padding: "var(--spacing-md)",
              backgroundColor: "var(--color-surface-lowest)",
              border: "1px solid var(--color-surface)",
              borderRadius: "var(--radius-md)",
              fontSize: "12px",
              color: "var(--color-text-secondary)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <strong>System:</strong> Support chat initialized for Customer: <strong>{ticket.customer_name}</strong>. Responses are automatically drafted by the Support AI.
          </div>

          {messages.map((msg, index) => {
            const isAgent = msg.role === 'agent';
            return (
              <div key={msg.id || index}>
                {/* If Agent and in Agent view, display Memory Recall insight box directly above their message */}
                {isAgent && viewMode === 'agent' && (
                  <div className="ai-memory-card" style={{ maxWidth: "70%", marginLeft: "auto" }}>
                    <div className="ai-memory-header">
                      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>lightbulb</span>
                      {insights.match}
                    </div>
                    <div style={{ fontSize: "11px", lineHeight: "1.4" }}>
                      {insights.summary}
                    </div>
                  </div>
                )}

                <div className={`message-bubble-wrapper ${isAgent ? 'agent' : 'user'}`}>
                  <div className="message-bubble">
                    {msg.content}
                    <span className="message-time">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {sending && (
            <div className="typing-indicator">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          )}

          {/* Inline Feedback Form inside Chat Area (when resolving is true and viewMode is customer) */}
          {resolving && viewMode === 'customer' && (
            <div
              style={{
                alignSelf: "center",
                backgroundColor: "var(--color-surface-lowest)",
                border: "1px solid var(--color-primary-fixed-dim)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--spacing-lg)",
                margin: "var(--spacing-md) 0",
                boxShadow: "var(--shadow-lg)",
                maxWidth: "600px",
                width: "100%",
                textAlign: "left",
                animation: "scale-up 0.2s ease-out",
              }}
            >
              <h4 style={{ fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", color: "var(--color-text-primary)", marginBottom: "var(--spacing-sm)" }}>
                <span className="material-symbols-outlined" style={{ color: "var(--color-primary)" }}>
                  rate_review
                </span>
                Resolve Ticket & Provide Feedback
              </h4>
              <form onSubmit={handleResolveSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>How was the AI's assistance?</span>
                  <div style={{ display: "flex", gap: "var(--spacing-xs)" }}>
                    <button
                      type="button"
                      onClick={() => setRating('positive')}
                      style={{
                        background: rating === 'positive' ? "rgba(16, 185, 129, 0.15)" : "none",
                        border: "1px solid var(--color-surface-high)",
                        color: rating === 'positive' ? "var(--color-tertiary-light)" : "var(--color-text-muted)",
                        padding: "6px 12px",
                        borderRadius: "var(--radius-md)",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "600",
                        transition: "all 0.2s",
                      }}
                    >
                      👍 Positive
                    </button>
                    <button
                      type="button"
                      onClick={() => setRating('negative')}
                      style={{
                        background: rating === 'negative' ? "rgba(186, 26, 26, 0.15)" : "none",
                        border: "1px solid var(--color-surface-high)",
                        color: rating === 'negative' ? "var(--color-error)" : "var(--color-text-muted)",
                        padding: "6px 12px",
                        borderRadius: "var(--radius-md)",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "600",
                        transition: "all 0.2s",
                      }}
                    >
                      👎 Negative
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <span className="form-label" style={{ fontSize: "11px" }}>Feedback Details</span>
                  <textarea
                    className="form-textarea"
                    placeholder="Tell us what resolved the issue or how we can improve..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    required
                    style={{ resize: "none", fontSize: "13px" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "var(--spacing-sm)", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setResolving(false)}
                    className="btn-secondary"
                    style={{ padding: "8px 16px", fontSize: "13px" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ padding: "8px 16px", fontSize: "13px", justifyContent: "center" }}
                  >
                    Resolve Ticket
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Inline Issue Solved Banner inside Chat Area (when ticket is resolved and viewMode is customer) */}
          {ticket.status === 'resolved' && viewMode === 'customer' && (
            <div
              style={{
                alignSelf: "center",
                backgroundColor: "rgba(16, 185, 129, 0.05)",
                border: "1px solid var(--color-tertiary-light)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--spacing-md)",
                textAlign: "center",
                maxWidth: "600px",
                width: "100%",
                margin: "var(--spacing-md) 0",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", color: "var(--color-tertiary)", fontWeight: "700", fontSize: "14px" }}>
                <span className="material-symbols-outlined">check_circle</span>
                Issue Solved & Archived
              </div>
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                This conversation has been resolved. The context and facts have been securely indexed into your AI support memory profile.
              </p>
            </div>
          )}
          
          <div ref={historyEndRef} />
        </div>

        {/* Message Input Form */}
        {ticket.status !== 'resolved' && ticket.status !== 'closed' ? (
          <form onSubmit={handleSend} className="chat-input-bar">
            <input
              type="text"
              className="chat-input-field"
              placeholder="Ask a customer support question..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={sending}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!inputText.trim() || sending}
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </form>
        ) : (
          <div
            style={{
              padding: "var(--spacing-md)",
              textAlign: "center",
              backgroundColor: "var(--color-surface-low)",
              color: "var(--color-text-muted)",
              fontSize: "13px",
              borderTop: "1px solid var(--color-surface)",
            }}
          >
            Chat session locked because the ticket is resolved.
          </div>
        )}
      </div>
    </div>
  );
}
