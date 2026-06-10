const CHART_COLORS = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#3b82f6', '#ec4899', '#14b8a6'
];

function getThemeColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    text: isDark ? '#94a3b8' : '#475569',
    grid: isDark ? '#1e293b' : '#e2e8f0',
    bg: 'transparent'
  };
}

export function drawLineChart(canvas, labels, datasets, options = {}) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  ctx.scale(dpr, dpr);

  const colors = getThemeColors();
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, width, height);

  const allValues = datasets.flatMap(d => d.data);
  const maxVal = Math.max(...allValues, options.maxY || 4);
  const minVal = Math.min(...allValues, 0);

  // Grid lines
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (chartH / gridLines) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    const val = maxVal - ((maxVal - minVal) / gridLines) * i;
    ctx.fillStyle = colors.text;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val.toFixed(1), padding.left - 8, y + 4);
  }

  // X labels
  labels.forEach((label, i) => {
    const x = padding.left + (chartW / (labels.length - 1 || 1)) * i;
    ctx.fillStyle = colors.text;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, height - 10);
  });

  // Draw datasets
  datasets.forEach((dataset, di) => {
    const color = dataset.color || CHART_COLORS[di % CHART_COLORS.length];

    if (dataset.fill) {
      ctx.beginPath();
      dataset.data.forEach((val, i) => {
        const x = padding.left + (chartW / (labels.length - 1 || 1)) * i;
        const y = padding.top + chartH - ((val - minVal) / (maxVal - minVal || 1)) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(padding.left + chartW, padding.top + chartH);
      ctx.lineTo(padding.left, padding.top + chartH);
      ctx.closePath();
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
      gradient.addColorStop(0, color + '40');
      gradient.addColorStop(1, color + '05');
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    dataset.data.forEach((val, i) => {
      const x = padding.left + (chartW / (labels.length - 1 || 1)) * i;
      const y = padding.top + chartH - ((val - minVal) / (maxVal - minVal || 1)) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    dataset.data.forEach((val, i) => {
      const x = padding.left + (chartW / (labels.length - 1 || 1)) * i;
      const y = padding.top + chartH - ((val - minVal) / (maxVal - minVal || 1)) * chartH;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  });
}

export function drawBarChart(canvas, labels, data, options = {}) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  ctx.scale(dpr, dpr);

  const colors = getThemeColors();
  const padding = { top: 20, right: 20, bottom: 50, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, width, height);

  const maxVal = Math.max(...data, 1);
  const barWidth = (chartW / labels.length) * 0.6;
  const gap = (chartW / labels.length) * 0.4;

  data.forEach((val, i) => {
    const barH = (val / maxVal) * chartH;
    const x = padding.left + i * (barWidth + gap) + gap / 2;
    const y = padding.top + chartH - barH;

    const gradient = ctx.createLinearGradient(x, y, x, y + barH);
    const color = options.colors?.[i] || CHART_COLORS[i % CHART_COLORS.length];
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, color + '80');

    ctx.fillStyle = gradient;
    const radius = 6;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + barWidth - radius, y);
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
    ctx.lineTo(x + barWidth, y + barH);
    ctx.lineTo(x, y + barH);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.fill();

    ctx.fillStyle = colors.text;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i], x + barWidth / 2, height - 15);

    if (val > 0) {
      ctx.fillStyle = colors.text;
      ctx.font = 'bold 10px Inter, sans-serif';
      const label = options.formatValue ? options.formatValue(val) : String(val);
      ctx.fillText(label, x + barWidth / 2, y - 8);
    }
  });
}

export function drawDoughnutChart(canvas, labels, data, options = {}) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  const size = Math.min(rect.width, rect.height || rect.width);
  const width = size;
  const height = size;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  const total = data.reduce((a, b) => a + b, 0) || 1;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 20;
  const innerRadius = radius * 0.62;
  const sliceColors = options.colors || CHART_COLORS;

  let startAngle = -Math.PI / 2;

  if (total === 0) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2, true);
    ctx.fillStyle = getThemeColors().grid;
    ctx.fill();
  } else {
    data.forEach((val, i) => {
      if (val <= 0) return;
      const sliceAngle = (val / total) * Math.PI * 2;
      const color = sliceColors[i % sliceColors.length];

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      startAngle += sliceAngle;
    });
  }

  const colors = getThemeColors();
  const centerMain = options.centerText ?? String(total);
  const centerSub = options.centerSubtext ?? 'Jumlah';
  ctx.fillStyle = colors.text;
  ctx.font = `bold ${options.centerFontSize || 16}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(centerMain, centerX, centerY - 6);
  ctx.font = '11px Inter, sans-serif';
  ctx.fillText(centerSub, centerX, centerY + 12);
}

export function initCharts(container) {
  const canvases = container.querySelectorAll('canvas[data-chart]');
  canvases.forEach(canvas => {
    const type = canvas.dataset.chart;
    const config = JSON.parse(canvas.dataset.config || '{}');

    if (type === 'line') {
      drawLineChart(canvas, config.labels, config.datasets, config.options);
    } else if (type === 'bar') {
      drawBarChart(canvas, config.labels, config.data, config.options);
    } else if (type === 'doughnut') {
      drawDoughnutChart(canvas, config.labels, config.data, config.options);
    }
  });
}

export function renderChartLegend(labels, data, container, options = {}) {
  const colors = options.colors || CHART_COLORS;
  const format = options.format || (v => v);
  container.innerHTML = labels.map((label, i) => {
    const color = colors[i % colors.length];
    return `
      <div class="chart-legend__item">
        <span class="chart-legend__dot" style="background:${color}"></span>
        <span class="chart-legend__label">${label}</span>
        <span class="chart-legend__value">${format(data[i])}</span>
      </div>
    `;
  }).join('');
}
