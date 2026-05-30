import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  ZoomControl,
} from "react-leaflet";
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
import { datasetAPI } from "../services/api.js";
import {
  PageHeader,
  Panel,
  Grid2,
  StatGrid,
  StatCard,
} from "../components/shared/UI.jsx";
import { fmtNum, CHART_COLORS, rcTooltipStyle } from "../utils/helpers.js";

// Country centres for Leaflet markers
const COUNTRY_COORDS = {
  CN: [35.8617, 104.1954],
  RU: [61.524, 105.3188],
  US: [37.0902, -95.7129],
  BR: [-14.235, -51.9253],
  IN: [20.5937, 78.9629],
  UA: [48.3794, 31.1656],
  DE: [51.1657, 10.4515],
  NL: [52.1326, 5.2913],
  IR: [32.4279, 53.688],
  KP: [40.3399, 127.5101],
  NG: [9.082, 8.6753],
  RO: [45.9432, 24.9668],
  TR: [38.9637, 35.2433],
  HK: [22.3193, 114.1694],
  VN: [14.0583, 108.2772],
  ID: [-0.7893, 113.9213],
  PK: [30.3753, 69.3451],
  FR: [46.2276, 2.2137],
  GB: [55.3781, -3.436],
  JP: [36.2048, 138.2529],
};

const THREAT_COLORS = {
  critical: "#ff4757",
  high: "#ff9f43",
  medium: "#ffd32a",
  low: "#00dcb4",
};
const THREAT_RADIUS = { critical: 18, high: 14, medium: 10, low: 7 };

