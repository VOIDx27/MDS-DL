import { Router } from 'express';
import { recentDetections, malwareFamilies, attackTechniques, dashboardStats, timeSeriesData, severityDistribution, familyDistribution, geoDistribution } from '../mock/data.js';
import { generateLiveDetection } from '../mock/simulator.js';

const router = Router();

// GET /api/v1/threats — List recent threat detections
router.get('/', (req, res) => {
  const { severity, family, limit = 50, offset = 0 } = req.query;
  let results = [...recentDetections];

  if (severity) results = results.filter(r => r.severity === severity);
  if (family) results = results.filter(r => r.family === family);

  res.json({
    total: results.length,
    offset: parseInt(offset),
    limit: parseInt(limit),
    results: results.slice(parseInt(offset), parseInt(offset) + parseInt(limit))
  });
});

// GET /api/v1/threats/live — Generate a live detection
router.get('/live', (req, res) => {
  res.json(generateLiveDetection());
});

// GET /api/v1/threats/stats — Threat statistics
router.get('/stats', (req, res) => {
  res.json({
    overview: dashboardStats,
    timeSeries: timeSeriesData,
    severityDistribution,
    familyDistribution,
    geoDistribution
  });
});

// GET /api/v1/threats/families — Malware family taxonomy
router.get('/families', (req, res) => {
  res.json(malwareFamilies);
});

// GET /api/v1/threats/techniques — ATT&CK techniques
router.get('/techniques', (req, res) => {
  res.json(attackTechniques);
});

// GET /api/v1/threats/:id — Threat detail with ATT&CK mapping
router.get('/:id', (req, res) => {
  const detection = recentDetections.find(d => d.id === req.params.id);
  if (!detection) {
    return res.status(404).json({ error: 'Detection not found' });
  }
  const techniques = attackTechniques.filter(t =>
    detection.techniques.includes(t.id)
  );
  const family = detection.family
    ? malwareFamilies.find(f => f.id === detection.family)
    : null;

  res.json({ ...detection, techniqueDetails: techniques, familyDetails: family });
});

export default router;
