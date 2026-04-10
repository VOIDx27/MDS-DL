// ============================================================
// Model Performance Page
// ============================================================

import { createLineChart, createBarChart, createRadarChart, createDoughnutChart } from '../components/charts.js';

export function renderModels(container) {
  container.innerHTML = `
    <!-- Model Cards -->
    <div class="grid grid-auto-fill mb-8" id="model-cards"></div>

    <!-- Performance Comparison -->
    <div class="grid grid-2 mb-6">
      <div class="card fade-in" style="padding:var(--space-5)">
        <h3 class="section-title mb-4" style="font-size:var(--font-size-base)">📊 Model Metrics Comparison</h3>
        <div style="height:340px">
          <canvas id="chart-radar-comparison"></canvas>
        </div>
      </div>
      <div class="card fade-in" style="padding:var(--space-5)">
        <h3 class="section-title mb-4" style="font-size:var(--font-size-base)">⏱ Latency Distribution (p95)</h3>
        <div style="height:340px">
          <canvas id="chart-latency"></canvas>
        </div>
      </div>
    </div>

    <!-- Drift Monitoring -->
    <div class="section-header">
      <h3 class="section-title">🌀 Drift Monitoring</h3>
      <span class="badge badge-cyan badge-dot">Auto-checked hourly</span>
    </div>
    <div class="grid grid-auto-fill mb-6" id="drift-cards"></div>

    <!-- Selected Model Detail -->
    <div id="model-detail"></div>
  `;

  loadModels();
}

async function loadModels() {
  try {
    const [modelsRes, driftRes] = await Promise.all([
      fetch('/api/v1/models'),
      fetch('/api/v1/models/drift')
    ]);
    const models = await modelsRes.json();
    const driftData = await driftRes.json();

    renderModelCards(models);
    renderDriftCards(driftData);
    renderComparison(models);

    // Auto-load first model detail
    if (models.length) loadModelDetail(models[0].id);
  } catch (err) {
    console.error('Load models error:', err);
  }
}

