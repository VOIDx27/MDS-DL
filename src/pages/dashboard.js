// ============================================================
// Dashboard Page — SOC Real-time Monitoring
// ============================================================

import { createLineChart, createDoughnutChart, createBarChart, animateCounter } from '../components/charts.js';
import { showModal } from '../components/modal.js';

export function renderDashboard(container) {
  container.innerHTML = `
    <!-- KPI Cards -->
    <div class="grid grid-4 mb-6">
      <div class="kpi-card fade-in fade-in-delay-1" id="kpi-detection-rate">
        <div class="kpi-icon" style="background:var(--cyan-dim);color:var(--cyan)">🎯</div>
        <div class="kpi-value text-cyan" id="kpi-val-detection">0</div>
        <div class="kpi-label">Detection Rate</div>
        <div class="kpi-change positive">↑ 2.3% vs last week</div>
      </div>
      <div class="kpi-card fade-in fade-in-delay-2" id="kpi-fpr">
        <div class="kpi-icon" style="background:var(--green-dim);color:var(--green)">✅</div>
        <div class="kpi-value" style="color:var(--green)" id="kpi-val-fpr">0</div>
        <div class="kpi-label">False Positive Rate</div>
        <div class="kpi-change positive">↓ 0.5% vs last week</div>
      </div>
      <div class="kpi-card fade-in fade-in-delay-3" id="kpi-latency">
        <div class="kpi-icon" style="background:var(--purple-dim);color:var(--purple)">⚡</div>
        <div class="kpi-value" style="color:var(--purple)" id="kpi-val-latency">0</div>
        <div class="kpi-label">Avg Detection Latency</div>
        <div class="kpi-change positive">↓ 45ms vs last week</div>
      </div>
      <div class="kpi-card fade-in fade-in-delay-4" id="kpi-active">
        <div class="kpi-icon" style="background:var(--critical-dim);color:var(--critical)">🚨</div>
        <div class="kpi-value" style="color:var(--critical)" id="kpi-val-active">0</div>
        <div class="kpi-label">Active Threats</div>
        <div class="kpi-change negative">↑ 8 new today</div>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-5 mb-6">
      <div class="card-flat" style="padding:var(--space-4);text-align:center">
        <div style="font-size:var(--font-size-2xl);font-weight:800;color:var(--text-primary)" id="stat-total">0</div>
        <div style="font-size:var(--font-size-xs);color:var(--text-muted);margin-top:2px">Total Scanned (All Time)</div>
      </div>
      <div class="card-flat" style="padding:var(--space-4);text-align:center">
        <div style="font-size:var(--font-size-2xl);font-weight:800;color:var(--critical)" id="stat-malware">0</div>
        <div style="font-size:var(--font-size-xs);color:var(--text-muted);margin-top:2px">Malware Detected</div>
      </div>
      <div class="card-flat" style="padding:var(--space-4);text-align:center">
        <div style="font-size:var(--font-size-2xl);font-weight:800;color:var(--cyan)" id="stat-24h">0</div>
        <div style="font-size:var(--font-size-xs);color:var(--text-muted);margin-top:2px">Samples (24h)</div>
      </div>
      <div class="card-flat" style="padding:var(--space-4);text-align:center">
        <div style="font-size:var(--font-size-2xl);font-weight:800;color:var(--high)" id="stat-zeroday">0</div>
        <div style="font-size:var(--font-size-xs);color:var(--text-muted);margin-top:2px">Zero-Day Detections</div>
      </div>
      <div class="card-flat" style="padding:var(--space-4);text-align:center">
        <div style="font-size:var(--font-size-2xl);font-weight:800;color:var(--green)" id="stat-models">5</div>
        <div style="font-size:var(--font-size-xs);color:var(--text-muted);margin-top:2px">Models Active</div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-3 mb-6">
      <div class="card col-span-2 fade-in fade-in-delay-2" style="padding:var(--space-5)">
        <div class="section-header" style="margin-bottom:var(--space-4)">
          <h3 class="section-title" style="font-size:var(--font-size-base)">📈 Detection Timeline (24h)</h3>
          <span class="badge badge-cyan badge-dot">Live</span>
        </div>
        <div style="height:280px">
          <canvas id="chart-timeline"></canvas>
        </div>
      </div>
      <div class="card fade-in fade-in-delay-3" style="padding:var(--space-5)">
        <h3 class="section-title mb-4" style="font-size:var(--font-size-base)">⚡ Severity Distribution</h3>
        <div style="height:280px">
          <canvas id="chart-severity"></canvas>
        </div>
      </div>
    </div>

    <!-- Threats Table & Family Chart -->
    <div class="grid grid-3 mb-6">
      <div class="card col-span-2 fade-in fade-in-delay-3" style="padding:0;overflow:hidden">
        <div style="padding:var(--space-5) var(--space-5) 0">
          <div class="section-header" style="margin-bottom:var(--space-4)">
            <h3 class="section-title" style="font-size:var(--font-size-base)">🔍 Recent Detections</h3>
            <button class="btn btn-ghost btn-sm" onclick="window.MDS.currentPage !== 'threats' && document.querySelector('[data-page=threats]')?.click()">View All →</button>
          </div>
        </div>
        <div class="table-container" style="border:none;border-radius:0">
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Verdict</th>
                <th>Confidence</th>
                <th>Family</th>
                <th>Source</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody id="detections-table"></tbody>
          </table>
        </div>
      </div>
      <div class="card fade-in fade-in-delay-4" style="padding:var(--space-5)">
        <h3 class="section-title mb-4" style="font-size:var(--font-size-base)">🦠 Top Malware Families</h3>
        <div style="height:320px">
          <canvas id="chart-families"></canvas>
        </div>
      </div>
    </div>

    <!-- Alert Summary -->
    <div class="grid grid-4 mb-6">
      <div class="card-flat flex items-center gap-3" style="padding:var(--space-4);border-left:3px solid var(--critical)">
        <div class="threat-indicator critical"></div>
        <div>
          <div style="font-size:var(--font-size-2xl);font-weight:800;color:var(--critical)">12</div>
          <div style="font-size:var(--font-size-xs);color:var(--text-muted)">Critical Alerts</div>
        </div>
      </div>
      <div class="card-flat flex items-center gap-3" style="padding:var(--space-4);border-left:3px solid var(--high)">
        <div class="threat-indicator high"></div>
        <div>
          <div style="font-size:var(--font-size-2xl);font-weight:800;color:var(--high)">28</div>
          <div style="font-size:var(--font-size-xs);color:var(--text-muted)">High Alerts</div>
        </div>
      </div>
      <div class="card-flat flex items-center gap-3" style="padding:var(--space-4);border-left:3px solid var(--medium)">
        <div class="threat-indicator medium"></div>
        <div>
          <div style="font-size:var(--font-size-2xl);font-weight:800;color:var(--medium)">47</div>
          <div style="font-size:var(--font-size-xs);color:var(--text-muted)">Medium Alerts</div>
        </div>
      </div>
      <div class="card-flat flex items-center gap-3" style="padding:var(--space-4);border-left:3px solid var(--low)">
        <div class="threat-indicator low"></div>
        <div>
          <div style="font-size:var(--font-size-2xl);font-weight:800;color:var(--low)">156</div>
          <div style="font-size:var(--font-size-xs);color:var(--text-muted)">Low Alerts</div>
        </div>
      </div>
    </div>
  `;

  loadDashboardData();
}

