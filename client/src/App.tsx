import { useState, useEffect } from "react";
import { checkHealth, getTickets, getUserById } from "./api";
import type { Ticket, HealthCheckResponse, User } from "./types";
import { getCookie, setCookie, deleteCookie } from "./utils/cookieUtils";

// Component imports
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DashboardView from "./components/DashboardView";
import ChatView from "./components/ChatView";
import NewTicketModal from "./components/NewTicketModal";
import CustomerLogin from "./components/CustomerLogin";

function App() {
  // 1. Path-based Routing
  const isAdmin = window.location.pathname === "/admin";

  // Portal & Session States
  const [portalMode] = useState<'agent' | 'customer'>(isAdmin ? 'agent' : 'customer');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingSession, setLoadingSession] = useState<boolean>(!isAdmin); // only loading session for customers

  // Navigation & UI State
  const [activeTab, setActiveTab] = useState<string>(isAdmin ? "dashboard" : "customer-portal");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showNewTicketModal, setShowNewTicketModal] = useState<boolean>(false);

  // Data State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loadingTickets, setLoadingTickets] = useState<boolean>(true);
  const [serverOnline, setServerOnline] = useState<boolean>(false);
  const [dbConnected, setDbConnected] = useState<boolean>(false);

  // 1. Load Cookie Session (Customer Mode)
  useEffect(() => {
    if (isAdmin) return;

    async function verifySession() {
      const sessionId = getCookie("customer_session_id");
      if (sessionId) {
        try {
          const res = await getUserById(sessionId);
          if (res.success && res.data) {
            setCurrentUser(res.data);
          } else {
            // Invalid session cookie, clear it
            deleteCookie("customer_session_id");
          }
        } catch (err) {
          console.error("Failed to verify customer cookie session", err);
        }
      }
      setLoadingSession(false);
    }

    verifySession();
  }, [isAdmin]);

  // 2. Fetch server health and db connection
  useEffect(() => {
    async function getHealth() {
      try {
        const res = await checkHealth();
        if (res.success && res.data) {
          setHealth(res.data);
          setServerOnline(true);
          setDbConnected(res.data.database.connected);
        } else {
          setServerOnline(true);
          setDbConnected(false);
        }
      } catch {
        setServerOnline(false);
        setDbConnected(false);
      }
    }

    getHealth();
    const interval = setInterval(getHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  // 3. Fetch tickets
  const loadTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await getTickets();
      if (res.success && res.data) {
        setTickets(res.data);
      }
    } catch (err) {
      console.error("Failed to load tickets", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  // Handle successful login
  const handleIdentifySuccess = (user: User) => {
    setCookie("customer_session_id", user.id, 7); // Save session cookie for 7 days
    setCurrentUser(user);
    loadTickets(); // Reload tickets for identified user
  };

  // Handle Sign Out
  const handleSignOut = () => {
    deleteCookie("customer_session_id");
    setCurrentUser(null);
    setSelectedTicketId(null);
    setActiveTab("customer-portal");
  };

  // Handle click on ticket in table
  const handleTicketSelect = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setActiveTab("customer-portal");
  };

  // Handle successful creation of new ticket
  const handleNewTicketSuccess = (ticketId: string) => {
    setShowNewTicketModal(false);
    loadTickets(); // Refresh ticket list
    setSelectedTicketId(ticketId); // Select the newly created ticket
    setActiveTab("customer-portal"); // Open the chat portal immediately!
  };

  // Render current tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardView
            tickets={tickets}
            loading={loadingTickets}
            onTicketSelect={handleTicketSelect}
            onNewTicketClick={() => setShowNewTicketModal(true)}
          />
        );

      case "customer-portal":
        return selectedTicketId ? (
          <ChatView
            ticketId={selectedTicketId}
            onStatusUpdate={loadTickets}
            viewMode={portalMode}
          />
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "var(--spacing-xl)",
              backgroundColor: "var(--color-bg)",
              textAlign: "center",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                maxWidth: "600px",
                padding: "var(--spacing-xl)",
                backgroundColor: "var(--color-surface-lowest)",
                borderRadius: "var(--radius-xl)",
                border: "1px solid var(--color-surface)",
                boxShadow: "var(--shadow-lg)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "var(--spacing-lg)",
                transition: "all 0.3s ease",
              }}
            >
              {/* Animated/Glowing Icon */}
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(53, 37, 205, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-primary)",
                  boxShadow: "var(--shadow-glow)",
                  marginBottom: "var(--spacing-sm)",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "36px" }}>
                  forum
                </span>
              </div>

              {/* Title & Subtitle */}
              <div>
                <h3
                  style={{
                    fontSize: "24px",
                    fontWeight: "800",
                    background: "linear-gradient(135deg, var(--color-primary), #4f46e5)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    marginBottom: "var(--spacing-sm)",
                  }}
                >
                  Hello, {currentUser?.name || "Valued Customer"}!
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--color-text-secondary)",
                    lineHeight: "1.6",
                  }}
                >
                  Welcome to the Customer Support Portal. Your conversations are powered by secure cookie sessions and adaptive AI memory.
                </p>
              </div>

              {/* Action Information Cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--spacing-md)",
                  width: "100%",
                  margin: "8px 0",
                }}
              >
                <div
                  style={{
                    padding: "var(--spacing-md)",
                    backgroundColor: "var(--color-surface-low)",
                    borderRadius: "var(--radius-md)",
                    textAlign: "left",
                    border: "1px solid rgba(0, 0, 0, 0.02)",
                  }}
                >
                  <h4 style={{ fontSize: "13px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", color: "var(--color-text-primary)", marginBottom: "4px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--color-primary)" }}>
                      quickreply
                    </span>
                    Chat History
                  </h4>
                  <p style={{ fontSize: "11px", color: "var(--color-text-muted)", lineHeight: "1.4" }}>
                    Select any of your previous support tickets from the left panel to resume your chat session.
                  </p>
                </div>
                <div
                  style={{
                    padding: "var(--spacing-md)",
                    backgroundColor: "var(--color-surface-low)",
                    borderRadius: "var(--radius-md)",
                    textAlign: "left",
                    border: "1px solid rgba(0, 0, 0, 0.02)",
                  }}
                >
                  <h4 style={{ fontSize: "13px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", color: "var(--color-text-primary)", marginBottom: "4px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--color-primary)" }}>
                      rate_review
                    </span>
                    New Ticket
                  </h4>
                  <p style={{ fontSize: "11px", color: "var(--color-text-muted)", lineHeight: "1.4" }}>
                    Need fresh assistance? Click "File a Complaint" below to instantly spawn an AI-assisted ticket.
                  </p>
                </div>
              </div>

              {/* Main Call to Action */}
              <button
                className="btn-primary"
                onClick={() => setShowNewTicketModal(true)}
                style={{
                  padding: "12px 24px",
                  fontSize: "14px",
                  fontWeight: "600",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(53, 37, 205, 0.2)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
              >
                <span className="material-symbols-outlined">add_circle</span>
                File a Complaint
              </button>
            </div>
          </div>
        );

      case "tickets-log":
        return (
          <div className="scrollable-body animate-fade-in">
            <h3 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "var(--spacing-lg)" }}>
              Tickets Log Directory
            </h3>
            
            <div className="bento-card" style={{ padding: 0, overflow: "hidden" }}>
              {loadingTickets ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
                  Loading logs...
                </div>
              ) : tickets.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
                  No tickets found.
                </div>
              ) : (
                <table className="activity-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Customer Name</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket) => (
                      <tr key={ticket.id} onClick={() => handleTicketSelect(ticket.id)}>
                        <td style={{ fontWeight: "600" }}>{ticket.subject}</td>
                        <td>{ticket.customer_name}</td>
                        <td style={{ textTransform: "uppercase", fontSize: "12px" }}>{ticket.priority}</td>
                        <td>
                          <span className={`badge ${ticket.status === 'resolved' ? 'badge-resolved' : 'badge-open'}`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td>{new Date(ticket.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );

      default:
        return <div>Tab not implemented</div>;
    }
  };

  // 1. Render Loading State (For checking cookie session on Customer mode)
  if (loadingSession) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-bg)", color: "var(--color-text-muted)" }}>
        Verifying support portal session...
      </div>
    );
  }

  // 2. Render Login gateway if Customer is not signed in
  if (!isAdmin && !currentUser) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <header
          style={{
            height: "var(--header-height)",
            backgroundColor: "var(--color-surface-lowest)",
            borderBottom: "1px solid var(--color-surface)",
            padding: "0 var(--spacing-lg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2 style={{ fontSize: "15px", fontWeight: "700", color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>support_agent</span>
            Customer Support Portal
          </h2>
          <div style={{ display: "flex", gap: "var(--spacing-sm)", fontSize: "11px", fontWeight: "600", color: "var(--color-text-muted)" }}>
            Server connection secure
          </div>
        </header>
        <CustomerLogin onIdentifySuccess={handleIdentifySuccess} />
      </div>
    );
  }

  // 3. Render authenticated layout (Customer or Admin)
  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewTicketClick={() => setShowNewTicketModal(true)}
        portalMode={portalMode}
        onSignOut={handleSignOut}
        customerTickets={tickets.filter(t => t.user_id === currentUser?.id)}
        selectedTicketId={selectedTicketId}
        onTicketSelect={handleTicketSelect}
      />

      {/* Main Panel */}
      <div className="main-content">
        {/* Top Navbar */}
        <Header
          dbConnected={dbConnected}
          serverOnline={serverOnline}
          portalMode={portalMode}
          users={currentUser ? [currentUser] : []}
          selectedCustomerId={currentUser?.id || ""}
          setSelectedCustomerId={() => {}} // User ID locked by cookie
        />

        {/* Dynamic Tab Body */}
        {renderTabContent()}
      </div>

      {/* New Ticket Overlay Modal */}
      {showNewTicketModal && (
        <NewTicketModal
          onClose={() => setShowNewTicketModal(false)}
          onSuccess={handleNewTicketSuccess}
          preselectedUserId={currentUser?.id || undefined}
        />
      )}
    </div>
  );
}

export default App;
