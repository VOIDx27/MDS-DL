// ============================================================
// Modal Component
// ============================================================

export function showModal(title, contentHtml, options = {}) {
  // Remove existing modal
  const existing = document.querySelector('.modal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="${options.maxWidth ? 'max-width:' + options.maxWidth : ''}">
      <div class="modal-header">
        <h3 style="font-size:var(--font-size-lg)">${title}</h3>
        <button class="modal-close" id="modal-close-btn">✕</button>
      </div>
      <div class="modal-body">
        ${contentHtml}
      </div>
      ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
    </div>
  `;

  document.body.appendChild(overlay);

  // Close handlers
  overlay.querySelector('#modal-close-btn').addEventListener('click', () => closeModal());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escHandler);
    }
  });

  return overlay;
}

export function closeModal() {
  const overlay = document.querySelector('.modal-overlay');
  if (overlay) {
    overlay.style.animation = 'fadeIn 0.2s ease-out reverse';
    setTimeout(() => overlay.remove(), 200);
  }
}
