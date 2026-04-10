// ============================================================
// Settings Page
// ============================================================

export function renderSettings(container) {
  container.innerHTML = `
    <!-- Detection Settings -->
    <div class="card fade-in mb-6" style="padding:var(--space-6)">
      <h3 class="section-title mb-6" style="font-size:var(--font-size-lg)">🎛️ Detection Configuration</h3>
      
      <div class="grid grid-2" style="gap:var(--space-8)">
        <div>
          <h4 class="text-sm font-semibold mb-4">Confidence Thresholds</h4>
          <div class="flex flex-col gap-5">
            <div>
              <div class="flex justify-between mb-2">
                <label class="text-sm">Malicious Threshold</label>
                <span class="font-mono text-sm text-cyan" id="threshold-mal-val">0.75</span>
              </div>
              <input type="range" min="0.50" max="0.99" step="0.01" value="0.75"
                style="width:100%;accent-color:var(--cyan)"
                oninput="document.getElementById('threshold-mal-val').textContent = this.value" />
              <div class="flex justify-between text-xs text-muted mt-1">
                <span>More Detections (noisy)</span>
                <span>Fewer Detections (precise)</span>
              </div>
            </div>
            <div>
              <div class="flex justify-between mb-2">
                <label class="text-sm">Suspicious Threshold</label>
                <span class="font-mono text-sm text-medium" id="threshold-sus-val">0.45</span>
              </div>
              <input type="range" min="0.20" max="0.74" step="0.01" value="0.45"
                style="width:100%;accent-color:var(--medium)"
                oninput="document.getElementById('threshold-sus-val').textContent = this.value" />
            </div>
            <div>
              <div class="flex justify-between mb-2">
                <label class="text-sm">Auto-sandbox Threshold</label>
                <span class="font-mono text-sm text-purple" id="threshold-sandbox-val">0.60</span>
              </div>
              <input type="range" min="0.30" max="0.90" step="0.01" value="0.60"
                style="width:100%;accent-color:var(--purple)"
                oninput="document.getElementById('threshold-sandbox-val').textContent = this.value" />
            </div>
          </div>
        </div>

        <div>
          <h4 class="text-sm font-semibold mb-4">Analysis Options</h4>
          <div class="flex flex-col gap-4">
            ${settingToggle('enable-static', 'Static Analysis', 'PE headers, byte n-grams, strings', true)}
            ${settingToggle('enable-behavioral', 'Behavioral Analysis', 'API call traces, sandbox execution', true)}
            ${settingToggle('enable-graph', 'Graph Analysis', 'Control flow graph, import graph', true)}
            ${settingToggle('enable-vision', 'Visual Analysis', 'Binary visualization classifier', true)}
            ${settingToggle('enable-unpack', 'Auto-Unpacking', 'Automatically unpack packed/obfuscated binaries', true)}
            ${settingToggle('enable-attck', 'ATT&CK Mapping', 'Map detections to MITRE ATT&CK framework', true)}
            ${settingToggle('enable-shap', 'SHAP Explainability', 'Generate feature importance explanations', false)}
          </div>
        </div>
      </div>
    </div>

    <!-- Notification Settings -->
    <div class="card fade-in mb-6" style="padding:var(--space-6)">
      <h3 class="section-title mb-6" style="font-size:var(--font-size-lg)">🔔 Notification Preferences</h3>
      <div class="grid grid-2" style="gap:var(--space-8)">
        <div>
          <h4 class="text-sm font-semibold mb-4">Alert Channels</h4>
          <div class="flex flex-col gap-4">
            ${settingToggle('notify-dashboard', 'Dashboard Alerts', 'Show real-time toast notifications', true)}
            ${settingToggle('notify-email', 'Email Alerts', 'Send critical/high alerts via email', true)}
            ${settingToggle('notify-slack', 'Slack Integration', 'Post alerts to #security-alerts channel', false)}
            ${settingToggle('notify-pagerduty', 'PagerDuty', 'Trigger incidents for critical threats', false)}
            ${settingToggle('notify-webhook', 'Webhook', 'POST results to custom webhook URL', false)}
          </div>
        </div>
        <div>
          <h4 class="text-sm font-semibold mb-4">Alert Severity Filter</h4>
          <div class="flex flex-col gap-4">
            ${settingToggle('severity-critical', 'Critical Alerts', 'Ransomware, C2 frameworks, APTs', true)}
            ${settingToggle('severity-high', 'High Alerts', 'Trojans, RATs, infostealers', true)}
            ${settingToggle('severity-medium', 'Medium Alerts', 'Adware, PUPs, suspicious scripts', true)}
            ${settingToggle('severity-low', 'Low Alerts', 'Informational, low-confidence detections', false)}
          </div>
        </div>
      </div>
    </div>

    <!-- Integration Status -->
    <div class="card fade-in mb-6" style="padding:var(--space-6)">
      <div class="section-header">
        <h3 class="section-title" style="font-size:var(--font-size-lg)">🔌 Integrations</h3>
        <button class="btn btn-secondary btn-sm">+ Add Integration</button>
      </div>
      <div class="grid grid-3 mt-4" style="gap:var(--space-4)">
        ${integrationCard('Splunk', 'SIEM', 'connected', 'Sending events to idx_security', '2 min ago')}
        ${integrationCard('Elastic Security', 'SIEM', 'connected', 'Indexing to malware-detections', '1 min ago')}
        ${integrationCard('Microsoft Sentinel', 'SIEM', 'disconnected', 'Not configured', '—')}
        ${integrationCard('CrowdStrike', 'EDR', 'connected', 'Plugin v2.1 deployed to 12,847 endpoints', '30 sec ago')}
        ${integrationCard('STIX/TAXII', 'Threat Intel', 'connected', 'Exporting IOCs every 15 min', '5 min ago')}
        ${integrationCard('VirusTotal', 'Enrichment', 'connected', 'Enriching hashes on detection', '3 min ago')}
      </div>
    </div>

    <!-- API Key Management -->
    <div class="card fade-in mb-6" style="padding:var(--space-6)">
      <div class="section-header">
        <h3 class="section-title" style="font-size:var(--font-size-lg)">🔑 API Keys</h3>
        <button class="btn btn-primary btn-sm">Generate New Key</button>
      </div>
      <div class="table-container mt-4">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Key</th>
              <th>Scopes</th>
              <th>Created</th>
              <th>Last Used</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="font-semibold">Production API</td>
              <td><code class="font-mono text-xs">mds_live_sk_...a8f2</code></td>
              <td><span class="tag">analysis</span> <span class="tag">threats</span> <span class="tag">models</span></td>
              <td class="text-sm text-muted">Mar 15, 2026</td>
              <td class="text-sm text-muted">2 min ago</td>
              <td><span class="badge badge-info badge-dot">Active</span></td>
              <td><button class="btn btn-danger btn-sm">Revoke</button></td>
            </tr>
            <tr>
              <td class="font-semibold">Staging API</td>
              <td><code class="font-mono text-xs">mds_test_sk_...b4e1</code></td>
              <td><span class="tag">analysis</span></td>
              <td class="text-sm text-muted">Apr 1, 2026</td>
              <td class="text-sm text-muted">1 hour ago</td>
              <td><span class="badge badge-info badge-dot">Active</span></td>
              <td><button class="btn btn-danger btn-sm">Revoke</button></td>
            </tr>
            <tr>
              <td class="font-semibold">CI/CD Pipeline</td>
              <td><code class="font-mono text-xs">mds_ci_sk_...c7d3</code></td>
              <td><span class="tag">analysis</span> <span class="tag">models</span></td>
              <td class="text-sm text-muted">Feb 20, 2026</td>
              <td class="text-sm text-muted">6 hours ago</td>
              <td><span class="badge badge-info badge-dot">Active</span></td>
              <td><button class="btn btn-danger btn-sm">Revoke</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- System Info -->
    <div class="card fade-in" style="padding:var(--space-6)">
      <h3 class="section-title mb-4" style="font-size:var(--font-size-lg)">ℹ️ System Information</h3>
      <div class="grid grid-4" style="gap:var(--space-4)">
        <div class="card-flat" style="padding:var(--space-4)">
          <div class="text-xs text-muted mb-1">Version</div>
          <div class="font-mono font-semibold">MDS-DL v1.0.0</div>
        </div>
        <div class="card-flat" style="padding:var(--space-4)">
          <div class="text-xs text-muted mb-1">Environment</div>
          <div class="font-semibold">Production</div>
        </div>
        <div class="card-flat" style="padding:var(--space-4)">
          <div class="text-xs text-muted mb-1">GPU Nodes</div>
          <div class="font-semibold">4x NVIDIA A100</div>
        </div>
        <div class="card-flat" style="padding:var(--space-4)">
          <div class="text-xs text-muted mb-1">Uptime</div>
          <div class="font-semibold" style="color:var(--green)">99.97% (30d)</div>
        </div>
      </div>
    </div>
  `;
}

function settingToggle(id, label, description, checked) {
  return `
    <div class="flex items-center justify-between">
      <div>
        <div class="text-sm font-medium">${label}</div>
        <div class="text-xs text-muted">${description}</div>
      </div>
      <label class="switch">
        <input type="checkbox" id="${id}" ${checked ? 'checked' : ''} />
        <span class="switch-slider"></span>
      </label>
    </div>
  `;
}

function integrationCard(name, type, status, details, lastSync) {
  const isConnected = status === 'connected';
  return `
    <div class="card-flat" style="padding:var(--space-4);border-left:3px solid ${isConnected ? 'var(--green)' : 'var(--text-muted)'}">
      <div class="flex items-center justify-between mb-2">
        <h4 class="text-sm font-semibold">${name}</h4>
        <span class="badge ${isConnected ? 'badge-info' : 'badge-high'} badge-dot">${status}</span>
      </div>
      <span class="tag mb-2">${type}</span>
      <p class="text-xs text-muted mt-2">${details}</p>
      <div class="text-xs text-muted mt-2">Last sync: ${lastSync}</div>
    </div>
  `;
}
