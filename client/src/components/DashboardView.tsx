
import type { Ticket } from "../types";

interface DashboardViewProps {
  tickets: Ticket[];
  loading: boolean;
  onTicketSelect: (ticketId: string) => void;
  onNewTicketClick: () => void;
}

export default function DashboardView({ tickets, loading, onTicketSelect, onNewTicketClick }: DashboardViewProps) {
  // Compute some stats
  const totalTicketsCount = tickets.length;
  const openTicketsCount = tickets.filter(t => t.status === 'open').length;
  const resolvedTicketsCount = tickets.filter(t => t.status === 'resolved').length;

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'critical': return 'priority-high';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      default: return 'priority-low';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved': return <span className="badge badge-resolved">Resolved</span>;
      case 'closed': return <span className="badge badge-closed">Closed</span>;
      case 'in_progress': return <span className="badge badge-pending">In Progress</span>;
      default: return <span className="badge badge-open">Open</span>;
    }
  };

  // Generate a mock memory match based on ticket subject for visual fidelity
  const getMockMemoryMatch = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes("rate") || s.includes("limit")) {
      return (
        <span style={{ color: "var(--color-tertiary-light)", display: "flex", alignItems: "center", gap: "4px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>auto_awesome</span>
          92% Match (Hindsight)
        </span>
      );
    }
    if (s.includes("sso") || s.includes("auth") || s.includes("login")) {
      return (
        <span style={{ color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>history</span>
          New Context Detected
        </span>
      );
    }
    if (s.includes("seat") || s.includes("license")) {
      return (
        <span style={{ color: "var(--color-tertiary-light)", display: "flex", alignItems: "center", gap: "4px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>done_all</span>
          Resolved via Memory Bank
        </span>
      );
    }
    return (
      <span style={{ color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>psychology</span>
        84% AI Match
      </span>
    );
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="scrollable-body animate-fade-in">
      {/* Welcome Banner */}
      <section style={{ marginBottom: "var(--spacing-xl)" }}>
        <h3 style={{ fontSize: "28px", fontWeight: "800", color: "var(--color-text-primary)", letterSpacing: "-0.02em", marginBottom: "4px" }}>
          Welcome back, Agent
        </h3>
        <p style={{ fontSize: "15px", color: "var(--color-text-secondary)" }}>
          The AI ecosystem is stable. You have {openTicketsCount} open support tickets requiring your attention.
        </p>
      </section>

      {/* Bento Grid */}
      <div className="bento-grid">
        {/* System Health Status */}
        <div className="bento-card" style={{ gridColumn: "span 8" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-lg)" }}>
            <h4 style={{ fontSize: "15px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--color-primary)" }}>
                health_metrics
              </span>
              System Health
            </h4>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "600",
                color: "var(--color-tertiary)",
                background: "rgba(16, 185, 129, 0.08)",
                padding: "4px 10px",
                borderRadius: "var(--radius-full)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  backgroundColor: "var(--color-tertiary-light)",
                  borderRadius: "50%",
                  display: "inline-block",
                }}
              />
              All Systems Operational
            </span>
          </div>

          {/* Metric Sub-grid */}
          <div className="metric-grid">
            <div className="metric-card">
              <div className="metric-header">
                <span>AI Inference (Groq)</span>
                <span className="material-symbols-outlined" style={{ color: "var(--color-primary)", fontSize: "18px" }}>
                  psychology
                </span>
              </div>
              <div className="metric-value">42ms</div>
              <div style={{ height: "4px", background: "var(--color-surface-high)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                <div style={{ width: "88%", height: "100%", background: "var(--color-primary)" }} />
              </div>
              <div className="metric-footer" style={{ marginTop: "6px" }}>P99 Latency</div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span>Memory (Hindsight)</span>
                <span className="material-symbols-outlined" style={{ color: "var(--color-tertiary-light)", fontSize: "18px" }}>
                  database
                </span>
              </div>
              <div className="metric-value">99.9%</div>
              <div style={{ height: "4px", background: "var(--color-surface-high)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                <div style={{ width: "99%", height: "100%", background: "var(--color-tertiary-light)" }} />
              </div>
              <div className="metric-footer" style={{ marginTop: "6px" }}>Retrieval Accuracy</div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span>DB (PostgreSQL)</span>
                <span className="material-symbols-outlined" style={{ color: "var(--color-secondary)", fontSize: "18px" }}>
                  storage
                </span>
              </div>
              <div className="metric-value">{totalTicketsCount} Records</div>
              <div style={{ height: "4px", background: "var(--color-surface-high)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                <div style={{ width: "45%", height: "100%", background: "var(--color-secondary)" }} />
              </div>
              <div className="metric-footer" style={{ marginTop: "6px" }}>Seeded & Live Tickets</div>
            </div>
          </div>
        </div>

        {/* Memory Banks & Training Status */}
        <div style={{ gridColumn: "span 4", display: "flex", flexDirection: "column", gap: "var(--spacing-lg)" }}>
          {/* Memory Banks summary card */}
          <div
            className="bento-card"
            style={{
              background: "linear-gradient(135deg, var(--color-primary) 0%, #4f46e5 100%)",
              color: "#ffffff",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 8px 24px rgba(79, 70, 229, 0.2)",
              border: "none",
            }}
          >
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "var(--spacing-md)", opacity: 0.9 }}>
                Hindsight Memory Banks
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", opacity: 0.8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>person_search</span>
                    Customer Profile Memory
                  </span>
                  <span style={{ fontWeight: "700" }}>{resolvedTicketsCount > 0 ? "Synced" : "Awaiting"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", opacity: 0.8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>verified_user</span>
                    Resolution Vector Bank
                  </span>
                  <span style={{ fontWeight: "700" }}>{resolvedTicketsCount} Solutions</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Training Status card */}
          <div className="bento-card" style={{ flex: 1, display: "flex", alignItems: "center", gap: "var(--spacing-md)" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                border: "3px solid var(--color-primary)",
                borderTopColor: "transparent",
                animation: "spin 1s linear infinite",
              }}
            />
            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
            <div>
              <h5 style={{ fontSize: "13px", fontWeight: "700", color: "var(--color-text-primary)" }}>
                AI Vector Re-indexing
              </h5>
              <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                Auto-indexing solutions from resolved tickets...
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity (Tickets Table) */}
      <section className="bento-card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "var(--spacing-md) var(--spacing-lg)",
            borderBottom: "1px solid var(--color-surface)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h4 style={{ fontSize: "15px", fontWeight: "700", color: "var(--color-text-primary)" }}>
            Support Tickets Directory
          </h4>
          <button
            onClick={onNewTicketClick}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-primary)",
              fontWeight: "600",
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            Create Ticket
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add</span>
          </button>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
            Loading tickets from Neon DB...
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ padding: "60px 40px", textAlign: "center", color: "var(--color-text-muted)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "48px", marginBottom: "12px", color: "var(--color-surface-highest)" }}>
              drafts
            </span>
            <p style={{ fontSize: "14px", fontWeight: "500" }}>No tickets found in the database.</p>
            <button className="btn-primary" onClick={onNewTicketClick} style={{ marginTop: "16px" }}>
              File Your First Ticket
            </button>
          </div>
        ) : (
          <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Ticket Details</th>
                  <th>Customer</th>
                  <th>Memory Match Status</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Last Update</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} onClick={() => onTicketSelect(ticket.id)}>
                    <td>
                      <div style={{ fontWeight: "600", color: "var(--color-text-primary)" }}>{ticket.subject}</div>
                      <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px", display: "flex", gap: "8px" }}>
                        <span>ID: #{ticket.id.substring(0, 8)}</span>
                        <span>•</span>
                        <span className={getPriorityClass(ticket.priority)}>
                          {ticket.priority.toUpperCase()} PRIORITY
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "var(--radius-sm)",
                            backgroundColor: "var(--color-secondary-container)",
                            color: "var(--color-primary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            fontWeight: "700",
                          }}
                        >
                          {ticket.customer_name ? ticket.customer_name.split(' ').map(n=>n[0]).join('') : "CU"}
                        </div>
                        <span>{ticket.customer_name || "Customer"}</span>
                      </div>
                    </td>
                    <td>{getMockMemoryMatch(ticket.subject)}</td>
                    <td>{getStatusBadge(ticket.status)}</td>
                    <td style={{ textAlign: "right", color: "var(--color-text-muted)", fontSize: "12px" }}>
                      {formatTimeAgo(ticket.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
