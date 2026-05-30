import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useThreatStore } from "../store/index.js";
import { threatAPI } from "../services/api.js";
import {
  PageHeader,
  Panel,
  Grid2,
  StatGrid,
  StatCard,
  SevBadge,
  SevDot,
  TableScroll,
} from "../components/shared/UI.jsx";
import {
  fmtTime,
  fmtNum,
  CHART_COLORS,
  rcTooltipStyle,
} from "../utils/helpers.js";
import { useInterval } from "../hooks/index.js";

export default function FeedPage() {
  const { feed, stats, connected } = useThreatStore();
  const [apiData, setApiData] = useState([]);
  const [epmHist, setEpmHist] = useState(Array(20).fill(0));

  useInterval(() => {
    setEpmHist((prev) => [
      ...prev.slice(1),
      feed.filter(
        (f) =>
          Date.now() - new Date(f.reported_at || f.timestamp).getTime() < 60000,
      ).length,
    ]);
  }, 2000);

  const load = async () => {
    try {
      const { data } = await threatAPI.feed();
      setApiData(data.feed || []);
    } catch {}
  };
  useEffect(() => {
    load();
  }, []);
  useInterval(load, 8000);

  const displayFeed = feed.length > 0 ? feed : apiData;
  const epmData = epmHist.map((v, i) => ({ t: `-${20 - i}s`, v }));

  return (
    <div>
      <PageHeader
        title="Live Threat Feed"
        subtitle={`${connected ? "● Socket.IO CONNECTED" : "○ REST POLLING"} · ${fmtNum(displayFeed.length)} events · Dataset-simulated threats every 4s`}
      />
      <StatGrid cols={4}>
        <StatCard
          label="TOTAL EVENTS"
          value={fmtNum(stats.total)}
          variant="danger"
        />
        <StatCard
          label="CRITICAL"
          value={fmtNum(stats.critical)}
          variant="danger"
        />
        <StatCard label="HIGH" value={fmtNum(stats.high)} variant="warning" />
        <StatCard
          label="MEDIUM+LOW"
          value={fmtNum((stats.medium || 0) + (stats.low || 0))}
          variant="info"
        />
      </StatGrid>
      <Grid2>
        <Panel
          title="LIVE THREAT STREAM"
          badge="● REAL-TIME"
          badgeClass="badge-live"
        >
          <div style={{ padding: "0 16px", maxHeight: 360, overflowY: "auto" }}>
            {displayFeed.slice(0, 80).map((t, i) => (
              <div
                key={i}
                className="animate-feed-in"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "8px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.035)",
                }}
              >
                <SevDot sev={t.severity} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12,
                    }}
                  >
                    {t.ip_address}{" "}
                    <span
                      style={{
                        background: "var(--bg4)",
                        padding: "1px 5px",
                        borderRadius: 3,
                        fontSize: 10,
                        color: "var(--text2)",
                        marginLeft: 4,
                      }}
                    >
                      {t.country_code}
                    </span>
                    {t.source === "dataset" && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: 9,
                          color: "var(--text3)",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        DATASET
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text2)",
                      marginTop: 2,
                    }}
                  >
                    {t.attack_type} — {t.isp}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      color: "var(--text3)",
                    }}
                  >
                    {fmtTime(t.reported_at || new Date())}
                  </div>
                  <SevBadge sev={t.severity} />
                </div>
              </div>
            ))}
            {displayFeed.length === 0 && (
              <div
                style={{
                  padding: 20,
                  color: "var(--text3)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  textAlign: "center",
                }}
              >
                Waiting for threat events...
              </div>
            )}
          </div>
        </Panel>
        <Panel title="EVENTS PER MINUTE">
          <div style={{ padding: "16px 18px", height: 340 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={epmData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={CHART_COLORS.grid}
                />
                <XAxis
                  dataKey="t"
                  tick={{ fontSize: 10, fill: CHART_COLORS.text3 }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: CHART_COLORS.text3 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip {...rcTooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={CHART_COLORS.cyan}
                  strokeWidth={1.5}
                  dot={false}
                  name="Events/min"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </Grid2>
    </div>
  );
}
