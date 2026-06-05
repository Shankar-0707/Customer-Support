import React, { useState } from "react";

interface AdminLoginProps {
  onSuccess: () => void;
  theme: "dark" | "light";
  onThemeToggle: () => void;
}

export default function AdminLogin({ onSuccess, theme, onThemeToggle }: AdminLoginProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD || "";

    if (password === correctPassword) {
      sessionStorage.setItem("admin_authenticated", "true");
      setError(null);
      onSuccess();
    } else {
      setError("Incorrect password. Access denied.");
      setShaking(true);
      setPassword("");
      setTimeout(() => setShaking(false), 600);
    }
  };

  return (
    <div className="app-container app-login-container" data-theme={theme}>
      {/* Header */}
      <header className="login-page-header">
        <h2 className="login-page-title">
          <span className="material-symbols-outlined">admin_panel_settings</span>
          SupportDesk — Admin
        </h2>
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
      </header>

      {/* Gate Card */}
      <div className={`login-container admin-login-container`}>
        <div className={`login-card ${shaking ? "admin-login-shake" : ""}`}>
          {/* Icon header */}
          <div className="login-header">
            <div className="login-icon-wrapper" style={{ background: "rgba(239,68,68,0.12)", color: "var(--color-error)" }}>
              <span className="material-symbols-outlined">lock</span>
            </div>
            <h3 className="login-title">Admin Access Required</h3>
            <p className="login-subtitle">
              This area is restricted to authorized administrators only. Enter the admin password to proceed.
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div
              className="modal-error"
              style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--spacing-md)" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>error</span>
              {error}
            </div>
          )}

          {/* Password form */}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="admin-password-input">
                Admin Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="admin-password-input"
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="Enter admin password..."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  autoFocus
                  required
                  style={{ paddingRight: "44px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-text-muted)",
                    display: "flex",
                    alignItems: "center",
                    padding: 0,
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary login-submit-btn"
              disabled={!password.trim()}
            >
              <span className="material-symbols-outlined">login</span>
              Access Admin Dashboard
            </button>
          </form>

          {/* Footer link */}
          <div className="login-tips">
            <p>
              Not an admin?{" "}
              <a href="/" style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 600 }}>
                Go to Customer Portal →
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
