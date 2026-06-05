import type { Ticket } from "../types";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewTicketClick: () => void;
  portalMode: 'agent' | 'customer';
  onSignOut?: () => void;
  // Customer ticket lists props
  customerTickets?: Ticket[];
  selectedTicketId?: string | null;
  onTicketSelect?: (id: string) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  onNewTicketClick,
  portalMode,
  onSignOut,
  customerTickets = [],
  selectedTicketId,
  onTicketSelect,
}: SidebarProps) {
  
  const isAgent = portalMode === 'agent';

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "tickets-log", label: "Tickets Log", icon: "confirmation_number" },
  ];

  return (
    <aside
      style={{
        width: "var(--sidebar-width)",
        backgroundColor: "#1f2937", // inverse-surface dark slate
        color: "#f3f4f6",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "var(--spacing-lg) 0",
        borderRight: "1px solid rgba(255, 255, 255, 0.08)",
        flexShrink: 0,
      }}
    >
      {/* Brand Header */}
      <div style={{ padding: "0 var(--spacing-lg)", marginBottom: "var(--spacing-xl)" }}>
        <h1 style={{ fontSize: "18px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "24px", color: "var(--color-primary-fixed-dim)" }}>
            psychology
          </span>
          {isAgent ? "Support Hub" : "User Portal"}
        </h1>
        <p style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.5)", marginTop: "2px", letterSpacing: "0.02em" }}>
          {isAgent ? "Agent Command Center" : "Customer Support Portal"}
        </p>
      </div>

      {/* Conditional Sidebar Navigation Items */}
      {isAgent ? (
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--spacing-xs)", padding: "0 var(--spacing-md)" }}>
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--spacing-md)",
                  padding: "10px var(--spacing-md)",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  background: isActive ? "var(--color-primary)" : "transparent",
                  color: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.7)",
                  textAlign: "left",
                  cursor: "pointer",
                  width: "100%",
                  fontSize: "13px",
                  fontWeight: "500",
                  transition: "all 0.15s ease",
                  borderLeft: isActive ? "4px solid #ffffff" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
                  }
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>
      ) : (
        /* Customer Conversation History (LLM style list) */
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--spacing-xs)", padding: "0 var(--spacing-md)", overflowY: "auto" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "rgba(255, 255, 255, 0.4)", marginBottom: "8px", padding: "0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Conversations
          </div>
          {customerTickets.length > 0 ? (
            customerTickets.map((t) => {
              const isActive = selectedTicketId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onTicketSelect?.(t.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--spacing-sm)",
                    padding: "10px 12px",
                    border: "none",
                    borderRadius: "var(--radius-md)",
                    background: isActive ? "var(--color-primary)" : "transparent",
                    color: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.7)",
                    textAlign: "left",
                    cursor: "pointer",
                    width: "100%",
                    fontSize: "12px",
                    fontWeight: "500",
                    transition: "all 0.15s ease",
                    borderLeft: isActive ? "4px solid #ffffff" : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px", color: t.status === 'resolved' ? "#10b981" : "rgba(255, 255, 255, 0.4)" }}>
                    {t.status === 'resolved' ? "check_circle" : "chat_bubble"}
                  </span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                    {t.subject}
                  </span>
                </button>
              );
            })
          ) : (
            <div style={{ padding: "12px 8px", fontSize: "11px", color: "rgba(255, 255, 255, 0.3)", fontStyle: "italic" }}>
              No complaints filed
            </div>
          )}
        </div>
      )}

      {/* Bottom Actions */}
      <div style={{ padding: "0 var(--spacing-md)", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "var(--spacing-lg)" }}>
        
        {/* Sign Out Button (Customer Mode only) */}
        {!isAgent && onSignOut && (
          <button
            onClick={onSignOut}
            style={{
              width: "100%",
              padding: "10px var(--spacing-md)",
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              color: "var(--color-error)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "var(--radius-md)",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "var(--spacing-md)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.08)";
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              logout
            </span>
            Sign Out Session
          </button>
        )}

        {/* Action Button: File complaint / New ticket */}
        {!isAgent ? (
          <button
            onClick={onNewTicketClick}
            style={{
              width: "100%",
              padding: "12px var(--spacing-md)",
              backgroundColor: "var(--color-primary)",
              color: "#ffffff",
              border: "none",
              borderRadius: "var(--radius-md)",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(53, 37, 205, 0.2)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              add_circle
            </span>
            File a Complaint
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)" }}>
            <button
              onClick={onNewTicketClick}
              style={{
                width: "100%",
                padding: "12px var(--spacing-md)",
                backgroundColor: "var(--color-secondary)",
                color: "#ffffff",
                border: "none",
                borderRadius: "var(--radius-md)",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                add_circle
              </span>
              New Ticket
            </button>
            <div
              style={{
                textAlign: "center",
                fontSize: "10px",
                color: "rgba(255, 255, 255, 0.4)",
                marginTop: "4px",
                fontWeight: "600",
                textTransform: "uppercase",
              }}
            >
              🔒 Administrative Mode
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--spacing-sm)",
            marginTop: "var(--spacing-lg)",
            padding: "0 var(--spacing-xs)",
            color: "rgba(255, 255, 255, 0.4)",
            fontSize: "11px",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
            info
          </span>
          System Stable v2.0
        </div>
      </div>
    </aside>
  );
}
