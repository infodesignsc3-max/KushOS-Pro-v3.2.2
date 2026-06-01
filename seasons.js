// ══════════════════════════════════════════════════════════
// SEASONS  — unlimited, user-managed grow seasons
// Table: grow_seasons
//   id uuid PK, name text, number int, start_date date,
//   end_date date, active bool, notes text, created_at
// ══════════════════════════════════════════════════════════

var currentSeason = null;
var allSeasons    = [];

// ── Load all seasons and set currentSeason ─────────────────
async function loadSeasons() {
  if (typeof DEMO_MODE !== 'undefined' && DEMO_MODE) {
    allSeasons    = (typeof DEMO_DATA !== 'undefined' && DEMO_DATA.seasons) ? DEMO_DATA.seasons : [];
    currentSeason = allSeasons.find(s => s.active) || allSeasons[allSeasons.length - 1] || null;
    updateSeasonChip();
    populateSeasonSelects();
    return;
  }
  if (!sb) return;
  const { data, error } = await sb
    .from('grow_seasons')
    .select('*')
    .order('number', { ascending: false });
  if (error) { console.warn('loadSeasons error:', error.message); return; }
  allSeasons    = data || [];
  currentSeason = allSeasons.find(s => s.active) || allSeasons[0] || null;
  updateSeasonChip();
  populateSeasonSelects();
}

// ── Topbar chip ────────────────────────────────────────────
function updateSeasonChip() {
  const chip = document.getElementById('season-chip');
  if (!chip) return;
  if (currentSeason) {
    chip.textContent = `🌱 Season ${currentSeason.number}`;
    chip.title       = currentSeason.name || '';
  } else {
    chip.textContent = '🌱 No Season';
    chip.title       = 'Add a season in Settings';
  }
  chip.onclick = () => openSeasonManager();
}

// ── Populate every <select> that needs seasons ─────────────
function populateSeasonSelects() {
  const opts = allSeasons.map(s =>
    `<option value="${s.id}">${s.name || 'Season ' + s.number}${s.active ? ' ✓' : ''}</option>`
  ).join('');
  ['analytics-season-filter', 'g-season', 'h-season'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const prev = el.value;
    el.innerHTML = '<option value="">All Seasons</option>' + opts;
    if (prev) el.value = prev;
  });
}

// ── Open the season manager modal ─────────────────────────
function openSeasonManager() {
  renderSeasonList();
  openModal('modal-seasons');
}

function renderSeasonList() {
  const wrap = document.getElementById('seasons-list');
  if (!wrap) return;
  if (!allSeasons.length) {
    wrap.innerHTML = '<div class="empty">No seasons yet. Create your first season below.</div>';
    return;
  }
  wrap.innerHTML = allSeasons.map(s => `
    <div class="season-row" id="season-row-${s.id}">
      <div class="season-row-info">
        <span class="season-row-name">${s.name || 'Season ' + s.number}</span>
        <span class="badge ${s.active ? 'badge-green' : 'badge-gray'}">${s.active ? 'Active' : 'Archived'}</span>
        <span style="color:var(--text3);font-size:10px;font-family:var(--font-mono);">
          ${s.start_date || '─'} → ${s.end_date || 'ongoing'}
        </span>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0;">
        ${!s.active ? `<button class="btn btn-ghost btn-sm" onclick="setActiveSeason('${s.id}')">Set Active</button>` : ''}
        <button class="btn btn-ghost btn-sm" onclick="editSeasonInline('${s.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteSeason('${s.id}')">Del</button>
      </div>
    </div>`).join('');
}

// ── Inline edit within the season list ────────────────────
function editSeasonInline(id) {
  const s = allSeasons.find(x => x.id === id);
  if (!s) return;
  document.getElementById('season-form-id').value         = id;
  document.getElementById('season-form-name').value       = s.name || '';
  document.getElementById('season-form-number').value     = s.number || '';
  document.getElementById('season-form-start').value      = s.start_date || '';
  document.getElementById('season-form-end').value        = s.end_date || '';
  document.getElementById('season-form-active').value     = String(s.active);
  document.getElementById('season-form-notes').value      = s.notes || '';
  document.getElementById('season-form-title').textContent = 'Edit Season';
  document.getElementById('season-form-wrap').style.display = 'block';
}

function newSeasonForm() {
  document.getElementById('season-form-id').value     = '';
  document.getElementById('season-form-name').value   = `Season ${allSeasons.length + 1}`;
  document.getElementById('season-form-number').value = allSeasons.length + 1;
  document.getElementById('season-form-start').value  = new Date().toISOString().slice(0, 10);
  document.getElementById('season-form-end').value    = '';
  document.getElementById('season-form-active').value = 'false';
  document.getElementById('season-form-notes').value  = '';
  document.getElementById('season-form-title').textContent = 'New Season';
  document.getElementById('season-form-wrap').style.display = 'block';
}

async function saveSeason() {
  const id     = document.getElementById('season-form-id').value;
  const name   = document.getElementById('season-form-name').value.trim();
  const number = parseInt(document.getElementById('season-form-number').value);
  if (!name || isNaN(number)) { toast('Name and season number are required', 'error'); return; }
  const row = {
    name,
    number,
    start_date: document.getElementById('season-form-start').value || null,
    end_date:   document.getElementById('season-form-end').value   || null,
    active:     document.getElementById('season-form-active').value === 'true',
    notes:      document.getElementById('season-form-notes').value.trim() || null,
  };
  if (!sb) { toast('Connect Supabase first', 'error'); return; }
  let err;
  if (id) { ({ error: err } = await sb.from('grow_seasons').update(row).eq('id', id)); }
  else     { ({ error: err } = await sb.from('grow_seasons').insert(row)); }
  if (err) { toast(err.message, 'error'); return; }
  toast(id ? 'Season updated' : 'Season created', 'success');
  document.getElementById('season-form-wrap').style.display = 'none';
  await loadSeasons();
  renderSeasonList();
}

async function setActiveSeason(id) {
  if (!sb) return;
  // Deactivate all, then activate the chosen one
  await sb.from('grow_seasons').update({ active: false }).neq('id', id);
  const { error } = await sb.from('grow_seasons').update({ active: true }).eq('id', id);
  if (error) { toast(error.message, 'error'); return; }
  toast('Active season updated', 'success');
  await loadSeasons();
  renderSeasonList();
}

async function deleteSeason(id) {
  if (!sb) return;
  if (!confirm('Delete this season? This will NOT delete your grow records.')) return;
  const { error } = await sb.from('grow_seasons').delete().eq('id', id);
  if (error) { toast(error.message, 'error'); return; }
  toast('Season deleted', 'success');
  await loadSeasons();
  renderSeasonList();
}

document.addEventListener('DOMContentLoaded', loadSeasons);
