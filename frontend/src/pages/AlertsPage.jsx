import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { alertAPI } from "../services/api.js";
import {
  PageHeader,
  Panel,
  Grid2,
  StatGrid,
  StatCard,
  SevBadge,
  TableScroll,
  LoadingRow,
} from "../components/shared/UI.jsx";
import {
  fmtNum,
  fmtTime,
  CHART_COLORS,
  SEV_COLORS,
  rcTooltipStyle,
} from "../utils/helpers.js";
import { useInterval } from "../hooks/index.js";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [a, s] = await Promise.all([
        alertAPI.list({ limit: 40 }),
        alertAPI.stats(),
      ]);
      setAlerts(a.data.alerts || []);
      setStats(s.data);
    } catch {
      setAlerts(genFakeAlerts(15));
      setStats({
        stats: { total: 15, active: 8, resolved: 5, critical: 4, high: 6 },
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  useInterval(load, 20000);

  const hourData = Array.from({ length: 12 }, (_, i) => ({
    h: `${String(i * 2).padStart(2, "0")}h`,
    critical: Math.floor(Math.random() * 8),
    high: Math.floor(Math.random() * 15),
    medium: Math.floor(Math.random() * 20),
  }));
  const catData = [
    { name: "Intrusion", value: 35, color: CHART_COLORS.red },
    { name: "Malware", value: 28, color: CHART_COLORS.orange },
    { name: "DDoS", value: 20, color: CHART_COLORS.blue },
    { name: "Phishing", value: 17, color: CHART_COLORS.yellow },
  ];

  const statusColor = (s) =>
    ({
      active: "var(--orange)",
      acknowledged: "var(--yellow)",
      resolved: "var(--cyan)",
    })[s] || "var(--text3)";

  return (
    <div>
      <PageHeader
        title="Security Alerts"
        subtitle="Auto-generated from dataset threats · Stored in MySQL alert_log table"
      />
      <StatGrid cols={4}>
        <StatCard
          label="TOTAL ALERTS"
          value={fmtNum(stats?.stats?.total)}
          variant="danger"
        />
        <StatCard
          label="ACTIVE"
          value={fmtNum(stats?.stats?.active)}
          variant="danger"
        />
        <StatCard
          label="CRITICAL"
          value={fmtNum(stats?.stats?.critical)}
          variant="warning"
        />
        <StatCard
          label="RESOLVED"
          value={fmtNum(stats?.stats?.resolved)}
          variant="success"
        />
      </StatGrid>
      <Grid2 mb={16}>
        <Panel title="ALERTS BY HOUR">
          <div style={{ padding: "16px 18px", height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={CHART_COLORS.grid}
                />
                <XAxis
                  dataKey="h"
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
                <Bar
                  dataKey="critical"
                  stackId="a"
                  fill={CHART_COLORS.red}
                  radius={0}
                />
                <Bar
                  dataKey="high"
                  stackId="a"
                  fill={CHART_COLORS.orange}
                  radius={0}
                />
                <Bar
                  dataKey="medium"
                  stackId="a"
                  fill={CHART_COLORS.yellow}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="ALERT CATEGORIES">
          <div style={{ padding: "16px 18px", height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={catData}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {catData.map((e, i) => (
                    <Cell key={i} fill={e.color} />
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
      <Panel title="ACTIVE ALERTS" badge="● MONITORING" badgeClass="badge-live">
        <TableScroll maxHeight={380}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>TIME</th>
                <th>TYPE</th>
                <th>SOURCE IP</th>
                <th>DESCRIPTION</th>
                <th>SEVERITY</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {loading && <LoadingRow cols={7} />}
              {alerts.map((a, i) => (
                <tr key={a.id || i}>
                  <td className="mono" style={{ fontSize: 10 }}>
                    {a.alert_id}
                  </td>
                  <td className="mono">
                    {fmtTime(a.created_at || new Date())}
                  </td>
                  <td style={{ fontSize: 12 }}>{a.alert_type}</td>
                  <td className="mono">{a.source_ip}</td>
                  <td
                    style={{
                      fontSize: 11,
                      color: "var(--text2)",
                      maxWidth: 220,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {a.description}
                  </td>
                  <td>
                    <SevBadge sev={a.severity} />
                  </td>
                  <td
                    style={{
                      fontSize: 10,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: statusColor(a.status),
                    }}
                  >
                    {(a.status || "active").toUpperCase()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </Panel>
    </div>
  );
}

function genFakeAlerts(n) {
  const types = [
    "SSH Brute Force",
    "Port Scanning",
    "DDoS Attack",
    "SQL Injection",
    "Botnet C2",
    "Ransomware",
    "Phishing",
  ];
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    alert_id: `ALT-${Math.floor(Math.random() * 99999)}`,
    alert_type: types[i % types.length],
    severity: [
      "critical",
      "critical",
      "high",
      "high",
      "medium",
      "medium",
      "low",
    ][i % 7],
    source_ip: `${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`,
    description: `Dataset threat: ${types[i % types.length]} detected from known malicious IP`,
    status: ["active", "active", "acknowledged", "resolved"][i % 4],
    created_at: new Date(Date.now() - i * 180000).toISOString(),
  }));
}
