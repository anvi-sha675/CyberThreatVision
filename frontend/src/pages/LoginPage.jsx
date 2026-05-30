import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/index.js";
import { authAPI } from "../services/api.js";

export default function LoginPage() {
  const { setAuth, token } = useAuthStore();
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [count, setCount] = useState(1247);

  useEffect(() => {
    const id = setInterval(
      () => setCount((c) => c + Math.floor(Math.random() * 3)),
      800,
    );
    return () => clearInterval(id);
  }, []);

const handleSubmit = async (e) => {
  e?.preventDefault();
  if (!username) {
    setError("Operator ID required");
    return;
  }
  setLoading(true);
  setError("");
  try {
    const { data } = await authAPI.login({
      username,
      password: password || "CyberAdmin@123",
    });
    setAuth(data.user, data.token);
  } catch (err) {
    setError(
      err.response?.data?.error || "Authentication failed — check credentials"
    );
    setLoading(false);
  }
};

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--bg0)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <div
        className="grid-bg"
        style={{ position: "absolute", inset: 0, zIndex: 0 }}
      />
      <div
        className="scan-overlay"
        style={{ position: "absolute", inset: 0, zIndex: 1 }}
      />

      {/* Card */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          background: "var(--bg2)",
          border: "1px solid var(--border2)",
          borderRadius: 12,
          padding: "44px 48px",
          width: 420,
          boxShadow: "0 0 60px rgba(0,220,180,0.07)",
        }}
      >
        {/* Corner accents */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 44,
            height: 44,
            border: "1px solid var(--cyan)",
            opacity: 0.18,
            borderRight: "none",
            borderBottom: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 44,
            height: 44,
            border: "1px solid var(--cyan)",
            opacity: 0.18,
            borderLeft: "none",
            borderTop: "none",
          }}
        />

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <svg
            width="60"
            height="60"
            viewBox="0 0 64 64"
            fill="none"
            style={{ margin: "0 auto 14px", display: "block" }}
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
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 3,
              color: "var(--cyan)",
              textShadow: "0 0 20px rgba(0,220,180,0.4)",
            }}
          >
            CYBERTHREAT<span style={{ color: "var(--text)" }}>VISION</span>
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: "var(--text3)",
              letterSpacing: 2,
              marginTop: 5,
            }}
          >
            AI/ML THREAT INTELLIGENCE PLATFORM v2.0
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: "var(--text2)",
                letterSpacing: 2,
                marginBottom: 7,
              }}
            >
              OPERATOR ID
            </label>
            <input
              className="ctv-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter operator ID"
              autoFocus
              autoComplete="off"
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: "var(--text2)",
                letterSpacing: 2,
                marginBottom: 7,
              }}
            >
              ACCESS CODE
            </label>
            <input
              className="ctv-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter access code"
              autoComplete="current-password"
            />
          </div>
          {error && (
            <div
              style={{
                background: "rgba(255,71,87,0.1)",
                border: "1px solid rgba(255,71,87,0.3)",
                borderRadius: 6,
                padding: "8px 12px",
                color: "var(--red)",
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                marginBottom: 14,
              }}
            >
              ✕ {error}
            </div>
          )}
          <button
            type="submit"
            className="ctv-btn"
            style={{
              width: "100%",
              padding: 13,
              fontSize: 14,
              letterSpacing: 3,
            }}
            disabled={loading}
          >
            {loading ? "AUTHENTICATING..." : "AUTHENTICATE"}
          </button>
        </form>

        <div
          style={{
            textAlign: "center",
            marginTop: 14,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: "var(--text3)",
          }}
        >
          Demo: admin / any password <span className="animate-blink">_</span>
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: 16,
          }}
        >
          {[
            "📊 Local Datasets",
            "🤖 ML Scoring",
            "🗺 Leaflet Map",
            "⚡ Recharts",
          ].map((f) => (
            <span
              key={f}
              style={{
                background: "var(--bg3)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: "3px 10px",
                fontSize: 10,
                color: "var(--text3)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: "var(--red)",
          letterSpacing: 1,
          zIndex: 2,
        }}
      >
        ⚠ LIVE THREATS DETECTED: {count.toLocaleString()}
      </div>
    </div>
  );
}
