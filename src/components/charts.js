// ============================================================
// Chart.js Wrapper Functions
// ============================================================

import Chart from 'chart.js/auto';

// Default dark theme
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(148, 163, 184, 0.1)';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.pointStyle = 'circle';
Chart.defaults.plugins.legend.labels.padding = 16;
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.95)';
Chart.defaults.plugins.tooltip.borderColor = 'rgba(0, 240, 255, 0.2)';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.elements.point.radius = 0;
Chart.defaults.elements.point.hoverRadius = 5;
Chart.defaults.elements.line.tension = 0.35;

const chartInstances = new Map();

function destroyChart(id) {
  if (chartInstances.has(id)) {
    chartInstances.get(id).destroy();
    chartInstances.delete(id);
  }
}

export function createLineChart(canvasId, labels, datasets, options = {}) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: datasets.map(ds => ({
        ...ds,
        borderWidth: 2,
        fill: ds.fill !== undefined ? ds.fill : true,
        pointHoverBorderWidth: 2,
        pointHoverBorderColor: '#fff'
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: datasets.length > 1, position: 'top' },
        ...options.plugins
      },
      scales: {
        x: {
          grid: { display: false },
          ...options.xScale
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(148, 163, 184, 0.06)' },
          ...options.yScale
        }
      },
      ...options
    }
  });

  chartInstances.set(canvasId, chart);
  return chart;
}

export function createBarChart(canvasId, labels, datasets, options = {}) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: datasets.map(ds => ({
        ...ds,
        borderRadius: 6,
        borderSkipped: false,
        barThickness: options.barThickness || 'flex',
        maxBarThickness: options.maxBarThickness || 40
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: options.horizontal ? 'y' : 'x',
      plugins: {
        legend: { display: datasets.length > 1 },
        ...options.plugins
      },
      scales: {
        x: { grid: { display: false }, ...options.xScale },
        y: { grid: { color: 'rgba(148, 163, 184, 0.06)' }, beginAtZero: true, ...options.yScale }
      },
      ...options
    }
  });

  chartInstances.set(canvasId, chart);
  return chart;
}

export function createDoughnutChart(canvasId, labels, data, colors, options = {}) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;

  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: 'rgba(6, 10, 20, 0.8)',
        borderWidth: 3,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: options.cutout || '70%',
      plugins: {
        legend: {
          position: 'right',
          labels: { padding: 12, font: { size: 11 } },
          ...options.legend
        },
        ...options.plugins
      },
      ...options
    }
  });

  chartInstances.set(canvasId, chart);
  return chart;
}

export function createRadarChart(canvasId, labels, datasets, options = {}) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;

  const chart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels,
      datasets: datasets.map(ds => ({
        ...ds,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 6
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          max: 1,
          ticks: { stepSize: 0.2, display: false },
          grid: { color: 'rgba(148, 163, 184, 0.1)' },
          angleLines: { color: 'rgba(148, 163, 184, 0.1)' },
          pointLabels: { font: { size: 11 } }
        }
      },
      plugins: {
        legend: { position: 'top' },
        ...options.plugins
      },
      ...options
    }
  });

  chartInstances.set(canvasId, chart);
  return chart;
}

export function animateCounter(element, target, duration = 1500, prefix = '', suffix = '') {
  let start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(eased * target);

    element.textContent = prefix + current.toLocaleString() + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = prefix + target.toLocaleString() + suffix;
    }
  }

  requestAnimationFrame(update);
}
