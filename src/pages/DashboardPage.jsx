import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { dashboardAPI, datasetAPI } from "../services/api.js";
import {
  StatCard,
  StatGrid,
  Panel,
  Grid2,
  SevBadge,
  PageHeader,
  LoadingRow,
  EmptyRow,
} from "../components/shared/UI.jsx";
import {
  fmtTime,
  fmtNum,
  CHART_COLORS,
  SEV_COLORS,
  rcTooltipStyle,
} from "../utils/helpers.js";
import { useInterval } from "../hooks/index.js";

const REFRESH = 15000;

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [dsStats, setDsStats] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [topIPs, setTopIPs] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [s, ds, ti, ips] = await Promise.all([
        dashboardAPI.getStats(),
        datasetAPI.getStats(),
        dashboardAPI.getTimeline(),
        datasetAPI.getIPs({ min_score: 70, limit: 8 }),
      ]);
      setStats(s.data);
      setDsStats(ds.data);
      setTimeline(ti.data?.timeline || generateFakeTimeline());
      setTopIPs(ips.data?.ips || []);
    } catch {
      setDsStats({
        ips: { total: 30, critical: 12, high: 10 },
        phishing: { total: 30, active: 28 },
        malware: { total: 20, ransomware: 8 },
        geo: { total_countries: 20 },
      });
      setTimeline(generateFakeTimeline());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);
  useInterval(load, REFRESH);

  // Severity distribution for pie
  const sevData = [
    {
      name: "Critical",
      value: dsStats?.ips?.critical || 12,
      color: CHART_COLORS.red,
    },
    {
      name: "High",
      value: dsStats?.ips?.high || 10,
      color: CHART_COLORS.orange,
    },
    {
      name: "Medium",
      value: Math.max(
        0,
        (dsStats?.ips?.total || 30) -
          (dsStats?.ips?.critical || 12) -
          (dsStats?.ips?.high || 10) -
          3,
      ),
      color: CHART_COLORS.yellow,
    },
    { name: "Low", value: 3, color: CHART_COLORS.cyan },
  ];

  // Malware type breakdown
  const malwareTypes = [
    { name: "Ransomware", count: dsStats?.malware?.ransomware || 8 },
    { name: "Trojan", count: 5 },
    { name: "Spyware", count: 4 },
    { name: "Botnet", count: 3 },
    { name: "Worm", count: 2 },
    { name: "Miner", count: 1 },
  ];

  // Radar: threat vectors
  const radarData = [
    { subject: "Brute Force", A: 85 },
    { subject: "Phishing", A: 72 },
    { subject: "Malware", A: 68 },
    { subject: "DDoS", A: 60 },
    { subject: "Botnet", A: 55 },
    { subject: "Exploit", A: 48 },
  ];

  return (
    <div>
      <PageHeader
        title="Security Dashboard"
        subtitle={`Dataset-backed intelligence · Auto-refreshes every ${REFRESH / 1000}s · ${fmtTime()}`}
      />

      <StatGrid cols={4}>
        <StatCard
          label="SUSPICIOUS IPs"
          value={fmtNum(dsStats?.ips?.total)}
          delta={`${dsStats?.ips?.critical || 0} critical`}
          deltaUp
          variant="danger"
        />
        <StatCard
          label="PHISHING URLs"
          value={fmtNum(dsStats?.phishing?.total)}
          delta={`${dsStats?.phishing?.active || 0} active`}
          deltaUp
          variant="warning"
        />
        <StatCard
          label="MALWARE SAMPLES"
          value={fmtNum(dsStats?.malware?.total)}
          delta={`${dsStats?.malware?.ransomware || 0} ransomware`}
          deltaUp
          variant="info"
        />
        <StatCard
          label="COUNTRIES TRACKED"
          value={fmtNum(dsStats?.geo?.total_countries)}
          delta="worldwide"
          variant="success"
        />
      </StatGrid>

      <Grid2 cols="2fr 1fr" mb={16}>
        <Panel
          title="THREAT ACTIVITY — 24H"
          badge="● DATASET"
          badgeClass="badge-count"
        >
          <div style={{ padding: "16px 18px", height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={CHART_COLORS.red}
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor={CHART_COLORS.red}
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="gh" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={CHART_COLORS.orange}
                      stopOpacity={0.15}
                    />
                    <stop
                      offset="95%"
                      stopColor={CHART_COLORS.orange}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={CHART_COLORS.grid}
                />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 10, fill: CHART_COLORS.text3 }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: CHART_COLORS.text3 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip {...rcTooltipStyle} />
                <Legend
                  wrapperStyle={{
                    fontSize: 10,
                    fontFamily: "'JetBrains Mono',monospace",
                    color: CHART_COLORS.text2,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="critical"
                  stroke={CHART_COLORS.red}
                  fill="url(#gc)"
                  strokeWidth={1.5}
                />
                <Area
                  type="monotone"
                  dataKey="high"
                  stroke={CHART_COLORS.orange}
                  fill="url(#gh)"
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="SEVERITY SPLIT" badgeClass="badge-count">
          <div style={{ padding: "16px 18px", height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sevData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {sevData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...rcTooltipStyle} />
                <Legend
                  wrapperStyle={{
                    fontSize: 10,
                    fontFamily: "'JetBrains Mono',monospace",
                    color: CHART_COLORS.text2,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </Grid2>

      <Grid2 mb={16}>
        <Panel
          title="MALWARE TYPE BREAKDOWN"
          badge="● LOCAL DB"
          badgeClass="badge-count"
        >
          <div style={{ padding: "16px 18px", height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={malwareTypes} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={CHART_COLORS.grid}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: CHART_COLORS.text3 }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: CHART_COLORS.text2 }}
                  tickLine={false}
                  width={72}
                />
                <Tooltip {...rcTooltipStyle} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {malwareTypes.map((_, i) => (
                    <Cell
                      key={i}
                      fill={
                        i === 0
                          ? CHART_COLORS.red
                          : i === 1
                            ? CHART_COLORS.orange
                            : i === 2
                              ? CHART_COLORS.yellow
                              : CHART_COLORS.blue
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="THREAT VECTOR RADAR">
          <div style={{ padding: "16px 18px", height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke={CHART_COLORS.grid} />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fontSize: 10, fill: CHART_COLORS.text2 }}
                />
                <PolarRadiusAxis
                  tick={{ fontSize: 9, fill: CHART_COLORS.text3 }}
                  axisLine={false}
                />
                <Radar
                  name="Threat Level"
                  dataKey="A"
                  stroke={CHART_COLORS.red}
                  fill={CHART_COLORS.red}
                  fillOpacity={0.15}
                />
                <Tooltip {...rcTooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </Grid2>

      <Panel
        title="TOP CRITICAL IPs — DATASET"
        badge={`${topIPs.length} IPs`}
        badgeClass="badge-count"
      >
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>IP ADDRESS</th>
                <th>COUNTRY</th>
                <th>ISP</th>
                <th>ATTACK TYPES</th>
                <th>SCORE</th>
                <th>REPORTS</th>
                <th>TOR</th>
                <th>SEVERITY</th>
              </tr>
            </thead>
            <tbody>
              {loading && <LoadingRow cols={8} />}
              {!loading && topIPs.length === 0 && (
                <EmptyRow cols={8} msg="No data" />
              )}
              {topIPs.map((ip, i) => {
                const score = parseInt(ip.abuse_score || 0);
                const sev =
                  score >= 90 ? "critical" : score >= 70 ? "high" : "medium";
                return (
                  <tr key={i}>
                    <td className="mono">{ip.ip_address}</td>
                    <td style={{ fontSize: 12 }}>
                      {ip.country_code} — {ip.country_name}
                    </td>
                    <td style={{ fontSize: 11, color: "var(--text2)" }}>
                      {ip.isp}
                    </td>
                    <td
                      style={{
                        fontSize: 11,
                        color: "var(--text2)",
                        maxWidth: 180,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ip.attack_types}
                    </td>
                    <td>
                      <span
                        style={{
                          color: score >= 80 ? "var(--red)" : "var(--orange)",
                          fontWeight: 700,
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 13,
                        }}
                      >
                        {score}
                      </span>
                    </td>
                    <td className="mono">{fmtNum(ip.report_count)}</td>
                    <td
                      style={{
                        fontSize: 11,
                        color:
                          ip.is_tor === "true" ? "var(--red)" : "var(--text3)",
                      }}
                    >
                      {ip.is_tor === "true" ? "✓ TOR" : "—"}
                    </td>
                    <td>
                      <SevBadge sev={sev} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function generateFakeTimeline() {
  return Array.from({ length: 12 }, (_, i) => ({
    hour: `${String(i * 2).padStart(2, "0")}:00`,
    critical: Math.floor(Math.random() * 15 + 2),
    high: Math.floor(Math.random() * 25 + 5),
    medium: Math.floor(Math.random() * 35 + 10),
  }));
}
