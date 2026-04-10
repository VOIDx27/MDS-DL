// ============================================================
// Threat Intelligence Page
// ============================================================

import { showModal } from '../components/modal.js';

export function renderThreats(container) {
  container.innerHTML = `
    <!-- Filters -->
    <div class="card-flat mb-6 flex items-center gap-4 flex-wrap" style="padding:var(--space-4)">
      <input type="text" class="input search-input" id="threat-search" placeholder="Search by filename, hash, or family..." style="max-width:360px" />
      <select class="select" id="filter-severity">
        <option value="">All Severities</option>
        <option value="critical">🔴 Critical</option>
        <option value="high">🟠 High</option>
        <option value="medium">🟡 Medium</option>
        <option value="none">🟢 Benign</option>
      </select>
      <select class="select" id="filter-verdict">
        <option value="">All Verdicts</option>
        <option value="malicious">Malicious</option>
        <option value="benign">Benign</option>
      </select>
      <div style="margin-left:auto" class="flex gap-2">
        <button class="btn btn-secondary btn-sm" id="refresh-threats">🔄 Refresh</button>
        <button class="btn btn-primary btn-sm" id="export-threats">📥 Export CSV</button>
      </div>
    </div>

    <!-- Threats Table -->
    <div class="card fade-in" style="padding:0;overflow:hidden">
      <div class="table-container" style="border:none">
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Filename</th>
              <th>Hash (SHA256)</th>
              <th>Verdict</th>
              <th>Confidence</th>
              <th>Family</th>
              <th>Severity</th>
              <th>Source</th>
              <th>Techniques</th>
              <th>Detected</th>
            </tr>
          </thead>
          <tbody id="threats-tbody"></tbody>
        </table>
      </div>
    </div>

    <!-- Malware Families Section -->
    <h3 class="section-title mt-8 mb-4" style="font-size:var(--font-size-lg)">🦠 Malware Family Database</h3>
    <div class="grid grid-auto-fill" id="families-grid"></div>
  `;

  loadThreats();
  loadFamilies();

  document.getElementById('refresh-threats').addEventListener('click', loadThreats);
  document.getElementById('threat-search').addEventListener('input', filterThreats);
  document.getElementById('filter-severity').addEventListener('change', filterThreats);
  document.getElementById('filter-verdict').addEventListener('change', filterThreats);
}

let allThreats = [];

async function loadThreats() {
  try {
    const res = await fetch('/api/v1/threats?limit=50');
    const data = await res.json();
    allThreats = data.results;
    renderThreatsTable(allThreats);
  } catch (err) {
    console.error('Load threats error:', err);
  }
}

function filterThreats() {
  const search = document.getElementById('threat-search').value.toLowerCase();
  const severity = document.getElementById('filter-severity').value;
  const verdict = document.getElementById('filter-verdict').value;

  let filtered = allThreats;
  if (search) {
    filtered = filtered.filter(t =>
      t.filename.toLowerCase().includes(search) ||
      t.hash.toLowerCase().includes(search) ||
      (t.family && t.family.toLowerCase().includes(search))
    );
  }
  if (severity) filtered = filtered.filter(t => t.severity === severity);
  if (verdict) filtered = filtered.filter(t => t.verdict === verdict);

  renderThreatsTable(filtered);
}

function renderThreatsTable(threats) {
  const tbody = document.getElementById('threats-tbody');
  if (!tbody) return;

  tbody.innerHTML = threats.map(t => `
    <tr style="cursor:pointer" onclick='showThreatDetail(${JSON.stringify(t).replace(/'/g, "&#39;")})'>
      <td><div class="threat-indicator ${t.severity}"></div></td>
      <td>
        <div style="font-weight:500;color:var(--text-primary);font-size:var(--font-size-sm)">${t.filename}</div>
        <div class="text-xs text-muted">${t.fileType} • ${formatBytes(t.fileSize)}</div>
      </td>
      <td><span class="font-mono text-xs">${t.hash.substring(0, 20)}…</span></td>
      <td><span class="badge badge-${t.verdict}">${t.verdict}</span></td>
      <td>
        <div class="confidence-meter">
          <div class="confidence-bar" style="width:60px">
            <div class="confidence-fill ${t.severity || 'benign'}" style="width:${(t.confidence * 100).toFixed(0)}%"></div>
          </div>
          <span class="font-mono text-xs">${(t.confidence * 100).toFixed(1)}%</span>
        </div>
      </td>
      <td>${t.family ? `<span class="tag">${t.family}</span>` : '—'}</td>
      <td><span class="badge badge-${t.severity || 'info'}">${t.severity || 'none'}</span></td>
      <td class="text-sm">${t.source}</td>
      <td>
        <div class="flex gap-1 flex-wrap">
          ${(t.techniques || []).slice(0, 2).map(tech => `<span class="tag" style="font-size:9px">${tech}</span>`).join('')}
          ${(t.techniques || []).length > 2 ? `<span class="text-xs text-muted">+${t.techniques.length - 2}</span>` : ''}
        </div>
      </td>
      <td class="text-xs text-muted">${new Date(t.timestamp).toLocaleString()}</td>
    </tr>
  `).join('');
}

