// ============================================================
// MDS-DL Express Backend — REST API Server
// ============================================================

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';

import analysisRouter from './routes/analysis.js';
import threatsRouter from './routes/threats.js';
import modelsRouter from './routes/models.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'dist')));
}

// API Routes
app.use('/api/v1/analysis', analysisRouter);
app.use('/api/v1/threats', threatsRouter);
app.use('/api/v1/models', modelsRouter);

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    models: {
      malconv: 'online',
      behaviorBert: 'online',
      gnnSage: 'online',
      visionResnet: 'online',
      ensembleMeta: 'online'
    }
  });
});

// API info
app.get('/api/v1', (req, res) => {
  res.json({
    name: 'MDS-DL API',
    version: '1.0.0',
    description: 'Malware Detection System powered by Deep Learning',
    endpoints: {
      health: 'GET /api/v1/health',
      analyze: 'POST /api/v1/analysis/analyze',
      analysisResult: 'GET /api/v1/analysis/:id',
      threats: 'GET /api/v1/threats',
      threatDetail: 'GET /api/v1/threats/:id',
      families: 'GET /api/v1/threats/families',
      stats: 'GET /api/v1/threats/stats',
      models: 'GET /api/v1/models',
      modelMetrics: 'GET /api/v1/models/:id/metrics'
    }
  });
});

// SPA fallback for production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`\n  ╔══════════════════════════════════════════╗`);
  console.log(`  ║   MDS-DL API Server                      ║`);
  console.log(`  ║   Malware Detection System v1.0.0         ║`);
  console.log(`  ╠══════════════════════════════════════════╣`);
  console.log(`  ║   Status:  ONLINE                        ║`);
  console.log(`  ║   Port:    ${PORT}                           ║`);
  console.log(`  ║   Models:  5 active                      ║`);
  console.log(`  ╚══════════════════════════════════════════╝\n`);
});
