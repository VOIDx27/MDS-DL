// ============================================================
// Sidebar Component
// ============================================================

import { navigate } from '../main.js';

const navItems = [
  { section: 'Overview' },
  { id: 'dashboard', icon: '📊', label: 'Dashboard', badge: null },
  { id: 'analyze', icon: '🔬', label: 'File Analysis', badge: null },
  { section: 'Intelligence' },
  { id: 'threats', icon: '🎯', label: 'Threat Intel', badge: '47' },
  { id: 'models', icon: '🧠', label: 'Model Performance', badge: null },
  { section: 'System' },
  { id: 'api-docs', icon: '📡', label: 'API Documentation', badge: null },
  { id: 'settings', icon: '⚙️', label: 'Settings', badge: null }
];

export function initSidebar() {
  const nav = document.getElementById('sidebar-nav');
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebar-toggle');

  let html = '';
  navItems.forEach(item => {
    if (item.section) {
      html += `<div class="nav-section-label">${item.section}</div>`;
    } else {
      html += `
        <a class="nav-item${item.id === 'dashboard' ? ' active' : ''}" data-page="${item.id}" id="nav-${item.id}">
          <span class="nav-icon">${item.icon}</span>
          <span class="nav-label">${item.label}</span>
          ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
        </a>
      `;
    }
  });
  nav.innerHTML = html;

  // Click handlers
  nav.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(el.dataset.page);
    });
  });

  // Toggle collapse
  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    window.MDS.sidebarCollapsed = sidebar.classList.contains('collapsed');
    toggle.textContent = window.MDS.sidebarCollapsed ? '▶' : '◀';
  });
}