// Global function for onclick
window.showThreatDetail = function(threat) {
  const content = `
    <div class="flex items-center gap-3 mb-6">
      <div class="threat-indicator ${threat.severity}" style="width:14px;height:14px"></div>
      <div>
        <div style="font-weight:700;font-size:var(--font-size-lg);color:var(--text-primary)">${threat.filename}</div>
        <div class="text-sm text-muted">${threat.fileType} • ${formatBytes(threat.fileSize)}</div>
      </div>
      <span class="badge badge-${threat.verdict}" style="margin-left:auto">${threat.verdict}</span>
    </div>

    <div class="divider"></div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);margin-bottom:var(--space-4)">
      <div>
        <div class="text-xs text-muted mb-1">Confidence</div>
        <div style="font-size:var(--font-size-2xl);font-weight:800;color:var(--${threat.verdict === 'malicious' ? 'critical' : 'green'})">${(threat.confidence * 100).toFixed(1)}%</div>
      </div>
      <div>
        <div class="text-xs text-muted mb-1">Family</div>
        <div style="font-size:var(--font-size-lg);font-weight:600;color:var(--text-primary)">${threat.family || 'N/A'}</div>
      </div>
      <div>
        <div class="text-xs text-muted mb-1">Source</div>
        <div class="text-sm">${threat.source}</div>
      </div>
      <div>
        <div class="text-xs text-muted mb-1">Detected</div>
        <div class="text-sm">${new Date(threat.timestamp).toLocaleString()}</div>
      </div>
    </div>

    <div class="text-xs text-muted mb-1">SHA256 Hash</div>
    <code style="display:block;padding:var(--space-3);background:var(--bg-secondary);border-radius:var(--radius-sm);font-size:var(--font-size-xs);word-break:break-all;margin-bottom:var(--space-4)">${threat.hash}</code>

    ${(threat.techniques || []).length > 0 ? `
      <div class="text-xs text-muted mb-2">MITRE ATT&CK Techniques</div>
      <div class="flex flex-wrap gap-2">
        ${threat.techniques.map(t => `<span class="badge badge-purple">${t}</span>`).join('')}
      </div>
    ` : ''}
  `;

  showModal('Threat Detail', content, { maxWidth: '560px' });
};

async function loadFamilies() {
  try {
    const res = await fetch('/api/v1/threats/families');
    const families = await res.json();
    const grid = document.getElementById('families-grid');
    if (!grid) return;

    grid.innerHTML = families.map(f => `
      <div class="card" style="padding:var(--space-5);border-left:3px solid ${f.color}">
        <div class="flex items-center justify-between mb-3">
          <h4 style="font-size:var(--font-size-base);font-weight:700">${f.name}</h4>
          <span class="badge badge-${f.severity}">${f.severity}</span>
        </div>
        <span class="tag mb-3">${f.category}</span>
        <p class="text-xs text-muted mt-3" style="line-height:1.5">${f.description}</p>
        <div class="divider" style="margin:var(--space-3) 0"></div>
        <div class="flex justify-between text-xs">
          <span class="text-muted">Samples: <strong style="color:var(--text-primary)">${f.samples.toLocaleString()}</strong></span>
          <span class="text-muted">Last seen: <strong style="color:var(--text-primary)">${new Date(f.lastSeen).toLocaleDateString()}</strong></span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Load families error:', err);
  }
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
