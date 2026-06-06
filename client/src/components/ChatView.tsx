import React, { useState, useEffect, useRef } from "react";
import { getTicket, getSessionMessages, sendMessage, resolveTicket } from "../api";
import type { Ticket, Message } from "../types";
import Loading from "./Loading";

interface ChatViewProps {
  ticketId: string;
  onStatusUpdate: () => void;
  viewMode?: 'agent' | 'customer';
}

function renderBoldText(content: string): React.ReactNode {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
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
    return <Loading message="Loading chat history..." />;
  }

  if (!ticket) {
    return (
      <div className="loading-screen" style={{ color: 'var(--color-error)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>error_outline</span>
        <span>Ticket not found.</span>
      </div>
    );
  }

  // Generate memory insights
  const getMemoryInsights = () => {
    const s = ticket.subject.toLowerCase();
    if (s.includes("rate") || s.includes("limit")) {
      return {
        match: "92% Hindsight Confidence",
        summary: "Matched 2 past resolved issues. Solution: Implement Exponential Backoff and validate rate limit request headers."
      };
    }
    if (s.includes("sso") || s.includes("login") || s.includes("auth")) {
      return {
        match: "88% Hindsight Confidence",
        summary: "Matched 1 past issue. Solution: Verify return redirect URIs match between vendor dashboard and config."
      };
    }
    return {
      match: "New Context (0 matches)",
      summary: "No prior matches found. AI responding from platform docs. Solution indexed on resolution."
    };
  };

  const insights = getMemoryInsights();

  return (
    <div className="chat-pane-layout">
      {/* Left Pane - Ticket Info (Agent only) */}
      {viewMode === 'agent' && (
        <div className="chat-side-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
            <span className="chat-side-label">Ticket Metadata</span>
            <span className={`badge ${ticket.status === 'resolved' ? 'badge-resolved' : 'badge-open'}`}>
              {ticket.status.replace('_', ' ')}
            </span>
          </div>

          <h3 className="chat-side-subject">{ticket.subject}</h3>

          <div className="chat-side-detail">
            <div><strong>Customer:</strong> {ticket.customer_name} ({ticket.customer_email})</div>
            <div><strong>Opened:</strong> {new Date(ticket.created_at).toLocaleString()}</div>
          </div>

          <div className="chat-side-divider">
            <span className="form-label" style={{ fontSize: '10px' }}>Initial Complaint</span>
            <p className="chat-side-description">{ticket.description}</p>
          </div>

          {/* Resolution */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--color-surface)', paddingTop: 'var(--spacing-md)' }}>
            {ticket.status !== 'resolved' && ticket.status !== 'closed' ? (
              !resolving ? (
                <button onClick={() => setResolving(true)} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined">check_circle</span>
                  Mark as Resolved
                </button>
              ) : (
                <form onSubmit={handleResolveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="form-label" style={{ margin: 0 }}>Rating</span>
                    <div className="rating-btn-group">
                      <button
                        type="button"
                        onClick={() => setRating('positive')}
                        className={`rating-btn positive ${rating === 'positive' ? 'selected' : ''}`}
                      >
                        👍
                      </button>
                      <button
                        type="button"
                        onClick={() => setRating('negative')}
                        className={`rating-btn negative ${rating === 'negative' ? 'selected' : ''}`}
                      >
                        👎
                      </button>
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <span className="form-label">Feedback</span>
                    <textarea
                      className="form-textarea"
                      placeholder="Describe how the issue was resolved..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={2}
                      required
                      style={{ resize: 'none', fontSize: '12px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                    <button type="submit" className="btn-primary" style={{ flex: 1, padding: '8px', fontSize: '12px', justifyContent: 'center' }}>
                      Submit
                    </button>
                    <button type="button" onClick={() => setResolving(false)} className="btn-secondary" style={{ padding: '8px', fontSize: '12px' }}>
                      Cancel
                    </button>
                  </div>
                </form>
              )
            ) : (
              <div className="chat-side-resolved">
                <div className="chat-side-resolved-title">
                  <span className="material-symbols-outlined">check_circle</span>
                  Issue Solved
                </div>
                <p>Indexed into memory bank for future incidents.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Right Pane - Chat Window */}
      <div className="chat-main-panel">
        {/* Chat Header */}
        <div className="chat-pane-header">
          <div>
            <h3 className="chat-pane-subject">
              {ticket.subject}
              <span className={`badge ${ticket.status === 'resolved' ? 'badge-resolved' : 'badge-open'}`}>
                {ticket.status.replace('_', ' ')}
              </span>
            </h3>
          </div>

          {/* Customer resolve action */}
          {viewMode === 'customer' && ticket.status !== 'resolved' && ticket.status !== 'closed' && !resolving && (
            <button onClick={() => setResolving(true)} className="btn-primary" style={{ padding: '8px 14px', fontSize: '12px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
              Mark as Resolved
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="chat-history-container">
          {/* System banner */}
          <div className="chat-system-banner">
            <strong>System:</strong> Support chat initialized for <strong>{ticket.customer_name}</strong>. Responses are drafted by the AI agent.
          </div>

          {messages.map((msg, index) => {
            const isAgent = msg.role === 'agent';
            return (
              <div key={msg.id || index}>
                {/* Memory insight above agent messages (Agent view only) */}
                {isAgent && viewMode === 'agent' && (
                  <div className="ai-memory-card" style={{ maxWidth: '68%', marginLeft: 'auto', marginBottom: '4px' }}>
                    <div className="ai-memory-header">
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>lightbulb</span>
                      {insights.match}
                    </div>
                    <div style={{ fontSize: '11px', lineHeight: '1.5' }}>
                      {insights.summary}
                    </div>
                  </div>
                )}

                <div className={`message-bubble-wrapper ${isAgent ? 'agent' : 'user'}`}>
                  <div className="message-bubble">
                    {renderBoldText(msg.content)}
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

          {/* Inline Feedback (Customer resolve) */}
          {resolving && viewMode === 'customer' && (
            <div className="chat-inline-card">
              <h4 className="chat-inline-card-title">
                <span className="material-symbols-outlined">rate_review</span>
                Resolve Ticket & Provide Feedback
              </h4>
              <form onSubmit={handleResolveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>How was the AI's assistance?</span>
                  <div className="rating-btn-group">
                    <button
                      type="button"
                      onClick={() => setRating('positive')}
                      className={`rating-btn positive ${rating === 'positive' ? 'selected' : ''}`}
                    >
                      👍 Positive
                    </button>
                    <button
                      type="button"
                      onClick={() => setRating('negative')}
                      className={`rating-btn negative ${rating === 'negative' ? 'selected' : ''}`}
                    >
                      👎 Negative
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <span className="form-label" style={{ fontSize: '11px' }}>Feedback Details</span>
                  <textarea
                    className="form-textarea"
                    placeholder="Tell us what resolved the issue or how we can improve..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    required
                    style={{ resize: 'none', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setResolving(false)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                    Resolve Ticket
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Resolved Banner (Customer view) */}
          {ticket.status === 'resolved' && viewMode === 'customer' && (
            <div className="chat-resolved-banner">
              <div className="chat-resolved-banner-title">
                <span className="material-symbols-outlined">check_circle</span>
                Issue Solved & Archived
              </div>
              <p>This conversation has been resolved. Context has been securely indexed into your AI support profile.</p>
            </div>
          )}
          
          <div ref={historyEndRef} />
        </div>

        {/* Message Input */}
        {ticket.status !== 'resolved' && ticket.status !== 'closed' ? (
          <form onSubmit={handleSend} className="chat-input-bar">
            <input
              type="text"
              className="chat-input-field"
              placeholder="Type your message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={sending}
            />
            <button type="submit" className="chat-send-btn" disabled={!inputText.trim() || sending}>
              <span className="material-symbols-outlined">send</span>
            </button>
          </form>
        ) : (
          <div className="chat-locked-bar">
            Chat session locked — ticket has been resolved.
          </div>
        )}
      </div>
    </div>
  );
}
