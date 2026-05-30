import React, { useState, useEffect } from "react";
import { datasetAPI } from "../services/api.js";
import {
  PageHeader,
  Panel,
  StatGrid,
  StatCard,
  SevBadge,
  TableScroll,
  LoadingRow,
} from "../components/shared/UI.jsx";
import { fmtNum } from "../utils/helpers.js";

export default function DatasetPage() {
  const [ips, setIPs] = useState([]);
  const [phishing, setPhishing] = useState([]);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState("ips");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      datasetAPI.getIPs({ limit: 30 }),
      datasetAPI.getPhishing({ limit: 30 }),
      datasetAPI.getStats(),
    ])
      .then(([i, p, s]) => {
        setIPs(i.data.ips || []);
        setPhishing(p.data.urls || []);
        setStats(s.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredIPs = ips.filter(
    (ip) =>
      !search ||
      ip.ip_address?.includes(search) ||
      ip.country_name?.toLowerCase().includes(search.toLowerCase()) ||
      ip.isp?.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredPh = phishing.filter(
    (p) =>
      !search ||
      p.url?.toLowerCase().includes(search.toLowerCase()) ||
      p.target_brand?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <PageHeader
        title="Dataset Browser"
        subtitle="Local CSV datasets — suspicious_ips.csv · phishing_urls.csv · 100% offline"
      />
      <StatGrid cols={4}>
        <StatCard
          label="SUSPICIOUS IPs"
          value={fmtNum(stats?.ips?.total)}
          variant="danger"
        />
        <StatCard
          label="CRITICAL IPs"
          value={fmtNum(stats?.ips?.critical)}
          variant="danger"
        />
        <StatCard
          label="PHISHING URLs"
          value={fmtNum(stats?.phishing?.total)}
          variant="warning"
        />
        <StatCard
          label="ACTIVE PHISHING"
          value={fmtNum(stats?.phishing?.active)}
          variant="info"
        />
      </StatGrid>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {["ips", "phishing"].map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setSearch("");
            }}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border:
                tab === t
                  ? "1px solid var(--cyan2)"
                  : "1px solid var(--border)",
              background: tab === t ? "rgba(0,220,180,0.1)" : "var(--bg2)",
              color: tab === t ? "var(--cyan)" : "var(--text2)",
              cursor: "pointer",
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            {t === "ips" ? "🛡 Suspicious IPs" : "🎣 Phishing URLs"}
          </button>
        ))}
        <input
          className="ctv-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search dataset..."
          style={{ maxWidth: 260 }}
        />
      </div>
      {tab === "ips" && (
        <Panel
          title="suspicious_ips.csv"
          badge={`${fmtNum(filteredIPs.length)} records`}
          badgeClass="badge-count"
        >
          <TableScroll maxHeight={460}>
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
                  <th>LAST SEEN</th>
                </tr>
              </thead>
              <tbody>
                {loading && <LoadingRow cols={8} />}
                {filteredIPs.map((ip, i) => {
                  const score = parseInt(ip.abuse_score || 0);
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
                            color:
                              score >= 80
                                ? "var(--red)"
                                : score >= 60
                                  ? "var(--orange)"
                                  : "var(--cyan)",
                            fontWeight: 700,
                            fontFamily: "'JetBrains Mono',monospace",
                          }}
                        >
                          {score}
                        </span>
                      </td>
                      <td className="mono">{fmtNum(ip.report_count)}</td>
                      <td
                        style={{
                          color:
                            ip.is_tor === "true"
                              ? "var(--red)"
                              : "var(--text3)",
                          fontSize: 11,
                        }}
                      >
                        {ip.is_tor === "true" ? "✓" : "—"}
                      </td>
                      <td className="mono">{ip.last_seen}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableScroll>
        </Panel>
      )}
      {tab === "phishing" && (
        <Panel
          title="phishing_urls.csv"
          badge={`${fmtNum(filteredPh.length)} records`}
          badgeClass="badge-count"
        >
          <TableScroll maxHeight={460}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>URL</th>
                  <th>CATEGORY</th>
                  <th>BRAND</th>
                  <th>IP</th>
                  <th>RISK</th>
                  <th>HTTPS</th>
                  <th>ML SCORE</th>
                </tr>
              </thead>
              <tbody>
                {loading && <LoadingRow cols={7} />}
                {filteredPh.map((p, i) => (
                  <tr key={i}>
                    <td
                      className="mono"
                      style={{
                        fontSize: 10,
                        color: "var(--red)",
                        maxWidth: 240,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.url}
                    </td>
                    <td style={{ fontSize: 11 }}>{p.category}</td>
                    <td style={{ color: "var(--orange)", fontSize: 12 }}>
                      {p.target_brand}
                    </td>
                    <td className="mono">{p.ip_address}</td>
                    <td>
                      <span
                        style={{
                          color:
                            parseInt(p.risk_score || 0) >= 80
                              ? "var(--red)"
                              : "var(--orange)",
                          fontWeight: 700,
                          fontFamily: "'JetBrains Mono',monospace",
                        }}
                      >
                        {p.risk_score}
                      </span>
                    </td>
                    <td
                      style={{
                        fontSize: 11,
                        color:
                          p.has_https === "true" ? "var(--cyan)" : "var(--red)",
                      }}
                    >
                      {p.has_https === "true" ? "✓" : "✗"}
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 11,
                          color:
                            parseFloat(p.ml_score || 0) >= 0.8
                              ? "var(--red)"
                              : "var(--orange)",
                        }}
                      >
                        {parseFloat(p.ml_score || 0).toFixed(2)}
                      </span>
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
