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
  const getInitialTheme = (): 'dark' | 'light' => {
    const storedTheme = localStorage.getItem("supportdesk_theme");
    return storedTheme === "light" ? "light" : "dark";
  };

  // Portal & Session States
  const [portalMode] = useState<'agent' | 'customer'>(isAdmin ? 'agent' : 'customer');
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme);
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

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("supportdesk_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(currentTheme => currentTheme === "dark" ? "light" : "dark");
  };

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
          <div className="portal-welcome-container">
            <div className="portal-welcome-card">
              <div className="portal-welcome-icon">
                <span className="material-symbols-outlined">forum</span>
              </div>

              <div>
                <h3 className="portal-welcome-title">
                  Hello, {currentUser?.name || "Valued Customer"}!
                </h3>
                <p className="portal-welcome-subtitle">
                  Welcome to the Customer Support Portal. Your conversations are powered by secure cookie sessions and adaptive AI memory.
                </p>
              </div>

              <div className="portal-welcome-grid">
                <div className="portal-welcome-feature">
                  <h4 className="portal-welcome-feature-title">
                    <span className="material-symbols-outlined">quickreply</span>
                    Chat History
                  </h4>
                  <p>
                    Select any of your previous support tickets from the left panel to resume your chat session.
                  </p>
                </div>
                <div className="portal-welcome-feature">
                  <h4 className="portal-welcome-feature-title">
                    <span className="material-symbols-outlined">rate_review</span>
                    New Ticket
                  </h4>
                  <p>
                    Need fresh assistance? Click "File a Complaint" below to instantly spawn an AI-assisted ticket.
                  </p>
                </div>
              </div>

              <button
                className="btn-primary"
                onClick={() => setShowNewTicketModal(true)}
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
            <h3 className="tickets-log-title">
              Tickets Log Directory
            </h3>
            
            <div className="table-container">
              {loadingTickets ? (
                <div className="table-loading">
                  Loading logs...
                </div>
              ) : tickets.length === 0 ? (
                <div className="table-empty">
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
                        <td className="ticket-detail-subject">{ticket.subject}</td>
                        <td>{ticket.customer_name}</td>
                        <td className={`priority-${ticket.priority}`}>{ticket.priority}</td>
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
      <div className="loading-screen">
        <div className="loading-spinner" />
        <span>Verifying support portal session...</span>
      </div>
    );
  }

  // 2. Render Login gateway if Customer is not signed in
  if (!isAdmin && !currentUser) {
    return (
      <div className="app-container" data-theme={theme} style={{ flexDirection: "column" }}>
        <header className="login-page-header">
          <h2 className="login-page-title">
            <span className="material-symbols-outlined">support_agent</span>
            Customer Support Portal
          </h2>
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <span className="material-symbols-outlined">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </header>
        <CustomerLogin onIdentifySuccess={handleIdentifySuccess} />
      </div>
    );
  }

  // 3. Render authenticated layout (Customer or Admin)
  return (
    <div className="app-container" data-theme={theme}>
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
          theme={theme}
          onThemeToggle={toggleTheme}
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
