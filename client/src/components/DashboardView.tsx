import type { Ticket } from "../types";

interface DashboardViewProps {
  tickets: Ticket[];
  loading: boolean;
  onTicketSelect: (ticketId: string) => void;
}

export default function DashboardView({
  tickets,
  loading,
  onTicketSelect,
}: DashboardViewProps) {
  // Compute some stats
  const totalTicketsCount = tickets.length;
  const openTicketsCount = tickets.filter((t) => t.status === "open").length;
  const resolvedTicketsCount = tickets.filter(
    (t) => t.status === "resolved",
  ).length;

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case "critical":
        return "priority-high";
      case "high":
        return "priority-high";
      case "medium":
        return "priority-medium";
      default:
        return "priority-low";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <span className="badge badge-resolved">Resolved</span>;
      case "closed":
        return <span className="badge badge-closed">Closed</span>;
      case "in_progress":
        return <span className="badge badge-pending">In Progress</span>;
      default:
        return <span className="badge badge-open">Open</span>;
    }
  };

  const getMockMemoryMatch = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes("rate") || s.includes("limit")) {
      return (
        <span className="memory-match-indicator match-positive">
          <span className="material-symbols-outlined">auto_awesome</span>
          92% Match
        </span>
      );
    }
    if (s.includes("sso") || s.includes("auth") || s.includes("login")) {
      return (
        <span className="memory-match-indicator match-secondary">
          <span className="material-symbols-outlined">history</span>
          New Context
        </span>
      );
    }
    if (s.includes("seat") || s.includes("license")) {
      return (
        <span className="memory-match-indicator match-positive">
          <span className="material-symbols-outlined">done_all</span>
          Resolved via Memory
        </span>
      );
    }
    return (
      <span className="memory-match-indicator match-muted">
        <span className="material-symbols-outlined">psychology</span>
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
      <section className="dashboard-welcome">
        <h3>Welcome back, Agent</h3>
        <p>
          Your AI support ecosystem is operating normally. You have{" "}
          <strong>
            {openTicketsCount} open ticket{openTicketsCount !== 1 ? "s" : ""}
          </strong>{" "}
          requiring attention.
        </p>
      </section>

      {/* Bento Grid */}
      <div className="bento-grid">
        {/* System Health Card */}
        <div className="bento-card dashboard-grid-main">
          <div className="bento-card-header">
            <h4 className="bento-card-title">
              <span className="material-symbols-outlined">monitoring</span>
              System Health
            </h4>
            <span className="system-status-pill">
              <span className="status-pulse-dot online" />
              All Systems Operational
            </span>
          </div>

          <div className="metric-grid">
            <div className="metric-card">
              <div className="metric-header">
                <span>AI Inference (Groq)</span>
                <span className="material-symbols-outlined dashboard-card-icon dashboard-card-icon-primary">
                  psychology
                </span>
              </div>
              <div className="metric-value">42ms</div>
              <div className="metric-progress-bar">
                <div className="metric-progress-fill teal dashboard-progress-88" />
              </div>
              <div className="metric-footer">P99 Latency</div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span>Memory (Hindsight)</span>
                <span className="material-symbols-outlined dashboard-card-icon dashboard-card-icon-success">
                  database
                </span>
              </div>
              <div className="metric-value">99.9%</div>
              <div className="metric-progress-bar">
                <div className="metric-progress-fill green dashboard-progress-99" />
              </div>
              <div className="metric-footer">Retrieval Accuracy</div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span>DB (PostgreSQL)</span>
                <span className="material-symbols-outlined dashboard-card-icon dashboard-card-icon-muted">
                  storage
                </span>
              </div>
              <div className="metric-value">{totalTicketsCount} Records</div>
              <div className="metric-progress-bar">
                <div className="metric-progress-fill slate dashboard-progress-45" />
              </div>
              <div className="metric-footer">Seeded & Live Tickets</div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="dashboard-grid-side">
          {/* Memory Banks Card */}
          <div className="bento-card bento-card-accent">
            <div>
              <h4 className="bento-card-title dashboard-memory-title">
                <span className="material-symbols-outlined dashboard-card-icon dashboard-card-icon-large">
                  neurology
                </span>
                Hindsight Memory
              </h4>
              <div className="dashboard-memory-stack">
                <div className="accent-card-row">
                  <span className="accent-card-row-label">
                    <span className="material-symbols-outlined dashboard-card-icon dashboard-card-icon-small">
                      person_search
                    </span>
                    Customer Profiles
                  </span>
                  <span className="accent-card-row-value">
                    {resolvedTicketsCount > 0 ? "Synced" : "Awaiting"}
                  </span>
                </div>
                <div className="accent-card-row">
                  <span className="accent-card-row-label">
                    <span className="material-symbols-outlined dashboard-card-icon dashboard-card-icon-small">
                      verified_user
                    </span>
                    Resolution Bank
                  </span>
                  <span className="accent-card-row-value">
                    {resolvedTicketsCount} Solutions
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Indexing Card */}
          <div className="bento-card dashboard-index-card">
            <div className="spinner-ring" />
            <div>
              <h5 className="dashboard-index-title">AI Vector Re-indexing</h5>
              <p className="dashboard-index-subtitle">
                Auto-indexing from resolved tickets...
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <section className="bento-card dashboard-ticket-section">
        <div className="table-header">
          <h4 className="table-header-title">Support Tickets</h4>
        </div>

        {loading ? (
          <div className="table-loading">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="table-empty">
            <span className="material-symbols-outlined table-empty-icon">
              inbox
            </span>
            <p>No tickets found in the database.</p>
          </div>
        ) : (
          <div className="table-container dashboard-table-container">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Ticket Details</th>
                  <th>Customer</th>
                  <th>Memory Match</th>
                  <th>Status</th>
                  <th className="dashboard-last-update">Last Update</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} onClick={() => onTicketSelect(ticket.id)}>
                    <td>
                      <div className="ticket-detail-subject">
                        {ticket.subject}
                      </div>
                      <div className="ticket-detail-meta">
                        <span>#{ticket.id.substring(0, 8)}</span>
                        <span>•</span>
                        <span className={getPriorityClass(ticket.priority)}>
                          {ticket.priority.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="customer-cell">
                        <div className="customer-cell-avatar">
                          {ticket.customer_name
                            ? ticket.customer_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                            : "CU"}
                        </div>
                        <span>{ticket.customer_name || "Customer"}</span>
                      </div>
                    </td>
                    <td>{getMockMemoryMatch(ticket.subject)}</td>
                    <td>{getStatusBadge(ticket.status)}</td>
                    <td className="time-ago-cell">
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
