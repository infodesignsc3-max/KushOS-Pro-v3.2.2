// ══════════════════════════════════════════════════════════
// UNIFIED CORES SETTINGS & SYSTEM CONFIGURATION (PATCHED v2)
// ══════════════════════════════════════════════════════════
// Merged from: settings.js (v1 baseline) + settings_2.js (patch layer)
// Added: all v1 interactivity patterns + expanded editable surface area
// ══════════════════════════════════════════════════════════

const SETTINGS_KEY = 'kushos_settings';

// ── Serialization ─────────────────────────────────────────

/**
 * Serializes and persists all editable workspace parameters to localStorage.
 * Expanded to capture every configurable UI surface in the settings panel.
 */
function saveSettings() {
  const settings = {
    // ── Display & Appearance ───────────────────────────────
    units:         document.getElementById('sett-units')?.value,
    scanlines:     document.getElementById('sett-scanlines')?.checked,
    glow:          document.getElementById('sett-glow')?.checked,
    opacity:       document.getElementById('sett-opacity')?.value,
    accentHex:     getComputedStyle(document.documentElement).getPropertyValue('--g8').trim(),
    accentBg:      getComputedStyle(document.documentElement).getPropertyValue('--g5').trim(),
    theme:         document.getElementById('sett-theme')?.value,           // NEW: dark/light/system
    fontScale:     document.getElementById('sett-font-scale')?.value,      // NEW: UI font size scaling
    borderRadius:  document.getElementById('sett-border-radius')?.value,   // NEW: panel corner radius
    animSpeed:     document.getElementById('sett-anim-speed')?.value,      // NEW: global animation multiplier

    // ── Layout & Navigation ────────────────────────────────
    compact:       document.getElementById('sett-compact')?.checked,
    sidebarPos:    document.getElementById('sett-sidebar-pos')?.value,     // NEW: left/right sidebar
    dashLayout:    document.getElementById('sett-dash-layout')?.value,     // NEW: grid/list/masonry

    // ── Data & Telemetry ───────────────────────────────────
    autorefresh:   document.getElementById('sett-autorefresh')?.checked,
    refreshRate:   document.getElementById('sett-refresh-rate')?.value,    // NEW: polling interval ms
    chartSpeed:    document.getElementById('sett-chart-speed')?.value,
    chartType:     document.getElementById('sett-chart-type')?.value,      // NEW: line/bar/area
    dataPoints:    document.getElementById('sett-data-points')?.value,     // NEW: chart history window
    smoothing:     document.getElementById('sett-smoothing')?.checked,     // NEW: chart line smoothing

    // ── Alert Thresholds ───────────────────────────────────
    tempAlert:     document.getElementById('sett-temp-alert')?.value,
    rhAlert:       document.getElementById('sett-rh-alert')?.value,
    co2Alert:      document.getElementById('sett-co2-alert')?.value,
    vpdAlert:      document.getElementById('sett-vpd-alert')?.value,       // NEW: VPD threshold
    lightAlert:    document.getElementById('sett-light-alert')?.value,     // NEW: PPFD threshold
    ecAlert:       document.getElementById('sett-ec-alert')?.value,        // NEW: EC/nutrient threshold
    phAlertLow:    document.getElementById('sett-ph-low')?.value,          // NEW: pH floor
    phAlertHigh:   document.getElementById('sett-ph-high')?.value,         // NEW: pH ceiling

    // ── Notifications & Audio ──────────────────────────────
    sound:         document.getElementById('sett-sound')?.checked,
    soundVolume:   document.getElementById('sett-sound-volume')?.value,    // NEW: alert volume
    notifEmail:    document.getElementById('sett-notif-email')?.checked,   // NEW: email alerts
    notifPush:     document.getElementById('sett-notif-push')?.checked,    // NEW: push notifications
    notifSilence:  document.getElementById('sett-notif-silence')?.value,   // NEW: quiet hours range

    // ── System & Advanced ─────────────────────────────────
    timezone:      document.getElementById('sett-timezone')?.value,        // NEW: local TZ override
    dateFormat:    document.getElementById('sett-date-format')?.value,     // NEW: date display format
    logLevel:      document.getElementById('sett-log-level')?.value,       // NEW: console verbosity
    hardwareAccel: document.getElementById('sett-hw-accel')?.checked,      // NEW: GPU canvas rendering
    devMode:       document.getElementById('sett-dev-mode')?.checked,      // NEW: developer overlay
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ── Hydration ─────────────────────────────────────────────

/**
 * Hydrates and executes UI modifications based on saved client configurations.
 * The triggerSave=false guard on toggle helpers prevents a cascade of redundant
 * localStorage writes during page load restore.
 */
function restoreSettings() {
  let s;
  try {
    s = JSON.parse(localStorage.getItem(SETTINGS_KEY));
  } catch (e) {
    console.error('Failed to parse system preferences ledger:', e);
  }
  if (!s) return;

  // ── Display & Appearance ─────────────────────────────────

  if (s.units) {
    const el = document.getElementById('sett-units');
    if (el) el.value = s.units;
  }

  if (s.scanlines !== undefined) {
    const el = document.getElementById('sett-scanlines');
    if (el) { el.checked = s.scanlines; setScanlines(s.scanlines, false); }
  }

  if (s.glow !== undefined) {
    const el = document.getElementById('sett-glow');
    if (el) {
      el.checked = s.glow;
      const lbl = document.getElementById('sett-glow-lbl');
      if (lbl) lbl.textContent = s.glow ? 'ON' : 'OFF';
      const glow = document.getElementById('leaf-glow');
      if (glow) glow.style.display = s.glow ? 'block' : 'none';
    }
  }

  if (s.opacity) {
    const el = document.getElementById('sett-opacity');
    if (el) {
      el.value = s.opacity;
      const canvas = document.getElementById('leaf-canvas');
      if (canvas) canvas.style.opacity = s.opacity / 100;
      const val = document.getElementById('sett-opacity-val');
      if (val) val.textContent = s.opacity + '%';
    }
  }

  if (s.accentHex && s.accentBg) {
    document.documentElement.style.setProperty('--g8', s.accentHex);
    document.documentElement.style.setProperty('--g5', s.accentBg);
    document.querySelectorAll('.color-swatch').forEach(swatch => {
      const swatchHex = (swatch.getAttribute('data-hex') || swatch.style.backgroundColor || '').trim();
      swatch.classList.toggle('active', swatchHex === s.accentHex);
    });
  }

  if (s.theme) {
    const el = document.getElementById('sett-theme');
    if (el) { el.value = s.theme; applyTheme(s.theme, false); }
  }

  if (s.fontScale) {
    const el = document.getElementById('sett-font-scale');
    if (el) {
      el.value = s.fontScale;
      applyFontScale(s.fontScale, false);
      const val = document.getElementById('sett-font-scale-val');
      if (val) val.textContent = s.fontScale + '%';
    }
  }

  if (s.borderRadius) {
    const el = document.getElementById('sett-border-radius');
    if (el) {
      el.value = s.borderRadius;
      document.documentElement.style.setProperty('--panel-radius', s.borderRadius + 'px');
      const val = document.getElementById('sett-radius-val');
      if (val) val.textContent = s.borderRadius + 'px';
    }
  }

  if (s.animSpeed) {
    const el = document.getElementById('sett-anim-speed');
    if (el) {
      el.value = s.animSpeed;
      applyAnimSpeed(s.animSpeed, false);
      const val = document.getElementById('sett-anim-speed-val');
      if (val) val.textContent = s.animSpeed + 'x';
    }
  }

  // ── Layout & Navigation ──────────────────────────────────

  if (s.compact !== undefined) {
    const el = document.getElementById('sett-compact');
    if (el) { el.checked = s.compact; toggleCompactSidebar(s.compact, false); }
  }

  if (s.sidebarPos) {
    const el = document.getElementById('sett-sidebar-pos');
    if (el) { el.value = s.sidebarPos; applySidebarPos(s.sidebarPos, false); }
  }

  if (s.dashLayout) {
    const el = document.getElementById('sett-dash-layout');
    if (el) { el.value = s.dashLayout; applyDashLayout(s.dashLayout, false); }
  }

  // ── Data & Telemetry ─────────────────────────────────────

  if (s.autorefresh !== undefined) {
    const el = document.getElementById('sett-autorefresh');
    if (el) { el.checked = s.autorefresh; toggleAutoRefresh(s.autorefresh, false); }
  }

  if (s.refreshRate) {
    const el = document.getElementById('sett-refresh-rate');
    if (el) {
      el.value = s.refreshRate;
      const val = document.getElementById('sett-rr-val');
      if (val) val.textContent = (s.refreshRate / 1000).toFixed(0) + 's';
    }
  }

  if (s.chartSpeed) {
    const el = document.getElementById('sett-chart-speed');
    if (el) {
      el.value = s.chartSpeed;
      if (typeof setChartSpeed === 'function') setChartSpeed(+s.chartSpeed);
      const val = document.getElementById('sett-cs-val');
      if (val) val.textContent = (s.chartSpeed / 1000).toFixed(1) + 's';
    }
  }

  if (s.chartType) {
    const el = document.getElementById('sett-chart-type');
    if (el) { el.value = s.chartType; applyChartType(s.chartType, false); }
  }

  if (s.dataPoints) {
    const el = document.getElementById('sett-data-points');
    if (el) {
      el.value = s.dataPoints;
      if (typeof setDataPointWindow === 'function') setDataPointWindow(+s.dataPoints);
      const val = document.getElementById('sett-dp-val');
      if (val) val.textContent = s.dataPoints + ' pts';
    }
  }

  if (s.smoothing !== undefined) {
    const el = document.getElementById('sett-smoothing');
    if (el) { el.checked = s.smoothing; applyChartSmoothing(s.smoothing, false); }
  }

  // ── Alert Thresholds ─────────────────────────────────────

  const thresholds = [
    { key: 'tempAlert',   id: 'sett-temp-alert',  lblId: 'sett-temp-val',   suffix: '°C' },
    { key: 'rhAlert',     id: 'sett-rh-alert',    lblId: 'sett-rh-val',     suffix: '%'  },
    { key: 'co2Alert',    id: 'sett-co2-alert',   lblId: 'sett-co2-val',    suffix: ' ppm' },
    { key: 'vpdAlert',    id: 'sett-vpd-alert',   lblId: 'sett-vpd-val',    suffix: ' kPa' },
    { key: 'lightAlert',  id: 'sett-light-alert', lblId: 'sett-light-val',  suffix: ' µmol' },
    { key: 'ecAlert',     id: 'sett-ec-alert',    lblId: 'sett-ec-val',     suffix: ' mS' },
    { key: 'phAlertLow',  id: 'sett-ph-low',      lblId: 'sett-ph-low-val', suffix: ' pH' },
    { key: 'phAlertHigh', id: 'sett-ph-high',     lblId: 'sett-ph-high-val',suffix: ' pH' },
  ];

  thresholds.forEach(({ key, id, lblId, suffix }) => {
    if (s[key]) {
      const el = document.getElementById(id);
      if (el) {
        el.value = s[key];
        const txt = document.getElementById(lblId);
        if (txt) txt.textContent = s[key] + suffix;
      }
    }
  });

  // ── Notifications & Audio ────────────────────────────────

  if (s.sound !== undefined) {
    const el = document.getElementById('sett-sound');
    if (el) el.checked = s.sound;
  }

  if (s.soundVolume) {
    const el = document.getElementById('sett-sound-volume');
    if (el) {
      el.value = s.soundVolume;
      const val = document.getElementById('sett-vol-val');
      if (val) val.textContent = s.soundVolume + '%';
    }
  }

  ['notifEmail', 'notifPush'].forEach(key => {
    if (s[key] !== undefined) {
      const el = document.getElementById('sett-' + key.replace(/([A-Z])/g, '-$1').toLowerCase());
      if (el) el.checked = s[key];
    }
  });

  if (s.notifSilence) {
    const el = document.getElementById('sett-notif-silence');
    if (el) el.value = s.notifSilence;
  }

  // ── System & Advanced ────────────────────────────────────

  if (s.timezone) {
    const el = document.getElementById('sett-timezone');
    if (el) el.value = s.timezone;
  }

  if (s.dateFormat) {
    const el = document.getElementById('sett-date-format');
    if (el) el.value = s.dateFormat;
  }

  if (s.logLevel) {
    const el = document.getElementById('sett-log-level');
    if (el) el.value = s.logLevel;
  }

  if (s.hardwareAccel !== undefined) {
    const el = document.getElementById('sett-hw-accel');
    if (el) { el.checked = s.hardwareAccel; toggleHardwareAccel(s.hardwareAccel, false); }
  }

  if (s.devMode !== undefined) {
    const el = document.getElementById('sett-dev-mode');
    if (el) { el.checked = s.devMode; toggleDevMode(s.devMode, false); }
  }
}

// ══════════════════════════════════════════════════════════
// INTERACTIVITY & FEATURE HANDLERS
// ══════════════════════════════════════════════════════════

// ── Display & Appearance ─────────────────────────────────

function applyUnits(val) {
  // Broadcast unit change to any live metric renderers
  if (typeof window.onUnitsChange === 'function') window.onUnitsChange(val);
  saveSettings();
  toast('Units set to ' + (val === 'metric' ? 'Metric' : 'Imperial'), 'success');
}

function setScanlines(on, triggerSave = true) {
  let style = document.getElementById('scanline-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'scanline-style';
    document.head.appendChild(style);
  }
  style.textContent = on ? '' : 'body::before{display:none!important}';
  const lbl = document.getElementById('sett-scan-lbl');
  if (lbl) lbl.textContent = on ? 'ON' : 'OFF';
  if (triggerSave) saveSettings();
}

function setAccent(hex, bg, el) {
  document.documentElement.style.setProperty('--g8', hex);
  document.documentElement.style.setProperty('--g5', bg);
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
  if (el) el.classList.add('active');
  saveSettings();
  toast('Accent colour updated', 'success');
}

/** NEW: Apply light / dark / system theme */
function applyTheme(val, triggerSave = true) {
  document.documentElement.setAttribute('data-theme', val);
  if (val === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }
  if (triggerSave) { saveSettings(); toast('Theme set to ' + val, 'info'); }
}

/** NEW: Scale all UI text proportionally */
function applyFontScale(pct, triggerSave = true) {
  document.documentElement.style.setProperty('--font-scale', (pct / 100).toFixed(2));
  const val = document.getElementById('sett-font-scale-val');
  if (val) val.textContent = pct + '%';
  if (triggerSave) saveSettings();
}

/** NEW: Set panel/card border radius token */
function applyBorderRadius(px, triggerSave = true) {
  document.documentElement.style.setProperty('--panel-radius', px + 'px');
  const val = document.getElementById('sett-radius-val');
  if (val) val.textContent = px + 'px';
  if (triggerSave) saveSettings();
}

/** NEW: Multiply all CSS transition durations by a global speed factor */
function applyAnimSpeed(multiplier, triggerSave = true) {
  document.documentElement.style.setProperty('--anim-speed', multiplier);
  const val = document.getElementById('sett-anim-speed-val');
  if (val) val.textContent = multiplier + 'x';
  if (triggerSave) saveSettings();
}

// ── Layout & Navigation ──────────────────────────────────

function toggleAutoRefresh(on, triggerSave = true) {
  const lbl = document.getElementById('sett-ar-lbl');
  if (lbl) lbl.textContent = on ? 'ON' : 'OFF';
  if (triggerSave) {
    saveSettings();
    toast('Auto-refresh ' + (on ? 'enabled' : 'disabled'), 'info');
  }
}

function toggleCompactSidebar(on, triggerSave = true) {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;
  if (on) {
    sidebar.style.width = '52px';
    sidebar.querySelectorAll('.nav-section-label, .nbadge').forEach(e => e.style.display = 'none');
    sidebar.querySelectorAll('.nav-item').forEach(e => {
      e.style.justifyContent = 'center';
      e.childNodes.forEach(n => {
        if (n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0) {
          n._hidden = n.textContent;
          n.textContent = '';
        }
      });
    });
  } else {
    sidebar.style.width = 'var(--sidebar-w)';
    sidebar.querySelectorAll('.nav-section-label, .nbadge').forEach(e => e.style.display = '');
    sidebar.querySelectorAll('.nav-item').forEach(e => {
      e.style.justifyContent = '';
      e.childNodes.forEach(n => {
        if (n.nodeType === Node.TEXT_NODE && n._hidden) {
          n.textContent = n._hidden;
          delete n._hidden;
        }
      });
    });
  }
  if (triggerSave) saveSettings();
}

/** NEW: Reattach sidebar to the opposite side of the viewport */
function applySidebarPos(pos, triggerSave = true) {
  const sidebar = document.querySelector('.sidebar');
  const main    = document.querySelector('.main-content');
  if (sidebar) sidebar.setAttribute('data-pos', pos);
  if (main)    main.setAttribute('data-sidebar-pos', pos);
  if (triggerSave) { saveSettings(); toast('Sidebar moved to ' + pos, 'info'); }
}

/** NEW: Switch dashboard widget container layout mode */
function applyDashLayout(mode, triggerSave = true) {
  const dash = document.querySelector('.dashboard');
  if (dash) dash.setAttribute('data-layout', mode);
  if (triggerSave) { saveSettings(); toast('Layout: ' + mode, 'info'); }
}

// ── Data & Telemetry ─────────────────────────────────────

/** NEW: Change chart render style (line / bar / area) */
function applyChartType(type, triggerSave = true) {
  if (typeof window.onChartTypeChange === 'function') window.onChartTypeChange(type);
  if (triggerSave) { saveSettings(); toast('Chart type: ' + type, 'info'); }
}

/** NEW: Toggle bezier smoothing on chart datasets */
function applyChartSmoothing(on, triggerSave = true) {
  if (typeof window.onChartSmoothingChange === 'function') window.onChartSmoothingChange(on);
  const lbl = document.getElementById('sett-smooth-lbl');
  if (lbl) lbl.textContent = on ? 'ON' : 'OFF';
  if (triggerSave) saveSettings();
}

// ── System & Advanced ────────────────────────────────────

/** NEW: Toggle GPU-accelerated canvas compositing */
function toggleHardwareAccel(on, triggerSave = true) {
  const canvas = document.getElementById('leaf-canvas');
  if (canvas) canvas.style.willChange = on ? 'transform' : 'auto';
  const lbl = document.getElementById('sett-hw-accel-lbl');
  if (lbl) lbl.textContent = on ? 'ON' : 'OFF';
  if (triggerSave) { saveSettings(); toast('Hardware acceleration ' + (on ? 'on' : 'off'), 'info'); }
}

/** NEW: Toggle developer diagnostics overlay */
function toggleDevMode(on, triggerSave = true) {
  document.documentElement.classList.toggle('dev-mode', on);
  const lbl = document.getElementById('sett-dev-lbl');
  if (lbl) lbl.textContent = on ? 'ON' : 'OFF';
  if (triggerSave) { saveSettings(); toast('Dev mode ' + (on ? 'enabled' : 'disabled'), on ? 'warning' : 'info'); }
}

/** NEW: Wipe all stored preferences and reload with defaults */
function resetAllSettings() {
  if (!confirm('Reset all settings to factory defaults?')) return;
  localStorage.removeItem(SETTINGS_KEY);
  toast('Settings reset. Reloading…', 'warning');
  setTimeout(() => location.reload(), 1200);
}

/** NEW: Export current settings as a downloadable JSON config file */
function exportSettings() {
  const blob = new Blob([localStorage.getItem(SETTINGS_KEY) || '{}'], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'kushos-settings.json';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Settings exported', 'success');
}

/** NEW: Import a previously exported JSON config file */
function importSettings(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      JSON.parse(e.target.result); // Validate JSON before committing
      localStorage.setItem(SETTINGS_KEY, e.target.result);
      toast('Settings imported. Reloading…', 'success');
      setTimeout(() => location.reload(), 1200);
    } catch (err) {
      toast('Invalid settings file', 'error');
    }
  };
  reader.readAsText(file);
}

// ══════════════════════════════════════════════════════════
// LIFECYCLE EVENT BINDING INITIALIZATIONS
// ══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

  // ── Simple Toggle Checkboxes ────────────────────────────

  const toggleMap = [
    { id: 'sett-glow',       fn: (checked) => {
        const lbl = document.getElementById('sett-glow-lbl');
        if (lbl) lbl.textContent = checked ? 'ON' : 'OFF';
        const glow = document.getElementById('leaf-glow');
        if (glow) glow.style.display = checked ? 'block' : 'none';
        saveSettings();
    }},
    { id: 'sett-scanlines',  fn: (checked) => setScanlines(checked) },
    { id: 'sett-autorefresh',fn: (checked) => toggleAutoRefresh(checked) },
    { id: 'sett-sound',      fn: ()         => saveSettings() },
    { id: 'sett-compact',    fn: (checked) => toggleCompactSidebar(checked) },
    { id: 'sett-smoothing',  fn: (checked) => applyChartSmoothing(checked) },
    { id: 'sett-hw-accel',   fn: (checked) => toggleHardwareAccel(checked) },
    { id: 'sett-dev-mode',   fn: (checked) => toggleDevMode(checked) },
    { id: 'sett-notif-email',fn: ()         => saveSettings() },
    { id: 'sett-notif-push', fn: ()         => saveSettings() },
  ];

  toggleMap.forEach(({ id, fn }) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', function() { fn(this.checked); });
  });

  // ── Select Dropdowns ────────────────────────────────────

  const selectMap = [
    { id: 'sett-units',          fn: (v) => applyUnits(v) },
    { id: 'sett-theme',          fn: (v) => applyTheme(v) },
    { id: 'sett-sidebar-pos',    fn: (v) => applySidebarPos(v) },
    { id: 'sett-dash-layout',    fn: (v) => applyDashLayout(v) },
    { id: 'sett-chart-type',     fn: (v) => applyChartType(v) },
    { id: 'sett-timezone',       fn: ()  => saveSettings() },
    { id: 'sett-date-format',    fn: ()  => saveSettings() },
    { id: 'sett-log-level',      fn: ()  => saveSettings() },
    { id: 'sett-notif-silence',  fn: ()  => saveSettings() },
  ];

  selectMap.forEach(({ id, fn }) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', function() { fn(this.value); });
  });

  // ── Range Sliders ───────────────────────────────────────
  // input  → live label update + immediate visual effect
  // change → commits to localStorage on mouse release

  const sliders = [
    // Appearance
    { id: 'sett-opacity',      valId: 'sett-opacity-val',    suffix: '%',    fn: (v) => { const c = document.getElementById('leaf-canvas'); if (c) c.style.opacity = v / 100; } },
    { id: 'sett-font-scale',   valId: 'sett-font-scale-val', suffix: '%',    fn: (v) => applyFontScale(v, false) },
    { id: 'sett-border-radius',valId: 'sett-radius-val',     suffix: 'px',   fn: (v) => applyBorderRadius(v, false) },
    { id: 'sett-anim-speed',   valId: 'sett-anim-speed-val', suffix: 'x',    fn: (v) => applyAnimSpeed(v, false) },
    // Telemetry
    { id: 'sett-chart-speed',  valId: 'sett-cs-val',         suffix: 's',    fn: (v) => { if (typeof setChartSpeed === 'function') setChartSpeed(+v); }, transform: (v) => (v / 1000).toFixed(1) },
    { id: 'sett-refresh-rate', valId: 'sett-rr-val',         suffix: 's',    fn: null, transform: (v) => (v / 1000).toFixed(0) },
    { id: 'sett-data-points',  valId: 'sett-dp-val',         suffix: ' pts', fn: (v) => { if (typeof setDataPointWindow === 'function') setDataPointWindow(+v); } },
    // Thresholds
    { id: 'sett-temp-alert',   valId: 'sett-temp-val',       suffix: '°C',   fn: null },
    { id: 'sett-rh-alert',     valId: 'sett-rh-val',         suffix: '%',    fn: null },
    { id: 'sett-co2-alert',    valId: 'sett-co2-val',        suffix: ' ppm', fn: null },
    { id: 'sett-vpd-alert',    valId: 'sett-vpd-val',        suffix: ' kPa', fn: null },
    { id: 'sett-light-alert',  valId: 'sett-light-val',      suffix: ' µmol',fn: null },
    { id: 'sett-ec-alert',     valId: 'sett-ec-val',         suffix: ' mS',  fn: null },
    { id: 'sett-ph-low',       valId: 'sett-ph-low-val',     suffix: ' pH',  fn: null },
    { id: 'sett-ph-high',      valId: 'sett-ph-high-val',    suffix: ' pH',  fn: null },
    // Audio
    { id: 'sett-sound-volume', valId: 'sett-vol-val',        suffix: '%',    fn: null },
  ];

  sliders.forEach(slider => {
    const el = document.getElementById(slider.id);
    if (el) {
      el.addEventListener('input', function() {
        const outputVal = slider.transform ? slider.transform(this.value) : this.value;
        const targetLabel = document.getElementById(slider.valId);
        if (targetLabel) targetLabel.textContent = outputVal + slider.suffix;
        if (slider.fn) slider.fn(this.value);
      });
      el.addEventListener('change', saveSettings);
    }
  });

  // ── Utility Buttons ─────────────────────────────────────

  const resetBtn = document.getElementById('sett-reset-all');
  if (resetBtn) resetBtn.addEventListener('click', resetAllSettings);

  const exportBtn = document.getElementById('sett-export');
  if (exportBtn) exportBtn.addEventListener('click', exportSettings);

  const importInput = document.getElementById('sett-import-file');
  if (importInput) importInput.addEventListener('change', function() { importSettings(this.files[0]); });

  // ── Restore Persisted State ─────────────────────────────
  restoreSettings();
  if (typeof restoreGlobalSettings === 'function') restoreGlobalSettings();
});

