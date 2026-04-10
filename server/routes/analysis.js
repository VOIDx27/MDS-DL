import { Router } from 'express';
import { simulateAnalysis } from '../mock/simulator.js';

const router = Router();
const analysisStore = new Map();

// POST /api/v1/analysis/analyze — Submit file for analysis
router.post('/analyze', (req, res) => {
  const { filename, fileSize } = req.body;
  if (!filename) {
    return res.status(400).json({ error: 'filename is required' });
  }
  const result = simulateAnalysis(filename, fileSize || 0);
  analysisStore.set(result.id, result);
  res.json(result);
});

// POST /api/v1/analysis/batch — Bulk file analysis
router.post('/batch', (req, res) => {
  const { files } = req.body;
  if (!files || !Array.isArray(files)) {
    return res.status(400).json({ error: 'files array is required' });
  }
  const results = files.slice(0, 100).map(f => {
    const result = simulateAnalysis(f.filename, f.fileSize);
    analysisStore.set(result.id, result);
    return result;
  });
  res.json({
    jobId: 'batch-' + Date.now(),
    total: results.length,
    malicious: results.filter(r => r.verdict === 'malicious').length,
    benign: results.filter(r => r.verdict === 'benign').length,
    results
  });
});

// GET /api/v1/analysis/:id — Get analysis result
router.get('/:id', (req, res) => {
  const result = analysisStore.get(req.params.id);
  if (!result) {
    return res.status(404).json({ error: 'Analysis not found' });
  }
  res.json(result);
});

// GET /api/v1/analysis/:id/explainability — Get SHAP/LIME explanations
router.get('/:id/explainability', (req, res) => {
  const result = analysisStore.get(req.params.id);
  if (!result) {
    return res.status(404).json({ error: 'Analysis not found' });
  }
  res.json({
    analysisId: result.id,
    method: 'SHAP',
    baseValue: 0.5,
    shapValues: result.shapValues,
    verdict: result.verdict,
    confidence: result.confidence
  });
});

export default router;
