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
  portalMode,
  users,
  selectedCustomerId,
  setSelectedCustomerId,
}: HeaderProps) {
  
  const isAgent = portalMode === 'agent';
  const activeUser = users.find(u => u.id === selectedCustomerId);

  return (
    <header className="app-header">
      {/* Left: Breadcrumbs & Search */}
      <div className="header-left">
        <div className="header-breadcrumbs">
          <span className="breadcrumb-main">{isAgent ? "Console" : "Portal"}</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-sub">{isAgent ? "Inbox" : "Support"}</span>
        </div>
        
        {isAgent && (
          <div className="header-search">
            <span className="material-symbols-outlined header-search-icon">search</span>
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
        {/* Profile / Customer Selector */}
        {isAgent ? (
          <div className="header-profile">
            <div className="header-avatar">AS</div>
            <div className="header-profile-info">
              <p className="header-profile-name">Agent Smith</p>
              <p className="header-profile-role">Admin Console</p>
            </div>
          </div>
        ) : (
          <div className="header-profile">
            <div className="header-customer-select-wrapper">
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="header-customer-select"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="header-avatar">
              {activeUser ? activeUser.name.split(' ').map(n=>n[0]).join('') : "CU"}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
