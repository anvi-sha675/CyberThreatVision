const fs = require("fs");
const path = require("path");
const csv = require("csv-parse/sync");
const logger = require("../utils/logger");

const DATASET_DIR = path.resolve(
  process.env.DATASET_DIR || path.join(__dirname, "../../../../datasets"),
);

const loadCSV = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return csv.parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (err) {
    logger.error(`Failed to load CSV ${filePath}: ${err.message}`);
    return [];
  }
};

const loadJSON = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
  } catch (err) {
    logger.error(`Failed to load JSON ${filePath}: ${err.message}`);
    return null;
  }
};

const datasets = {
  ips: [],
  phishing: [],
  malware: [],
  geo: null,
};

const loadAll = () => {
  datasets.ips = loadCSV(path.join(DATASET_DIR, "ips", "suspicious_ips.csv"));
  datasets.phishing = loadCSV(
    path.join(DATASET_DIR, "phishing", "phishing_urls.csv"),
  );
  datasets.malware = loadCSV(
    path.join(DATASET_DIR, "malware", "malware_signatures.csv"),
  );
  datasets.geo = loadJSON(
    path.join(DATASET_DIR, "geo", "country_threats.json"),
  );

  logger.info(
    `📊 Datasets loaded: ${datasets.ips.length} IPs, ${datasets.phishing.length} phishing URLs, ${datasets.malware.length} malware samples`,
  );
};

loadAll();

const getIPLookup = () => new Map(datasets.ips.map((r) => [r.ip_address, r]));
const getHashLookup = () =>
  new Map(datasets.malware.map((r) => [r.md5_hash, r]));

const queryIPs = ({
  minScore = 0,
  country = null,
  limit = 100,
  search = null,
} = {}) => {
  let rows = datasets.ips;
  if (minScore)
    rows = rows.filter((r) => parseInt(r.abuse_score || 0) >= minScore);
  if (country)
    rows = rows.filter(
      (r) => r.country_code?.toUpperCase() === country.toUpperCase(),
    );
  if (search)
    rows = rows.filter(
      (r) =>
        r.ip_address?.includes(search) ||
        r.country_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.isp?.toLowerCase().includes(search.toLowerCase()),
    );
  return rows.slice(0, limit);
};

const queryPhishing = ({
  brand = null,
  category = null,
  minRisk = 0,
  limit = 100,
} = {}) => {
  let rows = datasets.phishing;
  if (brand)
    rows = rows.filter((r) =>
      r.target_brand?.toLowerCase().includes(brand.toLowerCase()),
    );
  if (category)
    rows = rows.filter((r) =>
      r.category?.toLowerCase().includes(category.toLowerCase()),
    );
  if (minRisk)
    rows = rows.filter((r) => parseInt(r.risk_score || 0) >= minRisk);
  return rows.slice(0, limit);
};

const queryMalware = ({
  type = null,
  family = null,
  severity = null,
  limit = 100,
} = {}) => {
  let rows = datasets.malware;
  if (type)
    rows = rows.filter((r) => r.type?.toLowerCase() === type.toLowerCase());
  if (family)
    rows = rows.filter((r) =>
      r.family?.toLowerCase().includes(family.toLowerCase()),
    );
  if (severity)
    rows = rows.filter(
      (r) => r.severity?.toLowerCase() === severity.toLowerCase(),
    );
  return rows.slice(0, limit);
};

const getStats = () => ({
  ips: {
    total: datasets.ips.length,
    critical: datasets.ips.filter((r) => parseInt(r.abuse_score || 0) >= 80)
      .length,
    high: datasets.ips.filter((r) => {
      const s = parseInt(r.abuse_score || 0);
      return s >= 60 && s < 80;
    }).length,
    medium: datasets.ips.filter((r) => {
      const s = parseInt(r.abuse_score || 0);
      return s >= 40 && s < 60;
    }).length,
  },
  phishing: {
    total: datasets.phishing.length,
    active: datasets.phishing.filter((r) => r.is_active === "true").length,
    high_risk: datasets.phishing.filter(
      (r) => parseInt(r.risk_score || 0) >= 80,
    ).length,
  },
  malware: {
    total: datasets.malware.length,
    ransomware: datasets.malware.filter((r) => r.type === "Ransomware").length,
    critical: datasets.malware.filter((r) => r.severity === "critical").length,
  },
  geo: {
    total_countries: datasets.geo?.countries?.length || 0,
    critical_nations:
      datasets.geo?.countries?.filter((c) => c.threat_level === "critical")
        .length || 0,
  },
});

module.exports = {
  datasets,
  loadAll,
  getIPLookup,
  getHashLookup,
  queryIPs,
  queryPhishing,
  queryMalware,
  getStats,
};
