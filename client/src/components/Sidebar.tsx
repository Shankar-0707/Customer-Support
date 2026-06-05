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
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <h1 className="sidebar-brand-title">
          <span className="sidebar-brand-icon">
            <span className="material-symbols-outlined">support_agent</span>
          </span>
          {isAgent ? "SupportDesk" : "SupportDesk"}
        </h1>
        <p className="sidebar-brand-subtitle">
          {isAgent ? "Agent Command Center" : "Customer Portal"}
        </p>
      </div>

      {/* Navigation */}
      {isAgent ? (
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      ) : (
        <div className="sidebar-nav">
          <div className="sidebar-section-label">Conversations</div>
          {customerTickets.length > 0 ? (
            customerTickets.map((t) => (
              <button
                key={t.id}
                onClick={() => onTicketSelect?.(t.id)}
                className={`sidebar-ticket-item ${selectedTicketId === t.id ? 'active' : ''}`}
              >
                <span
                  className={`sidebar-ticket-status-dot ${t.status === 'resolved' ? 'resolved' : 'open'}`}
                />
                <span className="sidebar-ticket-subject">{t.subject}</span>
              </button>
            ))
          ) : (
            <div className="sidebar-empty-state">No conversations yet</div>
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div className="sidebar-footer">
        {/* Sign Out (Customer only) */}
        {!isAgent && onSignOut && (
          <button onClick={onSignOut} className="sidebar-signout-btn">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>logout</span>
            Sign Out
          </button>
        )}

        {/* Primary Action Button */}
        {!isAgent ? (
          <button onClick={onNewTicketClick} className="sidebar-btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
            File a Complaint
          </button>
        ) : (
          <div className="sidebar-version" style={{ marginTop: '12px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>lock</span>
            Administrative Mode
          </div>
        )}

        <div className="sidebar-version">
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>info</span>
          v2.0 — System Stable
        </div>
      </div>
    </aside>
  );
}
