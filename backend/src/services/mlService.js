const axios = require("axios");
const logger = require("../utils/logger");
const { queryIPs, queryPhishing, getIPLookup } = require("./datasetService");

const ML_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";
let mlAvailable = false;

const checkMLHealth = async () => {
  try {
    const { data } = await axios.get(`${ML_URL}/health`, { timeout: 3000 });
    mlAvailable = data.status === "ok";
    if (mlAvailable) logger.info("✅ ML microservice connected");
  } catch {
    mlAvailable = false;
    logger.warn("⚠  ML microservice unavailable — using rule-based fallbacks");
  }
  return mlAvailable;
};

// Check on startup
checkMLHealth();
setInterval(checkMLHealth, 60000); // Re-check every minute

const analyzeURL = async (url) => {
  if (mlAvailable) {
    try {
      const { data } = await axios.post(
        `${ML_URL}/analyze/url`,
        { url },
        { timeout: 5000 },
      );
      return { ...data, source: "ml" };
    } catch (err) {
      logger.warn(`ML URL analysis failed: ${err.message}`);
    }
  }
  // Rule-based fallback
  return ruleBasedURLAnalysis(url);
};

const analyzeIP = async (ip) => {
  if (mlAvailable) {
    try {
      const { data } = await axios.post(
        `${ML_URL}/analyze/ip`,
        { ip },
        { timeout: 5000 },
      );
      return { ...data, source: "ml" };
    } catch (err) {
      logger.warn(`ML IP analysis failed: ${err.message}`);
    }
  }
  // Dataset fallback
  return ruleBasedIPAnalysis(ip);
};

const analyzeHash = async (hash) => {
  if (mlAvailable) {
    try {
      const { data } = await axios.post(
        `${ML_URL}/analyze/hash`,
        { hash },
        { timeout: 5000 },
      );
      return { ...data, source: "ml" };
    } catch (err) {
      logger.warn(`ML hash analysis failed: ${err.message}`);
    }
  }
  return {
    hash,
    found: false,
    source: "rules",
    message: "ML service unavailable",
  };
};

const bulkScan = async (targets) => {
  if (mlAvailable) {
    try {
      const { data } = await axios.post(
        `${ML_URL}/bulk/scan`,
        { targets },
        { timeout: 10000 },
      );
      return { ...data, source: "ml" };
    } catch (err) {
      logger.warn(`ML bulk scan failed: ${err.message}`);
    }
  }
  // Fallback — process each target with rules
  const results = targets.slice(0, 50).map((t) => {
    if (t.type === "ip") {
      const r = ruleBasedIPAnalysis(t.value);
      return {
        value: t.value,
        type: "ip",
        score: r.risk_score,
        is_threat: r.risk_score >= 50,
        risk_level: r.risk_level,
      };
    } else {
      const r = ruleBasedURLAnalysis(t.value);
      return {
        value: t.value,
        type: "url",
        score: Math.round(r.phishing_score * 100),
        is_threat: r.is_phishing,
        risk_level: r.risk_level,
      };
    }
  });
  return {
    results,
    total: results.length,
    threats: results.filter((r) => r.is_threat).length,
    source: "rules",
  };
};

const ruleBasedURLAnalysis = (url) => {
  const urlLower = url.toLowerCase();
  let score = 0.0;

  if (!url.startsWith("https")) score += 0.1;
  if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url)) score += 0.3;
  if (url.length > 75) score += 0.12;
  if (url.length > 100) score += 0.08;
  if ((url.match(/-/g) || []).length > 3) score += 0.12;
  if ((url.match(/@/g) || []).length > 0) score += 0.2;

  const suspicious = [
    "login",
    "verify",
    "secure",
    "account",
    "update",
    "confirm",
    "banking",
    "paypal",
    "amazon",
    "microsoft",
    "apple",
    "netflix",
    "wallet",
    "suspended",
    "locked",
    "alert",
    "urgent",
    "password",
    "credential",
    "coinbase",
  ];
  score += Math.min(
    0.3,
    suspicious.filter((w) => urlLower.includes(w)).length * 0.06,
  );

  const suspTLDs = [
    ".xyz",
    ".top",
    ".info",
    ".ru",
    ".cn",
    ".tk",
    ".ml",
    ".ga",
    ".cf",
  ];
  if (suspTLDs.some((t) => urlLower.includes(t))) score += 0.18;

  // Dataset match
  const phishRows = queryPhishing({ minRisk: 50 });
  for (const row of phishRows) {
    if (row.domain && urlLower.includes(row.domain.toLowerCase())) {
      score = Math.max(score, parseFloat(row.ml_score || 0.9));
      break;
    }
  }

  const finalScore = Math.min(1.0, score);
  return {
    url,
    phishing_score: finalScore,
    risk_level:
      finalScore >= 0.85
        ? "critical"
        : finalScore >= 0.65
          ? "high"
          : finalScore >= 0.4
            ? "medium"
            : "low",
    is_phishing: finalScore >= 0.5,
    source: "rules",
    confidence: Math.abs(finalScore - 0.5) * 2,
  };
};

const ruleBasedIPAnalysis = (ip) => {
  const lookup = getIPLookup();
  if (lookup.has(ip)) {
    const row = lookup.get(ip);
    const score = parseInt(row.abuse_score || 0);
    return {
      ip,
      risk_score: score,
      risk_level:
        score >= 80
          ? "critical"
          : score >= 60
            ? "high"
            : score >= 40
              ? "medium"
              : "low",
      in_dataset: true,
      is_anomaly: score >= 90,
      source: "dataset",
      details: {
        country: row.country_name,
        country_code: row.country_code,
        isp: row.isp,
        attack_types: row.attack_types,
        report_count: row.report_count,
        is_tor: row.is_tor,
        is_proxy: row.is_proxy,
        latitude: parseFloat(row.latitude || 0),
        longitude: parseFloat(row.longitude || 0),
        last_seen: row.last_seen,
      },
    };
  }
  const score = 20;
  return {
    ip,
    risk_score: score,
    risk_level: "low",
    in_dataset: false,
    is_anomaly: false,
    source: "rules",
    details: {},
  };
};

module.exports = {
  analyzeURL,
  analyzeIP,
  analyzeHash,
  bulkScan,
  checkMLHealth,
  isMLAvailable: () => mlAvailable,
};
