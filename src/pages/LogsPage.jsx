import React, { useState, useEffect } from "react";
import { logsAPI } from "../services/api.js";
import {
  PageHeader,
  Panel,
  StatGrid,
  StatCard,
  TableScroll,
  LoadingRow,
} from "../components/shared/UI.jsx";
import { fmtNum, fmtTime } from "../utils/helpers.js";
import { useInterval } from "../hooks/index.js";

export default function LogsPage() {
  const [activityLogs, setActivityLogs] = useState([]);
  const [scanLogs, setScanLogs] = useState([]);
  const [tab, setTab] = useState("scans");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [a, s] = await Promise.all([
        logsAPI.activity({ limit: 50 }),
        logsAPI.scans({ limit: 50 }),
      ]);
      setActivityLogs(a.data.logs || []);
      setScanLogs(s.data.logs || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  useInterval(load, 15000);

  return (
    <div>
      <PageHeader
        title="Activity Logs"
        subtitle="All requests logged to MySQL activity_log · Scan results in scan_logs table"
      />
      <StatGrid cols={3}>
        <StatCard
          label="ACTIVITY ENTRIES"
          value={fmtNum(activityLogs.length)}
          variant="info"
        />
        <StatCard
          label="SCAN LOG ENTRIES"
          value={fmtNum(scanLogs.length)}
          variant="warning"
        />
        <StatCard label="DB" value="MySQL 8" variant="success" />
      </StatGrid>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[
          ["scans", "Scan Logs"],
          ["activity", "Activity Log"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border:
                tab === k
                  ? "1px solid var(--cyan2)"
                  : "1px solid var(--border)",
              background: tab === k ? "rgba(0,220,180,0.1)" : "var(--bg2)",
              color: tab === k ? "var(--cyan)" : "var(--text2)",
              cursor: "pointer",
              fontFamily: "'Rajdhani',sans-serif",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            {l}
          </button>
        ))}
      </div>
      {tab === "scans" && (
        <Panel
          title="scan_logs — MySQL"
          badge={`${fmtNum(scanLogs.length)} entries`}
          badgeClass="badge-count"
        >
          <TableScroll maxHeight={480}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>TIME</th>
                  <th>TYPE</th>
                  <th>TARGET</th>
                  <th>RISK</th>
                  <th>THREAT</th>
                  <th>SOURCE</th>
                </tr>
              </thead>
              <tbody>
                {loading && <LoadingRow cols={7} />}
                {scanLogs.map((l, i) => (
                  <tr
                    key={i}
                    style={
                      l.is_threat ? { background: "rgba(255,71,87,0.03)" } : {}
                    }
                  >
                    <td className="mono" style={{ color: "var(--text3)" }}>
                      {l.id}
                    </td>
                    <td className="mono">
                      {fmtTime(l.scanned_at || new Date())}
                    </td>
                    <td style={{ fontSize: 11 }}>
                      {l.scan_type?.toUpperCase()}
                    </td>
                    <td
                      className="mono"
                      style={{
                        maxWidth: 220,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {l.target}
                    </td>
                    <td>
                      <span
                        style={{
                          color:
                            l.risk_score >= 80
                              ? "var(--red)"
                              : l.risk_score >= 50
                                ? "var(--orange)"
                                : "var(--cyan)",
                          fontWeight: 700,
                          fontFamily: "'JetBrains Mono',monospace",
                        }}
                      >
                        {l.risk_score}
                      </span>
                    </td>
                    <td
                      style={{
                        fontSize: 10,
                        fontFamily: "'JetBrains Mono',monospace",
                        color: l.is_threat ? "var(--red)" : "var(--cyan)",
                      }}
                    >
                      {l.is_threat ? "THREAT" : "CLEAN"}
                    </td>
                    <td
                      style={{
                        fontSize: 10,
                        color: "var(--text3)",
                        fontFamily: "'JetBrains Mono',monospace",
                      }}
                    >
                      {l.source?.toUpperCase()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        </Panel>
      )}
      {tab === "activity" && (
        <Panel
          title="activity_log — MySQL"
          badge={`${fmtNum(activityLogs.length)} entries`}
          badgeClass="badge-count"
        >
          <TableScroll maxHeight={480}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>TIME</th>
                  <th>USER</th>
                  <th>ACTION</th>
                  <th>RESOURCE</th>
                  <th>IP</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {loading && <LoadingRow cols={7} />}
                {activityLogs.map((l, i) => (
                  <tr key={i}>
                    <td className="mono" style={{ color: "var(--text3)" }}>
                      {l.id}
                    </td>
                    <td className="mono">
                      {fmtTime(l.created_at || new Date())}
                    </td>
                    <td style={{ fontSize: 12 }}>{l.username || "system"}</td>
                    <td
                      style={{
                        fontSize: 11,
                        color:
                          l.action === "POST"
                            ? "var(--orange)"
                            : l.action === "DELETE"
                              ? "var(--red)"
                              : "var(--text2)",
                        fontFamily: "'JetBrains Mono',monospace",
                      }}
                    >
                      {l.action}
                    </td>
                    <td
                      style={{
                        fontSize: 11,
                        color: "var(--cyan)",
                        fontFamily: "'JetBrains Mono',monospace",
                      }}
                    >
                      {l.resource}
                    </td>
                    <td className="mono">{l.ip_address}</td>
                    <td
                      style={{
                        fontSize: 10,
                        color:
                          l.status === "success" ? "var(--cyan)" : "var(--red)",
                        fontFamily: "'JetBrains Mono',monospace",
                      }}
                    >
                      {(l.status || "success").toUpperCase()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        </Panel>
      )}
    </div>
  );
}
