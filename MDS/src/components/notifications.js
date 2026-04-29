// ============================================================
// Toast Notification System
// ============================================================

let toastId = 0;

export function showToast(message, type = 'info', duration = 5000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const id = ++toastId;
  const icons = {
    critical: '🚨',
    high: '⚠️',
    info: '💡',
    success: '✅'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.id = `toast-${id}`;
  toast.innerHTML = `
    <span style="font-size:1.2rem;flex-shrink:0">${icons[type] || icons.info}</span>
    <div style="flex:1;min-width:0">
      <div style="font-size:var(--font-size-sm);font-weight:600;color:var(--text-primary);margin-bottom:2px">${type.charAt(0).toUpperCase() + type.slice(1)} Alert</div>
      <div style="font-size:var(--font-size-xs);color:var(--text-secondary)">${message}</div>
    </div>
    <button onclick="this.parentElement.classList.add('removing');setTimeout(()=>this.parentElement.remove(),300)" 
            style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1rem;padding:0;flex-shrink:0">✕</button>
  `;

  container.appendChild(toast);

  // Auto dismiss
  setTimeout(() => {
    if (document.getElementById(`toast-${id}`)) {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);
}
