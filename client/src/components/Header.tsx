import type { User } from "../types";

interface HeaderProps {
  dbConnected: boolean;
  serverOnline: boolean;
  portalMode: "agent" | "customer";
  users: User[];
  selectedCustomerId: string;
  theme: "dark" | "light";
  onThemeToggle: () => void;
}

export default function Header({
  portalMode,
  users,
  selectedCustomerId,
  theme,
  onThemeToggle,
}: HeaderProps) {
  const isAgent = portalMode === "agent";
  const activeUser = users.find((u) => u.id === selectedCustomerId);

  return (
    <header className="app-header">
      {/* Left: Breadcrumbs & Search */}
      <div className="header-left">
        <div className="header-breadcrumbs">
          <span className="breadcrumb-main">
            {isAgent ? "Console" : "Portal"}
          </span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-sub">
            {isAgent ? "Inbox" : "Support"}
          </span>
        </div>

        {isAgent && (
          <div className="header-search">
            <span className="material-symbols-outlined header-search-icon">
              search
            </span>
            <input
              type="text"
              className="header-search-input"
              placeholder="Search tickets..."
            />
            <kbd className="header-search-kbd">/</kbd>
          </div>
        )}
      </div>

      {/* Right: Actions & Profile */}
      <div className="header-right">
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={onThemeToggle}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          <span className="material-symbols-outlined">
            {theme === "dark" ? "light_mode" : "dark_mode"}
          </span>
        </button>

        {/* Profile / Customer Selector */}
        {isAgent ? (
          <div className="header-profile">
            <button
              type="button"
              className="header-avatar"
              aria-label="Agent profile"
            >
              AS
            </button>
            <div className="header-profile-info">
              <p className="header-profile-name">Agent Smith</p>
              <p className="header-profile-role">Admin Console</p>
            </div>
          </div>
        ) : (
          <div className="header-profile">
            <button
              type="button"
              className="header-avatar"
              aria-label="Customer profile"
            >
              {activeUser
                ? activeUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                : "CU"}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
