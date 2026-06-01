// ══════════════════════════════════════════════════════════
// LIVE ENVIRONMENT CHART — PATCHED
// Null guards on all getElementById calls.
// These elements only exist in the environment module DOM;
// chart.js runs globally so any tick() before the module
// renders would throw "Cannot set properties of null".
// ══════════════════════════════════════════════════════════
(function() {
  const METRICS = {
    temp: { label:'Temperature °C', color:'#e8a845', min:18, max:34, target:[22,26], unit:'°C' },
    rh:   { label:'Humidity %RH',   color:'#5ba3f5', min:30, max:90, target:[45,65], unit:'%' },
    vpd:  { label:'VPD kPa',        color:'#6dbf70', min:0.2, max:2.0, target:[0.8,1.4], unit:' kPa' },
    co2:  { label:'CO₂ ppm',        color:'#a98ee8', min:400, max:1800, target:[800,1400], unit:' ppm' },
    ph:   { label:'pH',             color:'#c9a227', min:5.0, max:7.5, target:[5.8,6.5], unit:' pH' },
  };

  let currentMetric = 'temp';
  let chartSpeed    = 1500;
  let chartInterval = null;
  const POINTS      = 60;
  let chartData     = {};

  // ── Helper: safe getElementById that never throws ───────
  function el(id) { return document.getElementById(id); }
  function setText(id, val) { const e = el(id); if (e) e.textContent = val; }
  function setWidth(id, val) { const e = el(id); if (e) e.style.width = val; }

  // ── Seed initial data with realistic variation ──────────
  function seed(metric) {
    const m   = METRICS[metric];
    const mid = (m.target[0] + m.target[1]) / 2;
    const arr = [];
    let v = mid;
    for (let i = 0; i < POINTS; i++) {
      v += (Math.random() - 0.49) * ((m.max - m.min) * 0.025);
      v  = Math.max(m.min * 1.05, Math.min(m.max * 0.95, v));
      arr.push(v);
    }
    return arr;
  }

  Object.keys(METRICS).forEach(k => { chartData[k] = seed(k); });

  // ── Tick: advance simulation and redraw ─────────────────
  function tick() {
    Object.keys(METRICS).forEach(metric => {
      const m    = METRICS[metric];
      const arr  = chartData[metric];
      const last = arr[arr.length - 1];
      const drift = ((m.target[0] + m.target[1]) / 2 - last) * 0.05;
      let next = last + drift + (Math.random() - 0.5) * ((m.max - m.min) * 0.018);
      next = Math.max(m.min, Math.min(m.max, next));
      arr.push(next);
      if (arr.length > POINTS) arr.shift();
    });
    renderChart();
    updateGauges();
  }

  // ── Update gauge readouts (all null-guarded) ────────────
  function updateGauges() {
    const d   = chartData;
    const last = k => d[k][d[k].length - 1];
    const m    = METRICS;
    const pct  = (v, k) => ((v - m[k].min) / (m[k].max - m[k].min) * 100).toFixed(0) + '%';

    setText('live-temp', last('temp').toFixed(1));
    setText('live-rh',   last('rh').toFixed(1));
    setText('live-vpd',  last('vpd').toFixed(3));
    setText('live-co2',  Math.round(last('co2')));
    setText('live-ph',   last('ph').toFixed(2));
    setText('live-ec',   (1.6 + Math.random() * 0.05).toFixed(3));

    setWidth('live-temp-bar', pct(last('temp'), 'temp'));
    setWidth('live-rh-bar',   pct(last('rh'),   'rh'));
    setWidth('live-vpd-bar',  pct(last('vpd'),  'vpd'));
    setWidth('live-co2-bar',  pct(last('co2'),  'co2'));
    setWidth('live-ph-bar',   pct(last('ph'),   'ph'));
  }

  // ── Render the canvas chart ─────────────────────────────
  function renderChart() {
    const canvas = el('live-chart');
    if (!canvas) return; // environment module not active yet — skip silently

    const parent = canvas.parentElement;
    canvas.width  = parent ? (parent.offsetWidth || 800) : 800;
    canvas.height = 180;

    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const m = METRICS[currentMetric];
    const arr = chartData[currentMetric];
    const pad = { top:16, right:12, bottom:28, left:44 };
    const cw  = w - pad.left - pad.right;
    const ch  = h - pad.top  - pad.bottom;

    ctx.clearRect(0, 0, w, h);

    // Grid lines + Y-axis labels
    ctx.strokeStyle = 'rgba(61,107,61,0.2)';
    ctx.lineWidth   = 1;
    for (let i = 0; i <= 4; i++) {
      const y   = pad.top + (ch / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cw, y); ctx.stroke();
      const val = m.max - (m.max - m.min) * (i / 4);
      ctx.fillStyle = 'rgba(122,170,125,0.5)';
      ctx.font      = '9px DM Mono, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(m.unit.includes('ppm') ? 0 : 1), pad.left - 4, y + 3);
    }

    // Target zone shading
    const ty1 = pad.top + ch * (1 - (m.target[1] - m.min) / (m.max - m.min));
    const ty2 = pad.top + ch * (1 - (m.target[0] - m.min) / (m.max - m.min));
    ctx.fillStyle = 'rgba(109,191,112,0.07)';
    ctx.fillRect(pad.left, ty1, cw, ty2 - ty1);

    // Gradient fill under line
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
    grad.addColorStop(0, m.color + '55');
    grad.addColorStop(1, m.color + '08');
    ctx.beginPath();
    arr.forEach((v, i) => {
      const x = pad.left + (i / (POINTS - 1)) * cw;
      const y = pad.top  + ch * (1 - (v - m.min) / (m.max - m.min));
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(pad.left + cw, pad.top + ch);
    ctx.lineTo(pad.left, pad.top + ch);
    ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();

    // Line stroke
    ctx.beginPath();
    arr.forEach((v, i) => {
      const x = pad.left + (i / (POINTS - 1)) * cw;
      const y = pad.top  + ch * (1 - (v - m.min) / (m.max - m.min));
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = m.color; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();

    // Latest value dot
    const lv = arr[arr.length - 1];
    const lx = pad.left + cw;
    const ly = pad.top  + ch * (1 - (lv - m.min) / (m.max - m.min));
    ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI * 2);
    ctx.fillStyle = m.color; ctx.fill();
    ctx.beginPath(); ctx.arc(lx, ly, 7, 0, Math.PI * 2);
    ctx.strokeStyle = m.color + '55'; ctx.lineWidth = 2; ctx.stroke();

    // Value label
    ctx.fillStyle = m.color;
    ctx.font      = 'bold 11px DM Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(lv.toFixed(m.unit.includes('ppm') ? 0 : 2) + m.unit, lx + pad.right, ly - 8);

    // X-axis time labels
    ctx.fillStyle = 'rgba(122,170,125,0.5)';
    ctx.font      = '9px DM Mono, monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const xi      = Math.round(i * (POINTS - 1) / 5);
      const x       = pad.left + (xi / (POINTS - 1)) * cw;
      const secsAgo = (POINTS - 1 - xi) * (chartSpeed / 1000);
      const lbl     = secsAgo === 0 ? 'now' : '-' + (secsAgo < 60 ? Math.round(secsAgo) + 's' : (secsAgo / 60).toFixed(1) + 'm');
      ctx.fillText(lbl, x, pad.top + ch + 16);
    }

    // Stats bar (null-guarded)
    const vals = arr.slice();
    const mn   = Math.min(...vals), mx = Math.max(...vals);
    const av   = vals.reduce((a, b) => a + b, 0) / vals.length;
    const f    = v => m.unit.includes('ppm') ? Math.round(v) + m.unit : v.toFixed(2) + m.unit;
    setText('chart-min', 'MIN: ' + f(mn));
    setText('chart-max', 'MAX: ' + f(mx));
    setText('chart-avg', 'AVG: ' + f(av));
  }

  // ── Public API ──────────────────────────────────────────
  window.setChartMetric = function(metric, btn) {
    currentMetric = metric;
    document.querySelectorAll('.chart-range-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderChart();
  };

  window.setChartSpeed = function(ms) {
    chartSpeed = ms;
    if (chartInterval) clearInterval(chartInterval);
    chartInterval = setInterval(tick, ms);
  };

  // Expose data for the demo chart history loader (demo-data.js uses this)
  window.getChartData = function() { return chartData; };
  window.injectChartHistory = function(history) {
    Object.keys(history).forEach(k => { if (chartData[k]) chartData[k] = history[k]; });
    renderChart();
    updateGauges();
  };

  // ── Start ───────────────────────────────────────────────
  chartInterval = setInterval(tick, chartSpeed);
  tick(); // immediate first tick — updateGauges will silently skip missing elements

  window.addEventListener('resize', renderChart);
})();
