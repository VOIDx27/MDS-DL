// ============================================================
// File Analysis Page — Upload & Scan with Deep Learning
// ============================================================

import { createBarChart } from '../components/charts.js';

let currentResult = null;

export function renderAnalyze(container) {
  container.innerHTML = `
    <div class="grid grid-2" style="grid-template-columns: 1fr 1.5fr;">
      <!-- Upload Panel -->
      <div>
        <div class="card fade-in" style="padding:var(--space-6)">
          <h3 class="section-title mb-6" style="font-size:var(--font-size-base)">📁 Submit Sample</h3>
          <div class="upload-zone" id="upload-zone">
            <div class="upload-zone-icon">⬆️</div>
            <h4 style="margin-bottom:var(--space-2)">Drop your file here</h4>
            <p class="text-sm text-muted">or click to browse — PE, ELF, APK, Office, Scripts supported</p>
            <p class="text-xs text-muted mt-4">Max file size: 100MB • Encrypted at rest (AES-256)</p>
            <input type="file" id="file-input" style="display:none" />
          </div>

          <div class="divider"></div>

          <h4 style="font-size:var(--font-size-sm);margin-bottom:var(--space-3)">Or enter a filename to simulate:</h4>
          <div class="flex gap-3">
            <input type="text" class="input" id="filename-input" placeholder="e.g. suspicious_update.exe" style="flex:1" />
            <button class="btn btn-primary" id="analyze-btn">Analyze</button>
          </div>

          <div class="divider"></div>

          <h4 style="font-size:var(--font-size-sm);margin-bottom:var(--space-3)">Quick Test Samples</h4>
          <div class="flex flex-wrap gap-2">
            <button class="btn btn-secondary btn-sm sample-btn" data-file="emotet_dropper.exe">emotet_dropper.exe</button>
            <button class="btn btn-secondary btn-sm sample-btn" data-file="invoice_q1.docm">invoice_q1.docm</button>
            <button class="btn btn-secondary btn-sm sample-btn" data-file="clean_setup.msi">clean_setup.msi</button>
            <button class="btn btn-secondary btn-sm sample-btn" data-file="ransomware_payload.ps1">ransomware_payload.ps1</button>
            <button class="btn btn-secondary btn-sm sample-btn" data-file="benign_readme.pdf">benign_readme.pdf</button>
            <button class="btn btn-secondary btn-sm sample-btn" data-file="cobalt_beacon.dll">cobalt_beacon.dll</button>
          </div>
        </div>

        <!-- Analysis Progress -->
        <div class="card fade-in mt-6" id="progress-card" style="display:none;padding:var(--space-5)">
          <div class="flex items-center gap-3 mb-4">
            <div class="spinner"></div>
            <div>
              <div style="font-weight:600;color:var(--text-primary)" id="progress-filename">Analyzing...</div>
              <div class="text-xs text-muted" id="progress-stage">Initializing models</div>
            </div>
          </div>
          <div class="progress-bar mb-3">
            <div class="progress-bar-fill" id="progress-fill" style="width:0%"></div>
          </div>
          <div id="progress-steps" style="font-size:var(--font-size-xs)"></div>
        </div>
      </div>

      <!-- Results Panel -->
      <div id="results-panel">
        <div class="card fade-in" style="padding:var(--space-8);text-align:center;" id="empty-results">
          <div style="font-size:3rem;margin-bottom:var(--space-4);opacity:0.4">🔬</div>
          <h3 style="color:var(--text-secondary);margin-bottom:var(--space-2)">No Analysis Results</h3>
          <p class="text-sm text-muted">Upload a file or click a test sample to begin analysis</p>
        </div>
      </div>
    </div>
  `;

  // Event Listeners
  const uploadZone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');
  const analyzeBtn = document.getElementById('analyze-btn');
  const filenameInput = document.getElementById('filename-input');

  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      runAnalysis(e.dataTransfer.files[0].name, e.dataTransfer.files[0].size);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      runAnalysis(e.target.files[0].name, e.target.files[0].size);
    }
  });

  analyzeBtn.addEventListener('click', () => {
    const fn = filenameInput.value.trim();
    if (fn) runAnalysis(fn);
  });

  filenameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') analyzeBtn.click();
  });

  document.querySelectorAll('.sample-btn').forEach(btn => {
    btn.addEventListener('click', () => runAnalysis(btn.dataset.file));
  });
}

