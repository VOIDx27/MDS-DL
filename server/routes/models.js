import { Router } from 'express';
import { modelRegistry } from '../mock/data.js';

const router = Router();

// GET /api/v1/models — List deployed models
router.get('/', (req, res) => {
  res.json(modelRegistry);
});

// GET /api/v1/models/drift — Data/concept drift status
router.get('/drift', (req, res) => {
  const driftData = modelRegistry.map(m => ({
    modelId: m.id,
    modelName: m.name,
    dataDrift: {
      detected: Math.random() > 0.7,
      psi: parseFloat((Math.random() * 0.25).toFixed(4)),
      threshold: 0.2,
      features_affected: Math.floor(Math.random() * 5)
    },
    conceptDrift: {
      detected: Math.random() > 0.8,
      fprChange: parseFloat((Math.random() * 0.01 - 0.005).toFixed(4)),
      threshold: 0.005
    },
    lastChecked: new Date().toISOString()
  }));
  res.json(driftData);
});

// GET /api/v1/models/:id — Model detail
router.get('/:id', (req, res) => {
  const model = modelRegistry.find(m => m.id === req.params.id);
  if (!model) {
    return res.status(404).json({ error: 'Model not found' });
  }
  res.json(model);
});

// GET /api/v1/models/:id/metrics — Model performance metrics
router.get('/:id/metrics', (req, res) => {
  const model = modelRegistry.find(m => m.id === req.params.id);
  if (!model) {
    return res.status(404).json({ error: 'Model not found' });
  }

  // Generate ROC points
  const rocPoints = [];
  for (let i = 0; i <= 100; i++) {
    const fpr = i / 100;
    const tpr = Math.min(1, Math.pow(fpr, 0.05 + Math.random() * 0.1));
    rocPoints.push({ fpr, tpr });
  }

  // Generate confusion matrix
  const tp = Math.floor(model.recall * 10000);
  const fn = 10000 - tp;
  const fp = Math.floor((1 - model.precision) * tp);
  const tn = 10000 - fp;

  // Performance over time
  const performanceHistory = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000);
    performanceHistory.push({
      date: date.toISOString().split('T')[0],
      accuracy: model.accuracy + (Math.random() * 0.02 - 0.01),
      precision: model.precision + (Math.random() * 0.02 - 0.01),
      recall: model.recall + (Math.random() * 0.02 - 0.01),
      latencyP95: model.latencyP95 + Math.floor(Math.random() * 40 - 20)
    });
  }

  res.json({
    model: { id: model.id, name: model.name, version: model.version },
    metrics: {
      accuracy: model.accuracy,
      precision: model.precision,
      recall: model.recall,
      f1: model.f1,
      auc: model.auc
    },
    latency: {
      p50: model.latencyP50,
      p95: model.latencyP95,
      p99: model.latencyP99
    },
    rocCurve: rocPoints,
    confusionMatrix: { tp, tn, fp, fn },
    performanceHistory,
    training: {
      lastTrained: model.lastTrained,
      trainingSamples: model.trainingSamples,
      framework: model.framework,
      format: model.format,
      servedBy: model.servedBy
    }
  });
});

export default router;