async function loadDashboardData() {
  try {
    const res = await fetch('/api/v1/threats/stats');
    const data = await res.json();

    // Animate KPIs
    animateCounter(document.getElementById('kpi-val-detection'), 97.8, 1500, '', '%');
    animateCounter(document.getElementById('kpi-val-fpr'), 1.8, 1500, '', '%');
    animateCounter(document.getElementById('kpi-val-latency'), 287, 1500, '', 'ms');
    animateCounter(document.getElementById('kpi-val-active'), 47, 1200);

    // Animate stats
    animateCounter(document.getElementById('stat-total'), 1847293, 2000);
    animateCounter(document.getElementById('stat-malware'), 284621, 2000);
    animateCounter(document.getElementById('stat-24h'), 12847, 1800);
    animateCounter(document.getElementById('stat-zeroday'), 34, 1200);

    // Timeline chart
    createLineChart('chart-timeline',
      data.timeSeries.map(d => d.label),
      [
        {
          label: 'Malicious',
          data: data.timeSeries.map(d => d.malicious),
          borderColor: '#ff3b5c',
          backgroundColor: 'rgba(255, 59, 92, 0.08)',
        },
        {
          label: 'Benign',
          data: data.timeSeries.map(d => d.benign),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
        }
      ]
    );

    // Severity chart
    createDoughnutChart('chart-severity',
      data.severityDistribution.map(d => d.label),
      data.severityDistribution.map(d => d.value),
      data.severityDistribution.map(d => d.color)
    );

    // Family chart
    createBarChart('chart-families',
      data.familyDistribution.map(d => d.family),
      [{
        label: 'Detections',
        data: data.familyDistribution.map(d => d.count),
        backgroundColor: [
          'rgba(255, 59, 92, 0.7)', 'rgba(105, 240, 174, 0.7)', 'rgba(255, 145, 0, 0.7)',
          'rgba(0, 229, 255, 0.7)', 'rgba(224, 64, 251, 0.7)', 'rgba(255, 23, 68, 0.7)',
          'rgba(255, 193, 7, 0.7)', 'rgba(124, 77, 255, 0.7)', 'rgba(118, 255, 3, 0.7)',
          'rgba(148, 163, 184, 0.5)'
        ]
      }],
      { horizontal: true, plugins: { legend: { display: false } } }
    );

    // Populate detections table
    const threatsRes = await fetch('/api/v1/threats');
    const threatsData = await threatsRes.json();
    const tbody = document.getElementById('detections-table');
    if (tbody) {
      tbody.innerHTML = threatsData.results.slice(0, 8).map(d => `
        <tr style="cursor:pointer" onclick="document.querySelector('[data-page=threats]')?.click()">
          <td>
            <div class="flex items-center gap-2">
              <span class="threat-indicator ${d.severity}"></span>
              <div>
                <div style="color:var(--text-primary);font-weight:500;font-size:var(--font-size-sm)">${d.filename}</div>
                <div class="font-mono text-xs text-muted">${d.hash.substring(0, 16)}…</div>
              </div>
            </div>
          </td>
          <td><span class="badge badge-${d.verdict}">${d.verdict}</span></td>
          <td>
            <div class="confidence-meter">
              <div class="confidence-bar" style="width:80px">
                <div class="confidence-fill ${d.severity || 'benign'}" style="width:${(d.confidence * 100).toFixed(0)}%"></div>
              </div>
              <span class="font-mono text-xs">${(d.confidence * 100).toFixed(1)}%</span>
            </div>
          </td>
          <td>${d.family ? `<span class="tag">${d.family}</span>` : '<span class="text-muted">—</span>'}</td>
          <td><span class="text-sm">${d.source}</span></td>
          <td><span class="text-xs text-muted">${new Date(d.timestamp).toLocaleTimeString()}</span></td>
        </tr>
      `).join('');
    }

  } catch (err) {
    console.error('Dashboard data error:', err);
  }
}