window.addEventListener('load', () => {
  console.log('KushOS Pro v3.1 System Settings Module Initialized (Patched v2 — Full Surface).');
});

// ══════════════════════════════════════════════════════════
// FACILITY SETTINGS (from settings.js v2)
// ══════════════════════════════════════════════════════════

const SETTINGS_STORAGE_KEY = 'kushos_facility_settings';

function saveGlobalSettings() {
  const settings = {
    tempUnit:      document.getElementById('set-temp-unit')?.value,
    weightUnit:    document.getElementById('set-weight-unit')?.value,
    facilityName:  document.getElementById('set-facility-name')?.value,
    cryptoExpiry:  document.getElementById('set-crypto-expiry')?.value,
    rhMaxFlower:   document.getElementById('set-rh-max-flower')?.value,
    tempMin:       document.getElementById('set-temp-min')?.value,
    tempMax:       document.getElementById('set-temp-max')?.value,
    vpdThreshold:  document.getElementById('set-vpd-threshold')?.value,
  };
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    toast('Facility settings saved', 'success');
    if (typeof window.onUnitsChange === 'function') {
      window.onUnitsChange(settings.tempUnit === 'F' ? 'imperial' : 'metric');
    }
  } catch (e) {
    toast('Failed to save settings', 'error');
  }
}