export default function MapPage() {
  const [countries, setCountries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    datasetAPI
      .getGeo()
      .then((r) => {
        setCountries(r.data?.countries || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const mapped = countries.filter((c) => COUNTRY_COORDS[c.code]);

  // Bar chart: top 10 by attack count
  const barData = [...countries]
    .sort((a, b) => b.attack_count - a.attack_count)
    .slice(0, 10)
    .map((c) => ({
      name: c.code,
      count: c.attack_count,
      level: c.threat_level,
    }));

  // Summary stats
  const total = countries.reduce((s, c) => s + (c.attack_count || 0), 0);
  const crit = countries.filter((c) => c.threat_level === "critical").length;
  const high = countries.filter((c) => c.threat_level === "high").length;

  return (
    <div>
      <PageHeader
        title="Global Attack Map"
        subtitle="Leaflet.js interactive map · Data from country_threats.json dataset · Click a marker for details"
      />

      <StatGrid cols={4} mb={16}>
        <StatCard
          label="COUNTRIES TRACKED"
          value={fmtNum(countries.length)}
          variant="info"
        />
        <StatCard
          label="CRITICAL NATIONS"
          value={fmtNum(crit)}
          variant="danger"
        />
        <StatCard label="HIGH THREAT" value={fmtNum(high)} variant="warning" />
        <StatCard
          label="TOTAL INCIDENTS"
          value={fmtNum(total)}
          variant="success"
        />
      </StatGrid>

      <Panel
        title="INTERACTIVE THREAT MAP"
        badge="● DATASET"
        badgeClass="badge-count"
        style={{ marginBottom: 16 }}
      >
        {!loading && (
          <div
            style={{
              height: 420,
              borderRadius: "0 0 8px 8px",
              overflow: "hidden",
            }}
          >
            <MapContainer
              center={[20, 10]}
              zoom={2}
              minZoom={2}
              maxZoom={6}
              style={{ height: "100%", width: "100%", background: "#0d1520" }}
              zoomControl={false}
            >
              <ZoomControl position="bottomright" />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
                opacity={0.3}
              />
              {mapped.map((country) => {
                const [lat, lng] = COUNTRY_COORDS[country.code];
                const color = THREAT_COLORS[country.threat_level] || "#00dcb4";
                const radius = THREAT_RADIUS[country.threat_level] || 7;
                return (
                  <CircleMarker
                    key={country.code}
                    center={[lat, lng]}
                    radius={radius}
                    pathOptions={{
                      color,
                      fillColor: color,
                      fillOpacity: 0.6,
                      weight: 1.5,
                    }}
                    eventHandlers={{ click: () => setSelected(country) }}
                  >
                    <Popup>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 11,
                          background: "#111d2b",
                          color: "#c8d8e8",
                          padding: 4,
                          minWidth: 180,
                        }}
                      >
                        <div
                          style={{ fontWeight: 700, color, marginBottom: 6 }}
                        >
                          {country.name} ({country.code})
                        </div>
                        <div>
                          Threat Level:{" "}
                          <span style={{ color }}>
                            {country.threat_level?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          Attack Count:{" "}
                          <span style={{ color: "#00dcb4" }}>
                            {fmtNum(country.attack_count)}
                          </span>
                        </div>
                        <div style={{ marginTop: 6 }}>Top Attacks:</div>
                        {(country.top_attacks || []).map((a) => (
                          <div
                            key={a}
                            style={{ color: "#7a9ab4", paddingLeft: 8 }}
                          >
                            • {a}
                          </div>
                        ))}
                        {(country.known_threat_actors || []).length > 0 && (
                          <>
                            <div style={{ marginTop: 6 }}>Threat Actors:</div>
                            {country.known_threat_actors.map((a) => (
                              <div
                                key={a}
                                style={{ color: "#ff9f43", paddingLeft: 8 }}
                              >
                                • {a}
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        )}
        {loading && (
          <div
            style={{
              height: 420,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text3)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
            }}
          >
            LOADING MAP DATA...
          </div>
        )}
      </Panel>

      <Grid2>
        <Panel
          title="TOP 10 THREAT ORIGINS"
          badge="● DATASET"
          badgeClass="badge-count"
        >
          <div style={{ padding: "16px 18px", height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
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
                  tick={{ fontSize: 11, fill: CHART_COLORS.text2 }}
                  tickLine={false}
                  width={32}
                />
                <Tooltip {...rcTooltipStyle} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {barData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={THREAT_COLORS[d.level] || CHART_COLORS.cyan}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title={selected ? `DETAIL: ${selected.name}` : "COUNTRY INTELLIGENCE"}
          badge={selected?.threat_level?.toUpperCase()}
          badgeClass={
            selected?.threat_level === "critical" ? "badge-live" : "badge-count"
          }
        >
          {selected ? (
            <div style={{ padding: "16px 18px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                {[
                  ["Code", selected.code],
                  ["Region", selected.region],
                  ["Threat Level", selected.threat_level?.toUpperCase()],
                  ["Attack Count", fmtNum(selected.attack_count)],
                ].map(([l, v]) => (
                  <div
                    key={l}
                    style={{
                      background: "var(--bg3)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      padding: "8px 12px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        color: "var(--text3)",
                        fontFamily: "'JetBrains Mono', monospace",
                        marginBottom: 3,
                      }}
                    >
                      {l}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color:
                          l === "Threat Level"
                            ? THREAT_COLORS[selected.threat_level]
                            : "var(--cyan)",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 600,
                      }}
                    >
                      {v}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text3)",
                    fontFamily: "'JetBrains Mono', monospace",
                    marginBottom: 6,
                  }}
                >
                  TOP ATTACK TYPES
                </div>
                {(selected.top_attacks || []).map((a) => (
                  <div
                    key={a}
                    style={{
                      fontSize: 12,
                      color: "var(--orange)",
                      padding: "2px 0",
                    }}
                  >
                    • {a}
                  </div>
                ))}
              </div>
              {selected.known_threat_actors?.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--text3)",
                      fontFamily: "'JetBrains Mono', monospace",
                      marginBottom: 6,
                    }}
                  >
                    KNOWN THREAT ACTORS
                  </div>
                  {selected.known_threat_actors.map((a) => (
                    <div
                      key={a}
                      style={{
                        fontSize: 12,
                        color: "var(--red)",
                        padding: "2px 0",
                      }}
                    >
                      • {a}
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setSelected(null)}
                className="ctv-btn ghost"
                style={{ marginTop: 14, width: "100%", fontSize: 12 }}
              >
                CLEAR SELECTION
              </button>
            </div>
          ) : (
            <div style={{ padding: "16px 18px" }}>
              <div
                style={{
                  color: "var(--text3)",
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  marginBottom: 16,
                }}
              >
                Click a country marker on the map to see intelligence details
              </div>
              {/* Legend */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(THREAT_COLORS).map(([level, color]) => (
                  <div
                    key={level}
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: THREAT_RADIUS[level] * 2,
                        height: THREAT_RADIUS[level] * 2,
                        borderRadius: "50%",
                        background: color,
                        opacity: 0.7,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 12, color: "var(--text2)" }}>
                      {level.toUpperCase()}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--text3)",
                        fontFamily: "'JetBrains Mono', monospace",
                        marginLeft: "auto",
                      }}
                    >
                      {countries.filter((c) => c.threat_level === level).length}{" "}
                      countries
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
      </Grid2>
    </div>
  );
}
