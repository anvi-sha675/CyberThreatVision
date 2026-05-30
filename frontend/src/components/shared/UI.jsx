import React from "react";
import { sevColor } from "../../utils/helpers.js";

export function StatCard({ label, value, delta, deltaUp, variant = "info" }) {
  return (
    <div className={`stat-card ${variant}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value ?? "—"}</div>
      {delta && (
        <div className="stat-delta">
          <span style={{ color: deltaUp ? "var(--red)" : "var(--cyan)" }}>
            {deltaUp ? "↑" : "↓"} {delta}
          </span>
        </div>
      )}
    </div>
  );
}

export function StatGrid({ cols = 4, children, mb = 20 }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 12,
        marginBottom: mb,
      }}
    >
      {children}
    </div>
  );
}

export function Panel({
  title,
  badge,
  badgeClass = "badge-live",
  headerRight,
  children,
  style,
}) {
  return (
    <div className="panel" style={style}>
      <div className="panel-header">
        <h3>{title}</h3>
        {badge && <span className={`badge ${badgeClass}`}>{badge}</span>}
        {headerRight}
      </div>
      {children}
    </div>
  );
}

export function Grid2({ children, gap = 16, mb = 16, cols = "1fr 1fr" }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: cols,
        gap,
        marginBottom: mb,
      }}
    >
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>
        {title}
      </h2>
      {subtitle && (
        <p
          style={{
            fontSize: 11,
            color: "var(--text2)",
            marginTop: 4,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function SevBadge({ sev }) {
  return (
    <span className={`sev-badge sev-${sev}`}>
      {(sev || "unknown").toUpperCase()}
    </span>
  );
}

export function SevDot({ sev, size = 7 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: sevColor(sev),
        boxShadow: `0 0 6px ${sevColor(sev)}`,
      }}
    />
  );
}

export function TableScroll({ maxHeight = 360, children }) {
  return <div style={{ maxHeight, overflowY: "auto" }}>{children}</div>;
}

export function LoadingRow({ cols = 6 }) {
  return (
    <tr>
      <td
        colSpan={cols}
        style={{
          textAlign: "center",
          padding: 24,
          color: "var(--text3)",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
        }}
      >
        ⟳ LOADING...
      </td>
    </tr>
  );
}

export function EmptyRow({ cols = 6, msg = "No data" }) {
  return (
    <tr>
      <td
        colSpan={cols}
        style={{
          textAlign: "center",
          padding: 24,
          color: "var(--text3)",
          fontSize: 13,
        }}
      >
        {msg}
      </td>
    </tr>
  );
}

export function RiskGauge({ score = 0, size = 100 }) {
  const C = 251;
  const offset = C - (Math.min(100, Math.max(0, score)) / 100) * C;
  const color =
    score >= 80
      ? "var(--red)"
      : score >= 60
        ? "var(--orange)"
        : score >= 40
          ? "var(--yellow)"
          : "var(--cyan)";
  return (
    <div
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={40}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={8}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={40}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease, stroke 0.4s" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: size > 80 ? 24 : 18,
            fontWeight: 700,
            color,
            lineHeight: 1,
          }}
        >
          {score}
        </div>
        <div
          style={{
            fontSize: 9,
            color: "var(--text3)",
            fontFamily: "'JetBrains Mono', monospace",
            marginTop: 2,
          }}
        >
          RISK
        </div>
      </div>
    </div>
  );
}

export function ProgressBar({
  value,
  max = 100,
  color = "var(--cyan)",
  height = 5,
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="ctv-progress" style={{ height }}>
      <div
        className="ctv-progress-fill"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

export function Mono({ children, color = "var(--text)", size = 11 }) {
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: size,
        color,
      }}
    >
      {children}
    </span>
  );
}

export function InfoCard({ label, value, color = "var(--cyan)" }) {
  return (
    <div
      style={{
        background: "var(--bg3)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: "10px 14px",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "var(--text3)",
          fontFamily: "'JetBrains Mono', monospace",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          color,
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600,
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}
