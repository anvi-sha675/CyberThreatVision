import React, { useState } from "react";
import {
  Shield,
  Search,
  Globe,
  Hash,
  List,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { scanAPI } from "../services/api.js";
import { useScanStore } from "../store/index.js";
import {
  PageHeader,
  Panel,
  Grid2,
  RiskGauge,
  ProgressBar,
  SevBadge,
  Mono,
  InfoCard,
  TableScroll,
} from "../components/shared/UI.jsx";
import {
  riskLevel,
  fmtTime,
  CHART_COLORS,
  rcTooltipStyle,
  isValidURL,
  isValidIP,
  isValidHash,
} from "../utils/helpers.js";

const TABS = [
  {
    key: "url",
    label: "URL",
    icon: Globe,
    placeholder: "https://suspicious-site.xyz/login",
  },
  {
    key: "ip",
    label: "IP Address",
    icon: Shield,
    placeholder: "185.220.101.45",
  },
  {
    key: "hash",
    label: "File Hash",
    icon: Hash,
    placeholder: "MD5 hash (32 chars)",
  },
  {
    key: "bulk",
    label: "Bulk Scan",
    icon: List,
    placeholder: "One target per line (ip:1.2.3.4 or url:https://...)",
  },
];

export default function ScanPage() {
  const [tab, setTab] = useState("url");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [bulkResult, setBulkResult] = useState(null);
  const [error, setError] = useState("");
  const { history, addScan } = useScanStore();

  const validate = (val) => {
    if (tab === "url")
      return (
        isValidURL(val) || "Invalid URL — must start with http:// or https://"
      );
    if (tab === "ip") return isValidIP(val) || "Invalid IPv4 address";
    if (tab === "hash")
      return (
        isValidHash(val) ||
        "Invalid hash — enter a 32-char MD5 or 64-char SHA256"
      );
    return true;
  };

  const handleScan = async () => {
    setError("");
    setResult(null);
    setBulkResult(null);
    const val = input.trim();
    if (!val) {
      setError("Enter a target to scan");
      return;
    }
    if (tab !== "bulk") {
      const v = validate(val);
      if (v !== true) {
        setError(v);
        return;
      }
    }
    setLoading(true);
    try {
      let data;
      if (tab === "url") {
        const r = await scanAPI.url(val);
        data = r.data;
      }
      if (tab === "ip") {
        const r = await scanAPI.ip(val);
        data = r.data;
      }
      if (tab === "hash") {
        const r = await scanAPI.hash(val);
        data = r.data;
      }
      if (tab === "bulk") {
        const targets = val
          .split("\n")
          .filter(Boolean)
          .map((line) => {
            const [typeStr, value] = line.split(":");
            return {
              type: typeStr.trim().toLowerCase(),
              value: value?.trim() || typeStr.trim(),
            };
          });
        const r = await scanAPI.bulk(targets);
        setBulkResult(r.data);
        addScan({
          type: "bulk",
          target: `${targets.length} targets`,
          risk_score: 0,
          is_threat: r.data.threats > 0,
        });
        setLoading(false);
        return;
      }
      setResult(data);
      addScan({
        type: tab,
        target: val,
        risk_score:
          data.risk_score || Math.round((data.phishing_score || 0) * 100),
        is_threat: data.is_threat || data.is_phishing || data.found,
      });
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Scan failed — backend or ML service may be offline",
      );
    } finally {
      setLoading(false);
    }
  };

  const riskScore = result
    ? result.risk_score || Math.round((result.phishing_score || 0) * 100)
    : 0;
  const rl = riskLevel(riskScore);

  return (
    <div>
      <PageHeader
        title="Scan & Analyze"
        subtitle="Dataset lookup → ML scoring (Python Flask) → MySQL log · Works fully offline"
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => {
              setTab(key);
              setResult(null);
              setBulkResult(null);
              setError("");
              setInput("");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 18px",
              borderRadius: 8,
              cursor: "pointer",
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 1,
              transition: "all .15s",
              border:
                tab === key
                  ? "1px solid var(--cyan2)"
                  : "1px solid var(--border)",
              background: tab === key ? "rgba(0,220,180,0.1)" : "var(--bg2)",
              color: tab === key ? "var(--cyan)" : "var(--text2)",
            }}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      <Panel
        title={`${TABS.find((t) => t.key === tab)?.label || "Target"} Scanner`}
        style={{ marginBottom: 16 }}
      >
        <div style={{ padding: "18px" }}>
          <div
            style={{ display: "flex", gap: 10, marginBottom: error ? 12 : 0 }}
          >
            <input
              className="ctv-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={TABS.find((t) => t.key === tab)?.placeholder}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleScan()}
              style={{
                fontFamily:
                  tab === "bulk" ? "'JetBrains Mono', monospace" : undefined,
              }}
            />
            <button
              className="ctv-btn"
              onClick={handleScan}
              disabled={loading}
              style={{
                minWidth: 130,
                display: "flex",
                alignItems: "center",
                gap: 8,
                justifyContent: "center",
              }}
            >
              <Search size={14} /> {loading ? "SCANNING..." : "SCAN"}
            </button>
          </div>
          {error && (
            <div
              style={{
                color: "var(--red)",
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                marginTop: 10,
              }}
            >
              ✕ {error}
            </div>
          )}

          {result && (
            <div
              style={{
                marginTop: 20,
                padding: "16px 0",
                borderTop: "1px solid var(--border)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "flex-start", gap: 24 }}
              >
                <RiskGauge score={riskScore} size={110} />
                <div style={{ flex: 1 }}>
                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 14,
                    }}
                  >
                    {riskScore >= 50 ? (
                      <XCircle size={20} color="var(--red)" />
                    ) : (
                      <CheckCircle size={20} color="var(--cyan)" />
                    )}
                    <div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: rl.color,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {rl.label} RISK — {riskScore}/100
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text2)",
                          marginTop: 2,
                        }}
                      >
                        Source:{" "}
                        <span style={{ color: "var(--cyan)" }}>
                          {result.source?.toUpperCase()}
                        </span>
                        {result.in_dataset && (
                          <span
                            style={{ color: "var(--orange)", marginLeft: 8 }}
                          >
                            ● IN DATASET
                          </span>
                        )}
                        {result.found && (
                          <span style={{ color: "var(--red)", marginLeft: 8 }}>
                            ● KNOWN MALWARE
                          </span>
                        )}
                      </div>
                    </div>
                    <SevBadge sev={rl.label.toLowerCase()} />
                  </div>

                  {/* Score bars */}
                  {tab === "url" && result.features && (
                    <div>
                      {[
                        [
                          "Phishing Score",
                          Math.round((result.phishing_score || 0) * 100),
                          rl.color,
                        ],
                        [
                          "Suspicious Keywords",
                          Math.min(
                            100,
                            (result.features.suspicious_word_count || 0) * 12,
                          ),
                          "var(--orange)",
                        ],
                        [
                          "URL Length Risk",
                          Math.min(
                            100,
                            Math.max(0, (result.features.length || 0) - 40) *
                              1.5,
                          ),
                          "var(--yellow)",
                        ],
                        [
                          "Suspicious TLD",
                          (result.features.suspicious_tld || 0) * 100,
                          "var(--red)",
                        ],
                        [
                          "Confidence",
                          Math.round((result.confidence || 0) * 100),
                          "var(--cyan)",
                        ],
                      ].map(([label, val, color]) => (
                        <div
                          key={label}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 7,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              color: "var(--text3)",
                              fontFamily: "'JetBrains Mono', monospace",
                              width: 150,
                              flexShrink: 0,
                            }}
                          >
                            {label}
                          </span>
                          <div style={{ flex: 1 }}>
                            <ProgressBar
                              value={Math.round(val)}
                              max={100}
                              color={color}
                            />
                          </div>
                          <Mono size={10} color={color}>
                            {Math.round(val)}
                          </Mono>
                        </div>
                      ))}
                    </div>
                  )}

                  {tab === "ip" && result.details && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 8,
                        marginTop: 8,
                      }}
                    >
                      {[
                        ["Country", result.details.country],
                        ["ISP", result.details.isp],
                        ["CC", result.details.country_code],
                        ["Reports", result.details.report_count],
                        [
                          "Tor Exit",
                          result.details.is_tor === "true" ? "YES" : "NO",
                        ],
                        ["Last Seen", result.details.last_seen],
                      ].map(([k, v]) => (
                        <InfoCard
                          key={k}
                          label={k}
                          value={v}
                          color={
                            k === "Tor Exit" && v === "YES"
                              ? "var(--red)"
                              : "var(--cyan)"
                          }
                        />
                      ))}
                    </div>
                  )}

                  {tab === "hash" && result.found && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 8,
                        marginTop: 8,
                      }}
                    >
                      {[
                        ["Name", result.name],
                        ["Family", result.family],
                        ["Type", result.type],
                        ["Detection", `${result.detection_rate}%`],
                        ["AV Vendors", result.av_vendors],
                        ["First Seen", result.first_seen],
                      ].map(([k, v]) => (
                        <InfoCard
                          key={k}
                          label={k}
                          value={v}
                          color={k === "Type" ? "var(--orange)" : "var(--cyan)"}
                        />
                      ))}
                    </div>
                  )}

                  {tab === "hash" && !result.found && (
                    <div
                      style={{
                        color: "var(--cyan)",
                        fontSize: 13,
                        marginTop: 8,
                      }}
                    >
                      ✓ Hash not found in local malware dataset — considered
                      clean
                    </div>
                  )}

                  {/* Dataset match */}
                  {result.dataset_match?.found && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: "10px 14px",
                        background: "rgba(255,71,87,0.07)",
                        border: "1px solid rgba(255,71,87,0.25)",
                        borderRadius: 6,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--red)",
                          fontFamily: "'JetBrains Mono', monospace",
                          marginBottom: 4,
                        }}
                      >
                        ⚠ FOUND IN PHISHING DATASET
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text2)" }}>
                        Category:{" "}
                        <span style={{ color: "var(--orange)" }}>
                          {result.dataset_match.category}
                        </span>{" "}
                        · Target:{" "}
                        <span style={{ color: "var(--orange)" }}>
                          {result.dataset_match.target_brand}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* MITRE techniques */}
                  {result.mitre_techniques?.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--text3)",
                          fontFamily: "'JetBrains Mono', monospace",
                          marginBottom: 6,
                        }}
                      >
                        MITRE ATT&CK TECHNIQUES
                      </div>
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                      >
                        {result.mitre_techniques.map((t) => (
                          <span
                            key={t}
                            style={{
                              background: "rgba(162,155,254,0.12)",
                              border: "1px solid rgba(162,155,254,0.3)",
                              borderRadius: 4,
                              padding: "2px 8px",
                              fontSize: 10,
                              color: "var(--purple)",
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {bulkResult && (
            <div
              style={{
                marginTop: 20,
                borderTop: "1px solid var(--border)",
                paddingTop: 16,
              }}
            >
              <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
                {[
                  ["TOTAL SCANNED", bulkResult.total, "var(--cyan)"],
                  ["THREATS FOUND", bulkResult.threats, "var(--red)"],
                  [
                    "CLEAN",
                    bulkResult.total - bulkResult.threats,
                    "var(--cyan)",
                  ],
                ].map(([l, v, c]) => (
                  <div
                    key={l}
                    style={{
                      background: "var(--bg3)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      padding: "10px 16px",
                      flex: 1,
                      textAlign: "center",
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
                      {l}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: c }}>
                      {v}
                    </div>
                  </div>
                ))}
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>TARGET</th>
                    <th>TYPE</th>
                    <th>RISK SCORE</th>
                    <th>THREAT</th>
                    <th>LEVEL</th>
                  </tr>
                </thead>
                <tbody>
                  {(bulkResult.results || []).map((r, i) => (
                    <tr
                      key={i}
                      style={
                        r.is_threat
                          ? { background: "rgba(255,71,87,0.03)" }
                          : {}
                      }
                    >
                      <td
                        className="mono"
                        style={{
                          maxWidth: 260,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.value}
                      </td>
                      <td style={{ fontSize: 11 }}>{r.type?.toUpperCase()}</td>
                      <td>
                        <span
                          style={{
                            color:
                              r.score >= 70
                                ? "var(--red)"
                                : r.score >= 50
                                  ? "var(--orange)"
                                  : "var(--cyan)",
                            fontWeight: 700,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {r.score}
                        </span>
                      </td>
                      <td>
                        {r.is_threat ? (
                          <XCircle size={14} color="var(--red)" />
                        ) : (
                          <CheckCircle size={14} color="var(--cyan)" />
                        )}
                      </td>
                      <td>
                        <SevBadge sev={r.risk_level} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Panel>

      <Panel
        title="SESSION SCAN HISTORY"
        badge={`${history.length} scans`}
        badgeClass="badge-count"
      >
        <TableScroll maxHeight={280}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>TYPE</th>
                <th>TARGET</th>
                <th>RISK</th>
                <th>THREAT</th>
                <th>TIME</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      padding: 20,
                      color: "var(--text3)",
                      fontSize: 12,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    No scans yet — run your first scan above
                  </td>
                </tr>
              )}
              {history.map((s, i) => (
                <tr key={s.id}>
                  <td className="mono" style={{ color: "var(--text3)" }}>
                    {history.length - i}
                  </td>
                  <td style={{ fontSize: 11 }}>{s.type?.toUpperCase()}</td>
                  <td
                    className="mono"
                    style={{
                      maxWidth: 280,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.target}
                  </td>
                  <td>
                    <span
                      style={{
                        fontWeight: 700,
                        fontFamily: "'JetBrains Mono', monospace",
                        color:
                          s.risk_score >= 70
                            ? "var(--red)"
                            : s.risk_score >= 40
                              ? "var(--orange)"
                              : "var(--cyan)",
                      }}
                    >
                      {s.risk_score}
                    </span>
                  </td>
                  <td>
                    {s.is_threat ? (
                      <span
                        style={{
                          color: "var(--red)",
                          fontSize: 11,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        THREAT
                      </span>
                    ) : (
                      <span
                        style={{
                          color: "var(--cyan)",
                          fontSize: 11,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        CLEAN
                      </span>
                    )}
                  </td>
                  <td className="mono">{fmtTime(new Date(s.id))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </Panel>
    </div>
  );
}
