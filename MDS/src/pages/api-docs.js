// ============================================================
// API Documentation Page
// ============================================================

export function renderApiDocs(container) {
  const endpoints = [
    {
      method: 'POST', path: '/api/v1/analysis/analyze', tag: 'Analysis',
      description: 'Submit a file for deep learning malware analysis. Returns verdict, confidence, family classification, ATT&CK mapping, and SHAP explanations.',
      request: `{
  "filename": "suspicious_file.exe",
  "fileSize": 1048576
}`,
      response: `{
  "id": "analysis-8f3a2b1c-...",
  "verdict": "malicious",
  "confidence": 0.9871,
  "severity": "critical",
  "family": {
    "id": "emotet",
    "name": "Emotet",
    "category": "Trojan/Botnet"
  },
  "techniques": [
    { "id": "T1059.001", "tactic": "Execution", "name": "PowerShell" }
  ],
  "modelScores": { ... },
  "shapValues": [ ... ]
}`,
      curl: `curl -X POST \\
  https://api.mds-dl.io/api/v1/analysis/analyze \\
  -H "Authorization: Bearer <API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{"filename": "suspicious.exe", "fileSize": 1048576}'`,
      python: `import requests

response = requests.post(
    "https://api.mds-dl.io/api/v1/analysis/analyze",
    headers={"Authorization": "Bearer <API_KEY>"},
    json={"filename": "suspicious.exe", "fileSize": 1048576}
)
result = response.json()
print(f"Verdict: {result['verdict']} ({result['confidence']:.1%})")`
    },
    {
      method: 'GET', path: '/api/v1/analysis/:id', tag: 'Analysis',
      description: 'Retrieve analysis results by ID.',
      request: null,
      response: `{
  "id": "analysis-8f3a2b1c-...",
  "verdict": "malicious",
  "confidence": 0.9871,
  ...
}`,
      curl: `curl -X GET \\
  https://api.mds-dl.io/api/v1/analysis/analysis-8f3a2b1c \\
  -H "Authorization: Bearer <API_KEY>"`,
      python: `response = requests.get(
    "https://api.mds-dl.io/api/v1/analysis/analysis-8f3a2b1c",
    headers={"Authorization": "Bearer <API_KEY>"}
)`
    },
    {
      method: 'POST', path: '/api/v1/analysis/batch', tag: 'Analysis',
      description: 'Submit up to 10,000 files for batch analysis. Returns aggregated results with per-file verdicts.',
      request: `{
  "files": [
    { "filename": "file1.exe", "fileSize": 1024 },
    { "filename": "file2.dll", "fileSize": 2048 }
  ]
}`,
      response: `{
  "jobId": "batch-1712764800000",
  "total": 2,
  "malicious": 1,
  "benign": 1,
  "results": [ ... ]
}`,
      curl: `curl -X POST \\
  https://api.mds-dl.io/api/v1/analysis/batch \\
  -H "Authorization: Bearer <API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{"files": [{"filename": "f1.exe"}, {"filename": "f2.dll"}]}'`,
      python: `response = requests.post(
    "https://api.mds-dl.io/api/v1/analysis/batch",
    headers={"Authorization": "Bearer <API_KEY>"},
    json={"files": [{"filename": "f1.exe"}, {"filename": "f2.dll"}]}
)`
    },
    {
      method: 'GET', path: '/api/v1/threats', tag: 'Threats',
      description: 'List recent threat detections with pagination and filtering.',
      request: null,
      response: `{
  "total": 247,
  "offset": 0,
  "limit": 50,
  "results": [ ... ]
}`,
      curl: `curl -X GET \\
  "https://api.mds-dl.io/api/v1/threats?severity=critical&limit=10" \\
  -H "Authorization: Bearer <API_KEY>"`,
      python: `response = requests.get(
    "https://api.mds-dl.io/api/v1/threats",
    headers={"Authorization": "Bearer <API_KEY>"},
    params={"severity": "critical", "limit": 10}
)`
    },
    {
      method: 'GET', path: '/api/v1/threats/families', tag: 'Threats',
      description: 'Get the complete malware family taxonomy with metadata.',
      request: null,
      response: `[
  {
    "id": "emotet",
    "name": "Emotet",
    "category": "Trojan/Botnet",
    "severity": "critical",
    "samples": 248531
  },
  ...
]`,
      curl: `curl -X GET \\
  https://api.mds-dl.io/api/v1/threats/families \\
  -H "Authorization: Bearer <API_KEY>"`,
      python: `response = requests.get(
    "https://api.mds-dl.io/api/v1/threats/families",
    headers={"Authorization": "Bearer <API_KEY>"}
)`
    },
    {
      method: 'GET', path: '/api/v1/models', tag: 'Models',
      description: 'List all deployed models with version, status, and performance metrics.',
      request: null,
      response: `[
  {
    "id": "malconv-v3",
    "name": "MalConv Static Analyzer",
    "version": "3.2.1",
    "status": "production",
    "accuracy": 0.971,
    "auc": 0.993
  },
  ...
]`,
      curl: `curl -X GET \\
  https://api.mds-dl.io/api/v1/models \\
  -H "Authorization: Bearer <API_KEY>"`,
      python: `response = requests.get(
    "https://api.mds-dl.io/api/v1/models",
    headers={"Authorization": "Bearer <API_KEY>"}
)`
    },
    {
      method: 'GET', path: '/api/v1/health', tag: 'System',
      description: 'Health check endpoint returning system status, uptime, and model availability.',
      request: null,
      response: `{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 86400,
  "models": {
    "malconv": "online",
    "behaviorBert": "online",
    "gnnSage": "online",
    "visionResnet": "online",
    "ensembleMeta": "online"
  }
}`,
      curl: `curl -X GET https://api.mds-dl.io/api/v1/health`,
      python: `response = requests.get("https://api.mds-dl.io/api/v1/health")`
    }
  ];

  const methodColors = {
    GET: { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
    POST: { bg: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
    PUT: { bg: 'rgba(255, 193, 7, 0.12)', color: '#ffc107', border: 'rgba(255, 193, 7, 0.3)' },
    DELETE: { bg: 'rgba(255, 59, 92, 0.12)', color: '#ff3b5c', border: 'rgba(255, 59, 92, 0.3)' }
  };

  container.innerHTML = `
    <!-- API Header -->
    <div class="card fade-in mb-6" style="padding:var(--space-6)">
      <div class="flex items-center gap-4 mb-4">
        <div style="width:48px;height:48px;border-radius:var(--radius-md);background:linear-gradient(135deg,var(--cyan),var(--purple));display:flex;align-items:center;justify-content:center;font-size:1.5rem">📡</div>
        <div>
          <h2 style="font-size:var(--font-size-xl)">MDS-DL REST API v1.0</h2>
          <p class="text-sm text-muted">OpenAPI 3.0 compliant • Rate limit: 1000 req/min • TLS 1.3</p>
        </div>
      </div>
      <div class="flex gap-3 flex-wrap">
        <div class="card-flat flex items-center gap-2" style="padding:var(--space-2) var(--space-4)">
          <span class="text-xs text-muted">Base URL:</span>
          <code class="text-sm" style="color:var(--cyan)">https://api.mds-dl.io/api/v1</code>
        </div>
        <div class="card-flat flex items-center gap-2" style="padding:var(--space-2) var(--space-4)">
          <span class="text-xs text-muted">Auth:</span>
          <code class="text-sm">Bearer Token (API Key)</code>
        </div>
        <div class="card-flat flex items-center gap-2" style="padding:var(--space-2) var(--space-4)">
          <span class="text-xs text-muted">Format:</span>
          <code class="text-sm">JSON</code>
        </div>
      </div>
    </div>

    <!-- Endpoints -->
    <div class="flex flex-col gap-4" id="endpoints-list">
      ${endpoints.map((ep, idx) => {
        const mc = methodColors[ep.method];
        return `
          <div class="card fade-in" style="padding:0;overflow:hidden" id="endpoint-${idx}">
            <div class="flex items-center gap-4" style="padding:var(--space-4) var(--space-5);cursor:pointer" onclick="this.parentElement.querySelector('.endpoint-body').classList.toggle('expanded')">
              <span class="badge" style="background:${mc.bg};color:${mc.color};border:1px solid ${mc.border};min-width:52px;justify-content:center;font-weight:700">${ep.method}</span>
              <code class="text-sm" style="color:var(--text-primary);font-weight:500">${ep.path}</code>
              <span class="tag" style="margin-left:var(--space-2)">${ep.tag}</span>
              <span class="text-sm text-muted" style="margin-left:auto;flex:1;text-align:right;max-width:50%">${ep.description.slice(0, 80)}${ep.description.length > 80 ? '...' : ''}</span>
              <span class="text-muted" style="transition:transform 0.2s">▼</span>
            </div>
            <div class="endpoint-body" style="max-height:0;overflow:hidden;transition:max-height 0.4s ease">
              <div style="padding:0 var(--space-5) var(--space-5);border-top:1px solid var(--border-primary)">
                <p class="text-sm text-secondary mt-4 mb-4">${ep.description}</p>

                <div class="tabs" id="tabs-${idx}">
                  <button class="tab active" onclick="switchTab(${idx}, 'example')">Example</button>
                  <button class="tab" onclick="switchTab(${idx}, 'curl')">cURL</button>
                  <button class="tab" onclick="switchTab(${idx}, 'python')">Python</button>
                </div>

                <div class="tab-content" id="tab-content-${idx}">
                  <div class="tab-pane" data-tab="example" style="display:block">
                    ${ep.request ? `
                      <div class="text-xs font-semibold text-muted mb-2">Request Body</div>
                      <pre style="margin-bottom:var(--space-4)">${ep.request}</pre>
                    ` : ''}
                    <div class="text-xs font-semibold text-muted mb-2">Response</div>
                    <pre>${ep.response}</pre>
                  </div>
                  <div class="tab-pane" data-tab="curl" style="display:none">
                    <pre>${ep.curl}</pre>
                  </div>
                  <div class="tab-pane" data-tab="python" style="display:none">
                    <pre>${ep.python}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Tab switching global function
  window.switchTab = function(epIdx, tabName) {
    const tabsContainer = document.getElementById(`tabs-${epIdx}`);
    const contentContainer = document.getElementById(`tab-content-${epIdx}`);
    if (!tabsContainer || !contentContainer) return;

    tabsContainer.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    contentContainer.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');

    const tabs = tabsContainer.querySelectorAll('.tab');
    const tabMap = { example: 0, curl: 1, python: 2 };
    tabs[tabMap[tabName]]?.classList.add('active');
    contentContainer.querySelector(`[data-tab="${tabName}"]`).style.display = 'block';
  };

  // Add CSS for expandable sections
  const style = document.createElement('style');
  style.textContent = `.endpoint-body.expanded { max-height: 800px !important; }`;
  document.head.appendChild(style);
}