function restoreGlobalSettings() {
  let s;
  try { s = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)); } catch (e) {}
  if (!s) return;
  const map = {
    'set-temp-unit':     s.tempUnit,
    'set-weight-unit':   s.weightUnit,
    'set-facility-name': s.facilityName,
    'set-crypto-expiry': s.cryptoExpiry,
    'set-rh-max-flower': s.rhMaxFlower,
    'set-temp-min':      s.tempMin,
    'set-temp-max':      s.tempMax,
    'set-vpd-threshold': s.vpdThreshold,
  };
  Object.entries(map).forEach(([id, val]) => {
    if (val == null) return;
    const el = document.getElementById(id);
    if (el) el.value = val;
  });
}

function purgeLocalCacheSession() {
  if (typeof lockCryptoSession === 'function') lockCryptoSession();
  if (typeof updateCryptoLockUI === 'function') updateCryptoLockUI();
  toast('Encryption key wiped from memory', 'success');
}

function showCryptoStatus() {
  const ready = typeof isCryptoReady === 'function' && isCryptoReady();
  toast(
    ready ? '🔐 Passphrase active — data will be encrypted on save' : '🔓 No passphrase set — data stored unencrypted',
    ready ? 'success' : 'info'
  );
}

function exportEncryptedPayloadJSON() {
  try {
    const payload = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      payload[k] = localStorage.getItem(k);
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'kushos-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Backup exported', 'success');
  } catch (e) {
    toast('Export failed: ' + e.message, 'error');
  }
}

function triggerSystemDiagnosticsCheck() {
  const checks = [
    { label: 'Supabase client',      pass: typeof sb !== 'undefined' && sb !== null },
    { label: 'Crypto API',           pass: typeof crypto !== 'undefined' && !!crypto.subtle },
    { label: 'Crypto key loaded',    pass: typeof isCryptoReady === 'function' && isCryptoReady() },
    { label: 'Demo mode',            pass: typeof DEMO_MODE !== 'undefined' && DEMO_MODE === false },
    { label: 'Current user session', pass: typeof currentUser !== 'undefined' && currentUser !== null },
    { label: 'localStorage',         pass: (function() { try { localStorage.setItem('_t','1'); localStorage.removeItem('_t'); return true; } catch { return false; } })() },
  ];
  const failing = checks.filter(c => !c.pass).map(c => c.label);
  if (failing.length === 0) {
    toast(`✅ Diagnostics passed (${checks.length}/${checks.length})`, 'success');
  } else {
    toast(`⚠ ${failing.length} check(s) failed: ${failing.join(', ')}`, 'error');
  }
  console.table(checks.map(c => ({ Check: c.label, Status: c.pass ? '✅ PASS' : '❌ FAIL' })));
}