function renderModelCards(models) {
  const grid = document.getElementById('model-cards');
  if (!grid) return;

  const icons = { '1D CNN': '🔬', 'Transformer (BERT-style)': '🤖', 'GraphSAGE': '🕸️', 'EfficientNet-B3': '👁️', 'LightGBM + MLP': '🎯' };

  grid.innerHTML = models.map(m => `
    <div class="card" style="padding:var(--space-5);cursor:pointer" onclick="window._loadModelDetail && window._loadModelDetail('${m.id}')">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span style="font-size:1.5rem">${icons[m.architecture] || '🧠'}</span>
          <div>
            <h4 style="font-size:var(--font-size-sm);font-weight:700">${m.name}</h4>
            <span class="text-xs text-muted">${m.architecture}</span>
          </div>
        </div>
        <span class="badge badge-info badge-dot">${m.status}</span>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);margin:var(--space-3) 0">
        <div>
          <div class="text-xs text-muted">Accuracy</div>
          <div style="font-size:var(--font-size-lg);font-weight:800;color:var(--cyan)">${(m.accuracy * 100).toFixed(1)}%</div>
        </div>
        <div>
          <div class="text-xs text-muted">AUC-ROC</div>
          <div style="font-size:var(--font-size-lg);font-weight:800;color:var(--purple)">${m.auc.toFixed(3)}</div>
        </div>
        <div>
          <div class="text-xs text-muted">Precision</div>
          <div class="text-sm font-semibold">${(m.precision * 100).toFixed(1)}%</div>
        </div>
        <div>
          <div class="text-xs text-muted">Recall</div>
          <div class="text-sm font-semibold">${(m.recall * 100).toFixed(1)}%</div>
        </div>
      </div>

      <div style="border-top:1px solid var(--border-primary);padding-top:var(--space-3);margin-top:var(--space-2)">
        <div class="flex justify-between text-xs text-muted">
          <span>v${m.version}</span>
          <span>p95: ${m.latencyP95}ms</span>
        </div>
        <div class="flex justify-between text-xs text-muted mt-1">
          <span>${m.framework}</span>
          <span>${m.format}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function renderDriftCards(driftData) {
  const grid = document.getElementById('drift-cards');
  if (!grid) return;

  grid.innerHTML = driftData.map(d => {
    const hasDrift = d.dataDrift.detected || d.conceptDrift.detected;
    return `
      <div class="card-flat" style="padding:var(--space-4);border-left:3px solid ${hasDrift ? 'var(--high)' : 'var(--green)'}">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-semibold">${d.modelName}</span>
          <span class="badge ${hasDrift ? 'badge-high' : 'badge-info'} badge-dot">${hasDrift ? 'Drift Detected' : 'Stable'}</span>
        </div>
        <div class="flex gap-4 mt-3">
          <div>
            <div class="text-xs text-muted">Data Drift (PSI)</div>
            <div class="font-mono text-sm" style="color:${d.dataDrift.psi > d.dataDrift.threshold ? 'var(--critical)' : 'var(--green)'}">${d.dataDrift.psi.toFixed(4)}</div>
          </div>
          <div>
            <div class="text-xs text-muted">Concept Drift (ΔFPR)</div>
            <div class="font-mono text-sm" style="color:${Math.abs(d.conceptDrift.fprChange) > d.conceptDrift.threshold ? 'var(--critical)' : 'var(--green)'}">${d.conceptDrift.fprChange > 0 ? '+' : ''}${(d.conceptDrift.fprChange * 100).toFixed(2)}%</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderComparison(models) {
  // Radar chart
  createRadarChart('chart-radar-comparison',
    ['Accuracy', 'Precision', 'Recall', 'F1 Score', 'AUC-ROC'],
    models.map((m, i) => {
      const colors = ['#00f0ff', '#7c3aed', '#10b981', '#ff6b35', '#ff3b5c'];
      return {
        label: m.name.split(' ')[0],
        data: [m.accuracy, m.precision, m.recall, m.f1, m.auc],
        borderColor: colors[i],
        backgroundColor: colors[i] + '15',
        fill: true
      };
    })
  );

  // Latency chart
  createBarChart('chart-latency',
    models.map(m => m.name.split(' ')[0]),
    [
      {
        label: 'p50',
        data: models.map(m => m.latencyP50),
        backgroundColor: 'rgba(0, 240, 255, 0.5)',
        borderColor: '#00f0ff',
        borderWidth: 1
      },
      {
        label: 'p95',
        data: models.map(m => m.latencyP95),
        backgroundColor: 'rgba(124, 58, 237, 0.5)',
        borderColor: '#7c3aed',
        borderWidth: 1
      },
      {
        label: 'p99',
        data: models.map(m => m.latencyP99),
        backgroundColor: 'rgba(255, 59, 92, 0.5)',
        borderColor: '#ff3b5c',
        borderWidth: 1
      }
    ]
  );
}

async function loadModelDetail(modelId) {
  try {
    const res = await fetch(`/api/v1/models/${modelId}/metrics`);
    const data = await res.json();
    renderModelDetail(data);
  } catch (err) {
    console.error('Load model detail error:', err);
  }
}

// Make accessible globally
window._loadModelDetail = loadModelDetail;

function renderModelDetail(data) {
  const detail = document.getElementById('model-detail');
  if (!detail) return;

  detail.innerHTML = `
    <div class="divider"></div>
    <div class="section-header">
      <h3 class="section-title">📈 ${data.model.name} — Detailed Metrics</h3>
      <span class="tag">v${data.model.version}</span>
    </div>

    <div class="grid grid-2 mb-6">
      <!-- Confusion Matrix -->
      <div class="card fade-in" style="padding:var(--space-5)">
        <h4 class="text-sm font-semibold mb-4">Confusion Matrix</h4>
        <div style="display:grid;grid-template-columns:auto 1fr 1fr;grid-template-rows:auto 1fr 1fr;gap:2px;max-width:320px;margin:0 auto">
          <div></div>
          <div style="text-align:center;padding:var(--space-2);font-size:var(--font-size-xs);color:var(--text-muted)">Pred Malicious</div>
          <div style="text-align:center;padding:var(--space-2);font-size:var(--font-size-xs);color:var(--text-muted)">Pred Benign</div>
          <div style="padding:var(--space-2);font-size:var(--font-size-xs);color:var(--text-muted);writing-mode:vertical-lr;text-align:center;transform:rotate(180deg)">Actual Malicious</div>
          <div style="background:rgba(16,185,129,0.2);padding:var(--space-4);text-align:center;border-radius:var(--radius-sm)">
            <div style="font-size:var(--font-size-xl);font-weight:800;color:var(--green)">${data.confusionMatrix.tp.toLocaleString()}</div>
            <div class="text-xs text-muted mt-1">True Positive</div>
          </div>
          <div style="background:rgba(255,59,92,0.15);padding:var(--space-4);text-align:center;border-radius:var(--radius-sm)">
            <div style="font-size:var(--font-size-xl);font-weight:800;color:var(--critical)">${data.confusionMatrix.fn.toLocaleString()}</div>
            <div class="text-xs text-muted mt-1">False Negative</div>
          </div>
          <div style="padding:var(--space-2);font-size:var(--font-size-xs);color:var(--text-muted);writing-mode:vertical-lr;text-align:center;transform:rotate(180deg)">Actual Benign</div>
          <div style="background:rgba(255,107,53,0.15);padding:var(--space-4);text-align:center;border-radius:var(--radius-sm)">
            <div style="font-size:var(--font-size-xl);font-weight:800;color:var(--high)">${data.confusionMatrix.fp.toLocaleString()}</div>
            <div class="text-xs text-muted mt-1">False Positive</div>
          </div>
          <div style="background:rgba(0,240,255,0.1);padding:var(--space-4);text-align:center;border-radius:var(--radius-sm)">
            <div style="font-size:var(--font-size-xl);font-weight:800;color:var(--cyan)">${data.confusionMatrix.tn.toLocaleString()}</div>
            <div class="text-xs text-muted mt-1">True Negative</div>
          </div>
        </div>
      </div>

      <!-- Performance Over Time -->
      <div class="card fade-in" style="padding:var(--space-5)">
        <h4 class="text-sm font-semibold mb-4">Accuracy Over Time (30 days)</h4>
        <div style="height:280px">
          <canvas id="chart-perf-history"></canvas>
        </div>
      </div>
    </div>

    <!-- Training Info -->
    <div class="card fade-in" style="padding:var(--space-5)">
      <h4 class="text-sm font-semibold mb-4">Training & Deployment Info</h4>
      <div class="grid grid-4" style="gap:var(--space-4)">
        <div class="card-flat" style="padding:var(--space-4);text-align:center">
          <div class="text-xs text-muted mb-1">Last Trained</div>
          <div class="text-sm font-semibold">${new Date(data.training.lastTrained).toLocaleDateString()}</div>
        </div>
        <div class="card-flat" style="padding:var(--space-4);text-align:center">
          <div class="text-xs text-muted mb-1">Training Samples</div>
          <div class="text-sm font-semibold">${(data.training.trainingSamples / 1000000).toFixed(1)}M</div>
        </div>
        <div class="card-flat" style="padding:var(--space-4);text-align:center">
          <div class="text-xs text-muted mb-1">Framework</div>
          <div class="text-sm font-semibold">${data.training.framework}</div>
        </div>
        <div class="card-flat" style="padding:var(--space-4);text-align:center">
          <div class="text-xs text-muted mb-1">Serving</div>
          <div class="text-sm font-semibold">${data.training.servedBy} (${data.training.format})</div>
        </div>
      </div>
    </div>
  `;

  // Performance history chart
  createLineChart('chart-perf-history',
    data.performanceHistory.map(p => p.date.slice(5)),
    [
      {
        label: 'Accuracy',
        data: data.performanceHistory.map(p => (p.accuracy * 100).toFixed(1)),
        borderColor: '#00f0ff',
        backgroundColor: 'rgba(0, 240, 255, 0.05)',
      },
      {
        label: 'Recall',
        data: data.performanceHistory.map(p => (p.recall * 100).toFixed(1)),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
      }
    ]
  );
}
