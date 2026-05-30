const datasetService = require("../services/datasetService");

const getIPs = (req, res) => {
  const { min_score, country, limit = 100, search } = req.query;
  const result = datasetService.queryIPs({
    minScore: parseInt(min_score) || 0,
    country,
    limit: parseInt(limit),
    search,
  });
  res.json({ ips: result, total: result.length, source: "dataset" });
};

const getPhishingURLs = (req, res) => {
  const { brand, category, min_risk = 0, limit = 100 } = req.query;
  const result = datasetService.queryPhishing({
    brand,
    category,
    minRisk: parseInt(min_risk),
    limit: parseInt(limit),
  });
  res.json({ urls: result, total: result.length, source: "dataset" });
};

const getMalwareSamples = (req, res) => {
  const { type, family, severity, limit = 100 } = req.query;
  const result = datasetService.queryMalware({
    type,
    family,
    severity,
    limit: parseInt(limit),
  });
  res.json({ samples: result, total: result.length, source: "dataset" });
};

const getGeoData = (req, res) => {
  const geo = datasetService.datasets.geo;
  res.json(geo || { countries: [] });
};

const getStats = (req, res) => {
  res.json({ ...datasetService.getStats(), source: "dataset" });
};

module.exports = {
  getIPs,
  getPhishingURLs,
  getMalwareSamples,
  getGeoData,
  getStats,
};
