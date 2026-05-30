export const fmtTime = (d = new Date()) =>
  new Date(d).toLocaleTimeString("en-US", { hour12: false });
export const fmtDate = (d = new Date()) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
  " " +
  fmtTime(d);
export const fmtNum = (n) => (n ?? 0).toLocaleString();
export const truncate = (s, n = 40) =>
  s?.length > n ? s.slice(0, n) + "…" : s;
export const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
};
export const sevColor = (sev) =>
  ({
    critical: "var(--red)",
    high: "var(--orange)",
    medium: "var(--yellow)",
    low: "var(--cyan)",
  })[sev] || "var(--text2)";
export const riskLevel = (score) => {
  if (score >= 80) return { label: "CRITICAL", color: "var(--red)" };
  if (score >= 60) return { label: "HIGH", color: "var(--orange)" };
  if (score >= 40) return { label: "MEDIUM", color: "var(--yellow)" };
  return { label: "LOW", color: "var(--cyan)" };
};
export const isValidIP = (ip) => /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
export const isValidDomain = (d) =>
  /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}(?:\.[a-zA-Z]{2,})+$/.test(d);
export const isValidURL = (u) => {
  try {
    new URL(u);
    return true;
  } catch {
    return false;
  }
};
export const isValidHash = (h) =>
  /^[a-fA-F0-9]{32}$/.test(h) || /^[a-fA-F0-9]{64}$/.test(h);

// Recharts / Chart.js colours
export const CHART_COLORS = {
  red: "#ff4757",
  orange: "#ff9f43",
  yellow: "#ffd32a",
  cyan: "#00dcb4",
  blue: "#1e90ff",
  purple: "#a29bfe",
  text2: "#7a9ab4",
  text3: "#3a5a74",
  grid: "rgba(255,255,255,0.04)",
};
export const SEV_COLORS = ["#ff4757", "#ff9f43", "#ffd32a", "#00dcb4"];

export const rcTooltipStyle = {
  contentStyle: {
    background: "#111d2b",
    border: "1px solid rgba(0,220,180,0.25)",
    borderRadius: 6,
    fontFamily: "'JetBrains Mono',monospace",
    fontSize: 11,
  },
  labelStyle: { color: "#7a9ab4" },
  itemStyle: { color: "#c8d8e8" },
};
