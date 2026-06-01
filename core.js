// ══════════════════════════════════════════════════════════
// GLOBALS
// ══════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════
// MODULE SWITCHING
// ══════════════════════════════════════════════════════════
function switchModule(id, btn) {
  document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
  const mod = document.getElementById('module-' + id);
  if (mod) mod.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navBtn = btn || document.getElementById('nav-' + id);
  if (navBtn) navBtn.classList.add('active');

  // Load data
  switch(id) {
    case 'grows':       loadGrows(); break;
    case 'nutrients':   loadFeedBatches(); loadFeedLogs(); break;
    case 'harvests':    loadHarvests(); break;
    case 'strains':     loadStrains(); break;
    case 'tasks':       loadTasks(); break;
    case 'rooms':       loadRooms(); break;
    case 'users':       if (currentUser && currentUser.role === 'admin') loadUsers(); break;
    case 'schedule':    renderMiniCalendar(); break;
    case 'dashboard':   loadDashboard(); break;
    case 'analytics':   loadDashboard(); populateSeasonSelects(); break;
    case 'inventory':   /* placeholder — no backend table yet */ break;
    case 'sales':       /* placeholder */ break;
    case 'compliance':  /* placeholder */ break;
    case 'reports':     /* placeholder */ break;
  }
}

// ══════════════════════════════════════════════════════════
// REALTIME
// ══════════════════════════════════════════════════════════
function setupRealtime() {
  if (!sb) return;
  if (realtimeSubs.length > 0) return;   ← NEW LINE
  const badge = document.getElementById('rt-badge');
  const srtEl = document.getElementById('sett-rt');

  const channel = sb.channel('kushos-rt')
    .on('postgres_changes', { event:'*', schema:'public', table:'grows' }, () => {
      if (document.getElementById('module-grows').classList.contains('active')) loadGrows();
    })
    .on('postgres_changes', { event:'*', schema:'public', table:'tasks' }, () => {
      if (document.getElementById('module-tasks').classList.contains('active')) loadTasks();
    })
    .subscribe(status => {
      const live = status === 'SUBSCRIBED';
      if (badge) badge.classList.toggle('live', live);
      if (label) label.textContent = live ? 'LIVE' : status.slice(0, 8);
      if (srtEl) {
        srtEl.textContent = live ? 'Connected' : 'Connecting…';
        srtEl.className = 'badge ' + (live ? 'badge-green' : 'badge-amber');
      }
    });

  realtimeSubs.push(channel);
}

// ══════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════
function fmtN(v, unit='', decimals=1) {
  if (v === null || v === undefined || v === '') return '─';
  return Number(v).toFixed(decimals) + (unit ? ' ' + unit : '');
}
function fmtDt(iso) {
  if (!iso) return '─';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short' }) + ' ' + d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
}
function parseOrNull(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = parseFloat(v); return isNaN(n) ? null : n;
}
function phColor(ph) { if (!ph) return ''; if (ph < 5.5 || ph > 7.0) return 'color:var(--red-l)'; if (ph < 5.8 || ph > 6.8) return 'color:var(--amber-l)'; return 'color:var(--g8)'; }
function vpdColor(vpd) { if (!vpd) return ''; if (vpd < 0.4 || vpd > 1.6) return 'color:var(--red-l)'; if (vpd < 0.8 || vpd > 1.4) return 'color:var(--amber-l)'; return 'color:var(--g8)'; }
function vpdStatus(vpd) { if (!vpd) return ''; if (vpd < 0.4 || vpd > 1.6) return 'red'; if (vpd < 0.8 || vpd > 1.4) return 'amber'; return ''; }
function healthColor(h) { const m = { Excellent:'var(--g8)', Good:'var(--g8)', Monitor:'var(--amber-l)', Alert:'var(--red-l)' }; return m[h] ? 'color:' + m[h] : ''; }
function stageBadge(s) { const m = { Seedling:'badge-green', Vegetative:'badge-green', Flowering:'badge-amber', Drying:'badge-blue', Curing:'badge-purple', Complete:'badge-gray' }; return `<span class="badge ${m[s]||'badge-gray'}">${s}</span>`; }
function gradeBadge(g) { const m = { AAA:'badge-gold', AA:'badge-green', A:'badge-amber', Trim:'badge-gray' }; return `<span class="badge ${m[g]||'badge-gray'}">${g||'─'}</span>`; }
function typeBadge(t) { const m = { Indica:'badge-purple', Sativa:'badge-green', Hybrid:'badge-amber', Ruderalis:'badge-gray' }; return `<span class="badge ${m[t]||'badge-gray'}">${t}</span>`; }
function updateDatalist(id, vals) { const dl = document.getElementById(id); if (!dl) return; dl.innerHTML = vals.map(v => `<option value="${v}">`).join(''); }
function populateBatchSelects() {
  const opts = allGrows.map(g => `<option value="${g.batch_id}">${g.batch_id} — ${g.strain}</option>`).join('');
  ['f-batch','t-batch'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = '<option value="">Select batch…</option>' + opts; });
}
// updateSeasonChip is defined in seasons.js — stub here prevents crashes if called before seasons load
function updateSeasonChip() {
  if (typeof currentSeason !== 'undefined' && currentSeason) {
    const chip = document.getElementById('season-chip');
    if (chip) { chip.textContent = `🌱 Season ${currentSeason.number}`; chip.onclick = () => openSeasonManager(); }
  }
}
