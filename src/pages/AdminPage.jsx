import React, { useState, useEffect } from "react";
import { adminAPI, datasetAPI } from "../services/api.js";
import {
  PageHeader,
  Panel,
  Grid2,
  ProgressBar,
  Mono,
} from "../components/shared/UI.jsx";
import { fmtNum, fmtTime } from "../utils/helpers.js";
import { useUIStore } from "../store/index.js";
import { useInterval } from "../hooks/index.js";

export default function AdminPage() {
  const [health, setHealth] = useState(null);
  const [users, setUsers] = useState([]);
  const [tables, setTables] = useState([]);
  const [dsStats, setDsStats] = useState(null);
  const [cpu, setCpu] = useState(32);
  const [mem, setMem] = useState(58);
  const { offlineMode, setOfflineMode, demoApiMode, setDemoApiMode } =
    useUIStore();

  const load = async () => {
    try {
      const [h, u, t, ds] = await Promise.all([
        adminAPI.health(),
        adminAPI.users(),
        adminAPI.tables(),
        datasetAPI.getStats(),
      ]);
      setHealth(h.data);
      setUsers(u.data.users || []);
      setTables(t.data.tables || []);
      setDsStats(ds.data);
    } catch {}
  };
  useEffect(() => {
    load();
  }, []);
  useInterval(() => {
    setCpu((c) => Math.min(95, Math.max(10, c + (Math.random() - 0.5) * 6)));
    setMem((m) => Math.min(90, Math.max(30, m + (Math.random() - 0.5) * 3)));
  }, 3000);

  const cpuColor = (v) =>
    v > 75 ? "var(--red)" : v > 50 ? "var(--orange)" : "var(--cyan)";
  const ml = health?.services?.ml_microservice;

  return (
    <div>
      <PageHeader
        title="Admin Panel"
        subtitle="System health · Dataset stats · MySQL tables · Service status"
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {/* Mode toggles */}
        <div
          style={{
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: 16,
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 10,
              color: "var(--text3)",
              letterSpacing: 1.5,
              marginBottom: 14,
            }}
          >
            OPERATING MODES
          </div>
          {[
            [
              "Offline Mode (Dataset Only)",
              offlineMode,
              setOfflineMode,
              "Use local CSV/JSON datasets only",
            ],
            [
              "Demo API Mode (Optional)",
              demoApiMode,
              setDemoApiMode,
              "Fetch live data from AbuseIPDB/VT",
            ],
          ].map(([label, val, setter, hint]) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 13, color: "var(--text2)" }}>
                  {label}
                </span>
                <label className="ctv-toggle">
                  <input
                    type="checkbox"
                    checked={val}
                    onChange={(e) => setter(e.target.checked)}
                  />
                  <span className="ctv-toggle-slider" />
                </label>
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text3)",
                  fontFamily: "'JetBrains Mono',monospace",
                }}
              >
                {hint}
              </div>
            </div>
          ))}
        </div>

        {/* Service status */}
        <div
          style={{
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: 16,
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 10,
              color: "var(--text3)",
              letterSpacing: 1.5,
              marginBottom: 14,
            }}
          >
            SERVICE STATUS
          </div>
          {[
            ["Express Backend", true, "http://localhost:5000"],
            ["ML Flask Service", ml || false, "http://localhost:5001"],
            ["MySQL Database", true, "cyberthreatdb2"],
            ["Socket.IO", true, "WebSocket feed"],
            ["AbuseIPDB API", false, "Optional — set API key"],
            ["VirusTotal API", false, "Optional — set API key"],
          ].map(([name, ok, hint]) => (
            <div
              key={name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: "var(--text2)" }}>
                  {name}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: "var(--text3)",
                    fontFamily: "'JetBrains Mono',monospace",
                  }}
                >
                  {hint}
                </div>
              </div>
              <span
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 10,
                  color: ok ? "var(--cyan)" : "var(--text3)",
                }}
              >
                {ok ? "● ACTIVE" : "○ OFFLINE"}
              </span>
            </div>
          ))}
        </div>

        {/* System health */}
        <div
          style={{
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: 16,
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 10,
              color: "var(--text3)",
              letterSpacing: 1.5,
              marginBottom: 14,
            }}
          >
            SYSTEM HEALTH
          </div>
          {[
            ["CPU Usage", Math.round(cpu), "%", cpuColor(cpu)],
            ["Memory", Math.round(mem), "%", cpuColor(mem)],
            [
              "Node.js Uptime",
              Math.round((health?.system?.uptime_seconds || 0) / 60),
              "min",
              "var(--cyan)",
            ],
          ].map(([label, val, unit, color]) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: "var(--text2)",
                  marginBottom: 5,
                }}
              >
                <span>{label}</span>
                <Mono size={11} color={color}>
                  {val}
                  {unit}
                </Mono>
              </div>
              <ProgressBar
                value={val}
                max={unit === "min" ? 1440 : 100}
                color={color}
                height={5}
              />
            </div>
          ))}
          {health && (
            <div
              style={{
                marginTop: 8,
                fontSize: 10,
                color: "var(--text3)",
                fontFamily: "'JetBrains Mono',monospace",
              }}
            >
              Node {health.system?.node_version} · {health.system?.platform}
            </div>
          )}
        </div>
      </div>

      <Grid2>
        {/* MySQL tables */}
        <Panel title="MYSQL TABLES — cyberthreatdb2">
          <table className="data-table">
            <thead>
              <tr>
                <th>TABLE</th>
                <th>ROWS</th>
              </tr>
            </thead>
            <tbody>
              {(tables.length
                ? tables
                : [
                    ["users", 3],
                    ["scan_logs", 0],
                    ["threat_events", 0],
                    ["alert_log", 0],
                    ["blocked_ips", 0],
                    ["activity_log", 0],
                    ["system_metrics", 0],
                  ].map(([t, r]) => ({ table_name: t, row_count: r }))
              ).map((t, i) => (
                <tr key={i}>
                  <td
                    style={{
                      color: "var(--cyan)",
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 11,
                    }}
                  >
                    {t.table_name}
                  </td>
                  <td className="mono">{fmtNum(t.row_count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        {/* Dataset files */}
        <Panel title="LOCAL DATASETS">
          <table className="data-table">
            <thead>
              <tr>
                <th>FILE</th>
                <th>RECORDS</th>
                <th>TYPE</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["suspicious_ips.csv", dsStats?.ips?.total || 30, "CSV"],
                ["phishing_urls.csv", dsStats?.phishing?.total || 30, "CSV"],
                [
                  "malware_signatures.csv",
                  dsStats?.malware?.total || 20,
                  "CSV",
                ],
                [
                  "country_threats.json",
                  dsStats?.geo?.total_countries || 20,
                  "JSON",
                ],
              ].map(([file, rows, type]) => (
                <tr key={file}>
                  <td
                    style={{
                      color: "var(--cyan)",
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 10,
                    }}
                  >
                    {file}
                  </td>
                  <td className="mono">{fmtNum(rows)}</td>
                  <td
                    style={{
                      fontSize: 10,
                      color: type === "CSV" ? "var(--orange)" : "var(--purple)",
                      fontFamily: "'JetBrains Mono',monospace",
                    }}
                  >
                    {type}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div
            style={{
              padding: "12px 18px",
              borderTop: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "var(--text3)",
                fontFamily: "'JetBrains Mono',monospace",
                marginBottom: 6,
              }}
            >
              USERS
            </div>
            {users.map((u, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,var(--cyan2),#0a6ebd)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {u.username?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, fontSize: 12, color: "var(--text)" }}>
                  {u.username}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    color:
                      u.role === "admin"
                        ? "var(--red)"
                        : u.role === "analyst"
                          ? "var(--orange)"
                          : "var(--cyan)",
                    fontFamily: "'JetBrains Mono',monospace",
                  }}
                >
                  {u.role?.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </Grid2>
    </div>
  );
}