async function runAnalysis(filename, fileSize = 0) {
  const progressCard = document.getElementById('progress-card');
  const progressFill = document.getElementById('progress-fill');
  const progressFilename = document.getElementById('progress-filename');
  const progressStage = document.getElementById('progress-stage');
  const progressSteps = document.getElementById('progress-steps');

  progressCard.style.display = 'block';
  progressFilename.textContent = filename;

  const stages = [
    { label: 'Extracting features (PE headers, entropy, strings)...', pct: 15 },
    { label: 'Running MalConv static analyzer...', pct: 30 },
    { label: 'Executing behavioral analysis (Transformer)...', pct: 50 },
    { label: 'Analyzing control flow graph (GNN)...', pct: 70 },
    { label: 'Processing binary visualization (EfficientNet)...', pct: 85 },
    { label: 'Computing ensemble verdict...', pct: 95 },
    { label: 'Generating explainability report...', pct: 100 }
  ];

  let stepHtml = '';
  for (let i = 0; i < stages.length; i++) {
    await new Promise(r => setTimeout(r, 300 + Math.random() * 400));
    progressFill.style.width = stages[i].pct + '%';
    progressStage.textContent = stages[i].label;
    stepHtml += `<div class="flex items-center gap-2 mt-1" style="color:var(--green)">
      <span>✓</span><span>${stages[i].label}</span>
    </div>`;
    progressSteps.innerHTML = stepHtml;
  }

  // Fetch result
  try {
    const res = await fetch('/api/v1/analysis/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, fileSize })
    });
    currentResult = await res.json();
    renderResults(currentResult);
  } catch (err) {
    console.error('Analysis error:', err);
  }

  progressCard.style.display = 'none';
}

