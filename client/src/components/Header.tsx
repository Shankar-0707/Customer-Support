import type { User } from "../types";

interface HeaderProps {
  dbConnected: boolean;
  serverOnline: boolean;
  portalMode: 'agent' | 'customer';
  users: User[];
  selectedCustomerId: string;
  setSelectedCustomerId: (id: string) => void;
}

export default function Header({
  dbConnected,
  serverOnline,
  portalMode,
  users,
  selectedCustomerId,
  setSelectedCustomerId,
}: HeaderProps) {
  
  const isAgent = portalMode === 'agent';
  const activeUser = users.find(u => u.id === selectedCustomerId);

  return (
    <header
      style={{
        height: "var(--header-height)",
        backgroundColor: "var(--color-surface-lowest)",
        borderBottom: "1px solid var(--color-surface)",
        padding: "0 var(--spacing-lg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 40,
        position: "sticky",
        top: 0,
        flexShrink: 0,
      }}
    >
      {/* Title & Search bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-lg)" }}>
        <h2 style={{ fontSize: "15px", fontWeight: "700", color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
            {isAgent ? "shield_person" : "person"}
          </span>
          {isAgent ? "Agent Command Center" : "Customer Support Portal"}
        </h2>
        
        {isAgent && (
          <div style={{ position: "relative" }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-muted)",
                fontSize: "18px",
              }}
            >
              search
            </span>
            <input
              type="text"
              placeholder="Search memory banks..."
              style={{
                padding: "8px 16px 8px 38px",
                backgroundColor: "var(--color-surface-low)",
                border: "none",
                borderRadius: "var(--radius-full)",
                fontSize: "13px",
                width: "200px",
                outline: "none",
                transition: "all 0.2s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.width = "260px";
                e.currentTarget.style.backgroundColor = "var(--color-surface-lowest)";
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(53, 37, 205, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.width = "200px";
                e.currentTarget.style.backgroundColor = "var(--color-surface-low)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
        )}
      </div>

      {/* Statuses, Notifications and Profile */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-lg)" }}>
        
        {/* Connection Status Badges */}
        <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
          {/* Server status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "11px",
              fontWeight: "600",
              color: serverOnline ? "var(--color-tertiary-light)" : "var(--color-error)",
              padding: "4px 10px",
              borderRadius: "var(--radius-full)",
              backgroundColor: serverOnline ? "rgba(16, 185, 129, 0.08)" : "rgba(186, 26, 26, 0.08)",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: serverOnline ? "var(--color-tertiary-light)" : "var(--color-error)",
                display: "inline-block",
              }}
            />
            Server: {serverOnline ? "Online" : "Offline"}
          </div>

          {/* Database status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "11px",
              fontWeight: "600",
              color: dbConnected ? "var(--color-tertiary-light)" : "var(--color-error)",
              padding: "4px 10px",
              borderRadius: "var(--radius-full)",
              backgroundColor: dbConnected ? "rgba(16, 185, 129, 0.08)" : "rgba(186, 26, 26, 0.08)",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: dbConnected ? "var(--color-tertiary-light)" : "var(--color-error)",
                display: "inline-block",
              }}
            />
            Neon DB: {dbConnected ? "Connected" : "Disconnected"}
          </div>
        </div>

        {/* Vertical Separator */}
        <div style={{ width: "1px", height: "24px", backgroundColor: "var(--color-surface)" }} />

        {/* Profile Card / Dropdown Switcher */}
        {isAgent ? (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "13px", fontWeight: "700", color: "var(--color-text-primary)", lineHeight: "1.2" }}>
                Agent Smith
              </p>
              <p style={{ fontSize: "11px", color: "var(--color-text-muted)", lineHeight: "1" }}>
                Tier 3 Expert
              </p>
            </div>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "var(--color-primary-fixed-dim)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-primary)",
                fontWeight: "bold",
                fontSize: "14px",
                border: "2px solid var(--color-surface)",
              }}
            >
              AS
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-md)" }}>
            {/* Customer Dropdown to simulate different users */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "10px", fontWeight: "600", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                Simulating Customer
              </span>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                style={{
                  padding: "4px 8px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-surface-high)",
                  fontSize: "13px",
                  backgroundColor: "var(--color-surface-low)",
                  outline: "none",
                  fontWeight: "600",
                }}
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Simulated Customer Avatar */}
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "var(--color-secondary-container)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-primary)",
                fontWeight: "bold",
                fontSize: "14px",
                border: "2px solid var(--color-surface)",
              }}
            >
              {activeUser ? activeUser.name.split(' ').map(n=>n[0]).join('') : "CU"}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
