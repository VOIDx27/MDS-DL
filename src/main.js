// ============================================================
// MDS-DL Main Entry — Router, State, Page Management
// ============================================================

import { initSidebar } from './components/sidebar.js';
import { initParticles } from './components/particles.js';
import { showToast } from './components/notifications.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderAnalyze } from './pages/analyze.js';
import { renderThreats } from './pages/threats.js';
import { renderModels } from './pages/models.js';
import { renderApiDocs } from './pages/api-docs.js';
import { renderSettings } from './pages/settings.js';

// ---- Global State ----
window.MDS = {
  currentPage: 'dashboard',
  sidebarCollapsed: false,
  liveUpdatesEnabled: true,
  liveInterval: null
};

// ---- Route Definitions ----
const routes = {
  dashboard: { title: 'Security Dashboard', subtitle: 'Real-time threat monitoring & analytics', render: renderDashboard },
  analyze: { title: 'File Analysis', subtitle: 'Submit files for deep learning malware detection', render: renderAnalyze },
  threats: { title: 'Threat Intelligence', subtitle: 'Malware families, ATT&CK mapping & threat database', render: renderThreats },
  models: { title: 'Model Performance', subtitle: 'ML model metrics, drift monitoring & lifecycle', render: renderModels },
  'api-docs': { title: 'API Documentation', subtitle: 'RESTful API reference for MDS-DL integration', render: renderApiDocs },
  settings: { title: 'Settings', subtitle: 'System configuration & integrations', render: renderSettings }
};

// ---- Router ----
export function navigate(page) {
  if (!routes[page]) return;

  // Clear live updates
  if (window.MDS.liveInterval) {
    clearInterval(window.MDS.liveInterval);
    window.MDS.liveInterval = null;
  }

  window.MDS.currentPage = page;
  const route = routes[page];

  // Update topbar
  document.getElementById('topbar').innerHTML = `
    <div class="topbar-left">
      <h1 class="topbar-title glitch" data-text="${route.title}">${route.title}</h1>
      <p class="topbar-subtitle" style="font-family:var(--font-mono); color:var(--cyan)">// ${route.subtitle}</p>
    </div>
    <div class="topbar-right">
      <div class="topbar-status">
        <span class="pulse-dot"></span>
        All Models Online
      </div>
      <div style="display:flex;align-items:center;gap:var(--space-3)">
        <button class="btn btn-ghost btn-sm" onclick="window.MDS.liveUpdatesEnabled = !window.MDS.liveUpdatesEnabled; this.innerHTML = window.MDS.liveUpdatesEnabled ? '⚡ Live' : '⏸ Paused'; this.style.color = window.MDS.liveUpdatesEnabled ? 'var(--green)' : 'var(--text-muted)';" style="color:var(--green)">⚡ Live</button>
        <div class="avatar">SA</div>
      </div>
    </div>
  `;

  // Update sidebar
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // Render page
  const content = document.getElementById('page-content');
  content.innerHTML = '';
  content.className = 'page-content fade-in';
  route.render(content);

  // Initialize Vanilla-Tilt on interactive elements
  setTimeout(() => {
    if (window.VanillaTilt) {
      VanillaTilt.init(document.querySelectorAll(".card, .kpi-card, .btn"), {
        max: 8,
        speed: 400,
        glare: true,
        "max-glare": 0.2,
        scale: 1.02,
        perspective: 1000
      });
    }
  }, 100);

  // Push state
  const url = page === 'dashboard' ? '/' : `/${page}`;
  if (window.location.pathname !== url) {
    history.pushState({ page }, route.title, url);
  }
  document.title = `${route.title} — MDS-DL`;
}

// ---- Init ----
function init() {
  initSidebar();
  initParticles();

  // Handle browser back/forward
  window.addEventListener('popstate', (e) => {
    const page = e.state?.page || pathToPage(window.location.pathname);
    navigate(page);
  });

  // Initial route
  const initialPage = pathToPage(window.location.pathname);
  navigate(initialPage);

  // Periodic live detection toast
  setInterval(() => {
    if (!window.MDS.liveUpdatesEnabled) return;
    if (Math.random() > 0.6) {
      const families = ['Emotet', 'QakBot', 'LockBit', 'Agent Tesla', 'Cobalt Strike', 'RedLine'];
      const family = families[Math.floor(Math.random() * families.length)];
      const severity = ['critical', 'high', 'medium'][Math.floor(Math.random() * 3)];
      showToast(`New ${severity} threat detected: ${family}`, severity);
    }
  }, 15000);
}

function pathToPage(path) {
  const clean = path.replace(/^\//, '').replace(/\/$/, '') || 'dashboard';
  return routes[clean] ? clean : 'dashboard';
}

// Boot
document.addEventListener('DOMContentLoaded', init);