function renderResults(result) {
  const panel = document.getElementById('results-panel');
  const isMalicious = result.verdict === 'malicious';
  const severityColor = isMalicious ? `var(--${result.severity})` : 'var(--green)';
  const confidencePct = (result.confidence * 100).toFixed(1);

  panel.innerHTML = `
    <!-- Verdict Card -->
    <div class="card fade-in mb-6" style="border-left:4px solid ${severityColor};padding:var(--space-6)">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-4">
          <div style="width:56px;height:56px;border-radius:var(--radius-lg);display:flex;align-items:center;justify-content:center;font-size:1.8rem;background:${isMalicious ? 'var(--malicious-bg)' : 'var(--benign-bg)'}">
            ${isMalicious ? '🚨' : '✅'}
          </div>
          <div>
            <h2 style="font-size:var(--font-size-2xl);color:${severityColor};text-transform:uppercase;letter-spacing:0.05em">${result.verdict}</h2>
            <p class="text-sm text-muted">${result.filename} • ${formatBytes(result.fileSize)} • ${result.fileType}</p>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:var(--font-size-3xl);font-weight:900;color:${severityColor}">${confidencePct}%</div>
          <div class="text-xs text-muted">Confidence Score</div>
        </div>
      </div>
      ${isMalicious && result.family ? `
        <div class="flex items-center gap-3 mt-4">
          <span class="badge badge-${result.severity}">${result.severity}</span>
          <span class="tag">🦠 ${result.family.name}</span>
          <span class="tag">${result.family.category}</span>
        </div>
      ` : ''}
    </div>

    <!-- Model Scores -->
    <div class="card fade-in fade-in-delay-1 mb-6" style="padding:var(--space-5)">
      <h3 class="section-title mb-4" style="font-size:var(--font-size-base)">🧠 Model Ensemble Scores</h3>
      <div class="grid grid-5" style="gap:var(--space-3)">
        ${renderModelScore('MalConv', result.modelScores.malconv, 'Static byte analysis')}
        ${renderModelScore('BehaviorBERT', result.modelScores.behaviorBert, 'API call analysis')}
        ${renderModelScore('GNN-SAGE', result.modelScores.gnnSage, 'Control flow graph')}
        ${renderModelScore('EfficientNet', result.modelScores.visionResnet, 'Binary visualization')}
        ${renderModelScore('Ensemble', result.modelScores.ensembleMeta, 'Final verdict', true)}
      </div>
      <div class="flex items-center justify-between mt-4" style="padding-top:var(--space-3);border-top:1px solid var(--border-primary)">
        <span class="text-sm text-muted">Total inference latency</span>
        <span class="font-mono text-sm" style="color:var(--cyan)">${result.totalLatency}ms</span>
      </div>
    </div>

    <!-- SHAP Explainability -->
    <div class="card fade-in fade-in-delay-2 mb-6" style="padding:var(--space-5)">
      <h3 class="section-title mb-4" style="font-size:var(--font-size-base)">📊 Feature Importance (SHAP Values)</h3>
      <div style="height:300px">
        <canvas id="chart-shap"></canvas>
      </div>
    </div>

    ${isMalicious ? `
    <!-- ATT&CK Techniques -->
    <div class="card fade-in fade-in-delay-3 mb-6" style="padding:var(--space-5)">
      <h3 class="section-title mb-4" style="font-size:var(--font-size-base)">🎯 MITRE ATT&CK Mapping</h3>
      <div class="grid grid-3" style="gap:var(--space-3)">
        ${result.techniques.map(t => `
          <div class="card-flat" style="padding:var(--space-4);border-left:3px solid var(--purple)">
            <div class="flex items-center gap-2 mb-2">
              <span class="badge badge-purple">${t.id}</span>
              <span class="text-xs text-muted">${t.tactic}</span>
            </div>
            <div style="font-weight:600;font-size:var(--font-size-sm);color:var(--text-primary)">${t.name}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Behavioral Analysis -->
    ${result.behavioralAnalysis ? `
    <div class="card fade-in fade-in-delay-4 mb-6" style="padding:var(--space-5)">
      <h3 class="section-title mb-4" style="font-size:var(--font-size-base)">⚡ Behavioral Analysis</h3>
      <div class="grid grid-2" style="gap:var(--space-4)">
        <div>
          <h4 class="text-sm font-semibold mb-3" style="color:var(--text-muted)">API Call Sequence</h4>
          <div class="flex flex-col gap-1">
            ${result.behavioralAnalysis.apiCallSequence.map((api, i) => `
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono text-muted" style="width:20px">${i + 1}.</span>
                <code style="font-size:var(--font-size-xs)">${api}</code>
              </div>
            `).join('')}
          </div>
        </div>
        <div>
          <h4 class="text-sm font-semibold mb-3" style="color:var(--text-muted)">Network Activity</h4>
          ${result.behavioralAnalysis.networkActivity.map(n => `
            <div class="card-flat mb-2" style="padding:var(--space-3)">
              <div class="flex items-center justify-between">
                <span class="badge badge-${n.type === 'DNS' ? 'info' : 'high'}" style="font-size:9px">${n.type}</span>
                <span class="font-mono text-xs">${n.destination}</span>
              </div>
              <div class="text-xs text-muted mt-1">Port ${n.port} / ${n.protocol}</div>
            </div>
          `).join('')}
          <h4 class="text-sm font-semibold mb-3 mt-4" style="color:var(--text-muted)">Indicators</h4>
          <div class="flex flex-wrap gap-2">
            ${result.behavioralAnalysis.processInjection ? '<span class="badge badge-critical badge-dot">Process Injection</span>' : ''}
            ${result.behavioralAnalysis.memoryInjection ? '<span class="badge badge-high badge-dot">Memory Injection</span>' : ''}
            ${result.behavioralAnalysis.antiAnalysis ? '<span class="badge badge-medium badge-dot">Anti-Analysis</span>' : ''}
          </div>
        </div>
      </div>
    </div>` : ''}
    ` : ''}

    <!-- PE Headers -->
    <div class="card fade-in fade-in-delay-5 mb-6" style="padding:var(--space-5)">
      <h3 class="section-title mb-4" style="font-size:var(--font-size-base)">📋 PE Header Metadata</h3>
      <div class="grid grid-2" style="gap:var(--space-4)">
        <div>
          <table>
            <tbody>
              <tr><td class="text-muted text-sm" style="width:140px">Machine</td><td class="font-mono text-sm">${result.peHeaders.machine}</td></tr>
              <tr><td class="text-muted text-sm">Sections</td><td class="font-mono text-sm">${result.peHeaders.numberOfSections}</td></tr>
              <tr><td class="text-muted text-sm">Entry Point</td><td class="font-mono text-sm">${result.peHeaders.entryPoint}</td></tr>
              <tr><td class="text-muted text-sm">Image Base</td><td class="font-mono text-sm">${result.peHeaders.imageBase}</td></tr>
              <tr><td class="text-muted text-sm">Timestamp</td><td class="font-mono text-sm">${result.peHeaders.timeDateStamp}</td></tr>
            </tbody>
          </table>
        </div>
        <div>
          <h4 class="text-sm font-semibold mb-2" style="color:var(--text-muted)">Sections</h4>
          <table>
            <thead><tr><th>Name</th><th>Virtual Size</th><th>Entropy</th></tr></thead>
            <tbody>
              ${result.peHeaders.sections.map(s => `
                <tr>
                  <td class="font-mono">${s.name}</td>
                  <td class="font-mono">${formatBytes(s.virtualSize)}</td>
                  <td><span class="font-mono" style="color:${parseFloat(s.entropy) > 7 ? 'var(--critical)' : parseFloat(s.entropy) > 6 ? 'var(--medium)' : 'var(--green)'}">${s.entropy}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${result.peHeaders.suspiciousImports.length > 0 ? `
            <h4 class="text-sm font-semibold mb-2 mt-4" style="color:var(--critical)">⚠️ Suspicious Imports</h4>
            <div class="flex flex-wrap gap-2">
              ${result.peHeaders.suspiciousImports.map(i => `<span class="tag" style="border-color:var(--critical);color:var(--critical)">${i}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    </div>

    <!-- Hashes -->
    <div class="card fade-in fade-in-delay-5" style="padding:var(--space-5)">
      <h3 class="section-title mb-4" style="font-size:var(--font-size-base)">#️⃣ File Hashes</h3>
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-3"><span class="badge badge-cyan" style="width:50px;justify-content:center">MD5</span><code class="font-mono text-sm" style="background:var(--bg-secondary);padding:var(--space-2) var(--space-3);border-radius:var(--radius-sm);flex:1">${result.hash.md5}</code></div>
        <div class="flex items-center gap-3"><span class="badge badge-cyan" style="width:50px;justify-content:center">SHA1</span><code class="font-mono text-sm" style="background:var(--bg-secondary);padding:var(--space-2) var(--space-3);border-radius:var(--radius-sm);flex:1">${result.hash.sha1}</code></div>
        <div class="flex items-center gap-3"><span class="badge badge-cyan" style="width:50px;justify-content:center">SHA256</span><code class="font-mono text-sm" style="background:var(--bg-secondary);padding:var(--space-2) var(--space-3);border-radius:var(--radius-sm);flex:1">${result.hash.sha256}</code></div>
      </div>
    </div>
  `;

  // Render SHAP chart
  const topShap = result.shapValues.slice(0, 10);
  createBarChart('chart-shap',
    topShap.map(s => s.feature.replace(/_/g, ' ')),
    [{
      label: 'SHAP Value',
      data: topShap.map(s => s.value),
      backgroundColor: topShap.map(s => s.value > 0 ? 'rgba(255, 59, 92, 0.7)' : 'rgba(16, 185, 129, 0.7)'),
      borderColor: topShap.map(s => s.value > 0 ? '#ff3b5c' : '#10b981'),
      borderWidth: 1
    }],
    { horizontal: true, plugins: { legend: { display: false } } }
  );
}

function renderModelScore(name, score, description, isEnsemble = false) {
  const pct = (score.score * 100).toFixed(1);
  const color = score.score > 0.7 ? 'var(--critical)' : score.score > 0.3 ? 'var(--medium)' : 'var(--green)';
  return `
    <div class="card-flat" style="padding:var(--space-4);${isEnsemble ? 'border:1px solid var(--cyan);background:var(--cyan-dim)' : ''}">
      <div class="text-xs text-muted mb-1">${name}</div>
      <div style="font-size:var(--font-size-xl);font-weight:800;color:${color}">${pct}%</div>
      <div class="confidence-bar mt-2">
        <div class="confidence-fill ${score.score > 0.7 ? 'critical' : score.score > 0.3 ? 'medium' : 'benign'}" style="width:${pct}%"></div>
      </div>
      <div class="text-xs text-muted mt-2">${score.latency}ms • ${description}</div>
    </div>
  `;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
