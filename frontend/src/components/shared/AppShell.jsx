import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Radar,
  Map,
  Bell,
  Shield,
  Database,
  Bug,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useAuthStore, useThreatStore, useUIStore } from "../../store/index.js";
import { authAPI } from "../../services/api.js";
import { useClock } from "../../hooks/index.js";

const NAV = [
  {
    section: "OVERVIEW",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/feed", label: "Live Feed", icon: Radar, badgeKey: "total" },
      { to: "/map", label: "Attack Map", icon: Map },
    ],
  },
  {
    section: "ANALYSIS",
    items: [
      {
        to: "/scan",
        label: "Scan / Analyze",
        icon: Shield,
        badgeKey: "critical",
      },
      { to: "/datasets", label: "IP Datasets", icon: Database },
      { to: "/malware", label: "Malware DB", icon: Bug },
      { to: "/alerts", label: "Alerts", icon: Bell, badgeKey: "critical" },
    ],
  },
  {
    section: "SYSTEM",
    items: [
      { to: "/logs", label: "Logs", icon: FileText },
      { to: "/admin", label: "Admin Panel", icon: Settings },
    ],
  },
];

export default function AppShell() {
  const { user, clearAuth } = useAuthStore();
  const { stats, connected } = useThreatStore();
  const {
    sidebarOpen,
    toggleSidebar,
    offlineMode,
    setOfflineMode,
    soundEnabled,
    toggleSound,
  } = useUIStore();
  const clock = useClock();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);
  const [tl, setTL] = useState("HIGH");

  useEffect(() => {
    const h = (e) =>
      addToast(
        "🚨 " + e.detail.alert_type + " — " + e.detail.source_ip,
        "var(--red)",
      );
    window.addEventListener("ctv:critical_alert", h);
    return () => window.removeEventListener("ctv:critical_alert", h);
  }, []);

  useEffect(() => {
    if (stats.critical > 10) setTL("CRITICAL");
    else if (stats.critical > 3) setTL("HIGH");
    else setTL("ELEVATED");
  }, [stats.critical]);

  const addToast = (msg, color = "var(--cyan)") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, color }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch {}
    clearAuth();
    navigate("/login");
  };

  const badge = (key) => {
    const v = stats[key];
    if (!v) return null;
    const bg =
      key === "critical"
        ? "var(--red)"
        : key === "high"
          ? "var(--orange)"
          : "#2a3a4a";
    return (
      <span
        style={{
          marginLeft: "auto",
          background: bg,
          color: "#fff",
          fontSize: 10,
          fontWeight: 700,
          padding: "1px 6px",
          borderRadius: 10,
          fontFamily: "'JetBrains Mono',monospace",
        }}
      >
        {v > 99 ? "99+" : v}
      </span>
    );
  };

  const sb = sidebarOpen;
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <nav
        style={{
          width: sb ? 248 : 60,
          flexShrink: 0,
          background: "var(--bg1)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          overflowX: "hidden",
          transition: "width 0.25s ease",
        }}
      >
        <div
          style={{
            padding: "16px 14px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <svg
            viewBox="0 0 64 64"
            fill="none"
            width="30"
            height="30"
            style={{ flexShrink: 0 }}
          >
            <path
              d="M32 4L8 14V32C8 46.4 18.4 59.6 32 63C45.6 59.6 56 46.4 56 32V14L32 4Z"
              stroke="#00dcb4"
              strokeWidth="2"
              fill="rgba(0,220,180,0.06)"
            />
            <circle
              cx="32"
              cy="30"
              r="8"
              stroke="#00dcb4"
              strokeWidth="1.5"
              fill="rgba(0,220,180,0.1)"
            />
            <line
              x1="32"
              y1="14"
              x2="32"
              y2="22"
              stroke="#00dcb4"
              strokeWidth="1.5"
            />
            <line
              x1="32"
              y1="38"
              x2="32"
              y2="46"
              stroke="#00dcb4"
              strokeWidth="1.5"
            />
            <line
              x1="16"
              y1="30"
              x2="24"
              y2="30"
              stroke="#00dcb4"
              strokeWidth="1.5"
            />
            <line
              x1="40"
              y1="30"
              x2="48"
              y2="30"
              stroke="#00dcb4"
              strokeWidth="1.5"
            />
          </svg>
          {sb && (
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 2,
                  color: "var(--cyan)",
                  whiteSpace: "nowrap",
                }}
              >
                CYBERTHREAT
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 8,
                  color: "var(--text3)",
                  letterSpacing: 1,
                }}
              >
                VISION v2.0
              </div>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text3)",
              display: "flex",
              flexShrink: 0,
            }}
          >
            {sb ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
          </button>
        </div>
        <div
          style={{
            padding: "8px 14px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            className="animate-pulse-dot"
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: connected ? "var(--cyan)" : "var(--red)",
              boxShadow: connected ? "0 0 8px var(--cyan)" : "none",
              flexShrink: 0,
            }}
          />
          {sb && (
            <span
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 9,
                color: "var(--text2)",
              }}
            >
              {connected ? "LIVE" : "POLLING"}
            </span>
          )}
          {sb && (
            <span
              style={{
                marginLeft: "auto",
                padding: "1px 6px",
                borderRadius: 4,
                fontSize: 9,
                fontFamily: "'JetBrains Mono',monospace",
                background: offlineMode
                  ? "rgba(0,220,180,0.1)"
                  : "rgba(255,159,67,0.12)",
                color: offlineMode ? "var(--cyan)" : "var(--orange)",
                border: `1px solid ${offlineMode ? "rgba(0,220,180,0.2)" : "rgba(255,159,67,0.3)"}`,
              }}
            >
              {offlineMode ? "OFFLINE" : "HYBRID"}
            </span>
          )}
        </div>
        {NAV.map(({ section, items }) => (
          <div key={section} style={{ paddingTop: 12, paddingBottom: 4 }}>
            {sb && (
              <div
                style={{
                  padding: "0 16px 6px",
                  fontSize: 9,
                  letterSpacing: 2,
                  color: "var(--text3)",
                  fontFamily: "'JetBrains Mono',monospace",
                }}
              >
                {section}
              </div>
            )}
            {items.map(({ to, label, icon: Icon, badgeKey, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: sb ? "9px 16px" : "9px 0",
                  justifyContent: sb ? "flex-start" : "center",
                  textDecoration: "none",
                  cursor: "pointer",
                  borderLeft: isActive
                    ? "2px solid var(--cyan)"
                    : "2px solid transparent",
                  background: isActive ? "rgba(0,220,180,0.07)" : "transparent",
                  transition: "background .15s",
                })}
                title={!sb ? label : undefined}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={16}
                      color={isActive ? "var(--cyan)" : "var(--text3)"}
                      style={{ flexShrink: 0 }}
                    />
                    {sb && (
                      <>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: isActive ? "var(--cyan)" : "var(--text2)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {label}
                        </span>
                        {badgeKey && badge(badgeKey)}
                      </>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
        <div
          style={{
            marginTop: "auto",
            padding: "12px 14px",
            borderTop: "1px solid var(--border)",
          }}
        >
          {sb && (
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <button
                onClick={() => setOfflineMode(!offlineMode)}
                style={{
                  flex: 1,
                  background: offlineMode
                    ? "rgba(0,220,180,0.08)"
                    : "rgba(255,159,67,0.08)",
                  border: `1px solid ${offlineMode ? "rgba(0,220,180,0.2)" : "rgba(255,159,67,0.25)"}`,
                  borderRadius: 6,
                  padding: "6px 8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  color: offlineMode ? "var(--cyan)" : "var(--orange)",
                  fontSize: 10,
                  fontFamily: "'JetBrains Mono',monospace",
                }}
              >
                {offlineMode ? <WifiOff size={12} /> : <Wifi size={12} />}
                {offlineMode ? "OFFLINE" : "HYBRID"}
              </button>
              <button
                onClick={toggleSound}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "6px 10px",
                  cursor: "pointer",
                  color: "var(--text2)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
              </button>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "linear-gradient(135deg,var(--cyan2),#0a6ebd)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
            {sb && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {user?.username}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: "var(--text3)",
                      fontFamily: "'JetBrains Mono',monospace",
                    }}
                  >
                    {user?.clearance}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text3)",
                    display: "flex",
                  }}
                >
                  <LogOut size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "9px 20px",
            background: "var(--bg1)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexShrink: 0,
          }}
        >
          <div
            style={{ flex: 1, fontSize: 18, fontWeight: 700, letterSpacing: 1 }}
          >
            CyberThreat<span style={{ color: "var(--cyan)" }}>Vision</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: 20,
              border: `1px solid ${tl === "CRITICAL" ? "rgba(255,71,87,0.5)" : "rgba(255,159,67,0.4)"}`,
              background:
                tl === "CRITICAL"
                  ? "rgba(255,71,87,0.08)"
                  : "rgba(255,159,67,0.07)",
              color: tl === "CRITICAL" ? "var(--red)" : "var(--orange)",
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 10,
              letterSpacing: 1,
            }}
          >
            <span
              className="animate-pulse-dot"
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "currentColor",
              }}
            />
            THREAT: {tl}
          </div>
          <span
            className={
              offlineMode ? "badge badge-online" : "badge badge-offline"
            }
          >
            {offlineMode ? "📊 DATASET" : "🌐 HYBRID"}
          </span>
          <div
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 10,
              color: "var(--text2)",
              padding: "4px 10px",
              background: "var(--bg3)",
              borderRadius: 6,
              border: "1px solid var(--border)",
            }}
          >
            {stats.total.toLocaleString()} events
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 10,
              color: "var(--text3)",
            }}
          >
            {clock.toUTCString().replace(" GMT", " UTC")}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px" }}>
          <Outlet />
        </div>
      </div>
      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {toasts.map((t) => (
          <div key={t.id} className="ctv-toast animate-slide-up">
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: t.color,
                flexShrink: 0,
                boxShadow: `0 0 8px ${t.color}`,
              }}
            />
            <span style={{ color: "var(--text)", flex: 1 }}>{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
