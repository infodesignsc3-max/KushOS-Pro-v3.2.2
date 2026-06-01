// ══════════════════════════════════════════════════════════
// GROWS — zero-knowledge encrypted fields
// ══════════════════════════════════════════════════════════
//
// ENCRYPTED FIELDS (freeform text, stored as AES-GCM ciphertext):
//   notes
//
// PLAINTEXT FIELDS (structured data needed for RLS / analytics):
//   batch_id, strain, room, plant_count, grow_medium,
//   light_schedule, stage, stage_day, stage_target,
//   health, start_date, season_id, user_id
//
// ENCRYPTION GUARD:
//   Saves are blocked if cryptoKey is null.
//   Loads show "[encrypted]" if cryptoKey is null — no crash.
// ══════════════════════════════════════════════════════════

// ── Decrypt a single grow row in-place ────────────────────
async function _decryptGrow(g) {
  if (!isCryptoReady()) return g;
  const out = { ...g };
  try { out.notes = g.notes ? await decryptData(g.notes, cryptoKey) : null; } catch { out.notes = '[encrypted]'; }
  return out;
}

// ── Encrypt the freeform fields of a row object ───────────
async function _encryptGrowRow(row) {
  if (!isCryptoReady()) throw new Error('Encryption key not ready — re-enter your passphrase');
  return {
    ...row,
    notes: row.notes ? await encryptData(row.notes, cryptoKey) : null,
  };
}

// ══════════════════════════════════════════════════════════
async function loadGrows() {
  const grid = document.getElementById('grows-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading">Loading batches…</div>';
  if (DEMO_MODE) { return loadDemoGrows(); }
  if (!sb) { grid.innerHTML = '<div class="empty">Connect Supabase to see grows</div>'; return; }

  const { data, error } = await sb.from('grows').select('*').order('created_at', { ascending: false });
  if (error) { grid.innerHTML = `<div class="empty">${error.message}</div>`; return; }

  // Decrypt all rows in parallel
  allGrows = data ? await Promise.all(data.map(_decryptGrow)) : [];

  const growsCount = document.getElementById('grows-count');
  if (growsCount) growsCount.textContent = allGrows.length || '0';
  updateDatalist('batch-list', allGrows.map(g => g.batch_id));
  updateDatalist('strain-list', [...new Set(allGrows.map(g => g.strain))]);
  populateBatchSelects();

  if (!allGrows.length) {
    grid.innerHTML = '<div class="empty">No batches found. Create your first grow.</div>';
    return;
  }

  grid.innerHTML = allGrows.map(g => {
    const pct = g.stage_target ? Math.min(100, Math.round(g.stage_day / g.stage_target * 100)) : null;
    return `<div class="grow-card">
      <div class="grow-card-top">
        <div><div class="grow-card-strain">${sanitize(g.strain)}</div><div class="grow-card-id">${sanitize(g.batch_id)} · ${sanitize(g.room)}</div></div>
        ${stageBadge(g.stage)}
      </div>
      ${pct !== null ? `<div><div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span style="font-size:10px;color:var(--text3);">Day ${g.stage_day} of ${g.stage_target}</span><span class="mono" style="font-size:10px;color:var(--g8);">${pct}%</span></div><div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div></div>` : ''}
      <div class="grow-card-metrics">
        <div><div class="grow-metric-label">Plants</div><div class="grow-metric-value">${g.plant_count}</div></div>
        <div><div class="grow-metric-label">Medium</div><div class="grow-metric-value">${sanitize(g.grow_medium)||'─'}</div></div>
        <div><div class="grow-metric-label">Light</div><div class="grow-metric-value">${sanitize(g.light_schedule)||'─'}</div></div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <span class="badge ${g.health==='Alert'?'badge-red':g.health==='Monitor'?'badge-amber':'badge-green'}">${sanitize(g.health)||'Good'}</span>
        ${g.start_date ? `<span class="badge badge-gray">Since ${g.start_date}</span>` : ''}
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-ghost btn-sm" onclick="editGrow('${g.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="confirmDelete('grows','${g.id}',loadGrows)">Delete</button>
      </div>
    </div>`;
  }).join('');
}

async function editGrow(id) {
  // Use already-decrypted copy from allGrows if available
  let g = allGrows.find(x => x.id === id);
  if (!g && sb) {
    const { data } = await sb.from('grows').select('*').eq('id', id).single();
    g = data ? await _decryptGrow(data) : null;
  }
  if (!g) return;
  document.getElementById('modal-grow-title').textContent = 'Edit Batch';
  document.getElementById('grow-id').value = id;
  const keys = ['batch_id','strain','room','plant_count','grow_medium','light_schedule','stage','stage_day','stage_target','health','start_date','notes'];
  ['g-batch','g-strain','g-room','g-plants','g-medium','g-light','g-stage','g-day','g-target','g-health','g-start','g-notes'].forEach((fid, i) => {
    const el = document.getElementById(fid);
    if (el) el.value = g[keys[i]] || '';
  });
  openModal('modal-grow');
}

async function saveGrow() {
  if (DEMO_MODE) { toast('Demo mode — changes not saved', 'info'); closeModal('modal-grow'); return; }
  if (!currentUser?.id) { toast('Not authenticated', 'error'); return; }
  if (!isCryptoReady()) { toast('Encryption key not ready — re-enter your passphrase first', 'error'); return; }

  const id = document.getElementById('grow-id').value;
  const plainRow = {
    batch_id:       document.getElementById('g-batch').value.trim(),
    strain:         document.getElementById('g-strain').value.trim(),
    room:           document.getElementById('g-room').value.trim(),
    plant_count:    parseOrNull(document.getElementById('g-plants').value),
    grow_medium:    document.getElementById('g-medium').value || null,
    light_schedule: document.getElementById('g-light').value || null,
    stage:          document.getElementById('g-stage').value,
    stage_day:      parseOrNull(document.getElementById('g-day').value) || 1,
    stage_target:   parseOrNull(document.getElementById('g-target').value),
    health:         document.getElementById('g-health').value,
    start_date:     document.getElementById('g-start').value || null,
    season_id:      document.getElementById('g-season')?.value || null,
    notes:          document.getElementById('g-notes').value.trim() || null,
    user_id:        currentUser.id,
  };

  if (!plainRow.batch_id || !plainRow.strain || !plainRow.room) {
    toast('Batch ID, strain, and room are required', 'error');
    return;
  }
  if (!sb) { toast('Connect Supabase first', 'error'); return; }

  let row;
  try {
    row = await _encryptGrowRow(plainRow);
  } catch (e) {
    toast(e.message, 'error');
    return;
  }

  let err;
  if (id) {
    ({ error: err } = await sb.from('grows').update(row).eq('id', id));
  } else {
    ({ error: err } = await sb.from('grows').insert(row));
  }
  if (err) { toast(err.message, 'error'); return; }
  toast(id ? 'Batch updated' : 'Batch created', 'success');
  closeModal('modal-grow');
  loadGrows();
}

// ── DEMO MODE ─────────────────────────────────────────────
function loadDemoGrows() {
  const grid = document.getElementById('grows-grid');
  if (!grid) return;
  allGrows = DEMO_DATA.grows;
  const growsCount = document.getElementById('grows-count');
  if (growsCount) growsCount.textContent = allGrows.length || '0';
  updateDatalist('batch-list', allGrows.map(g => g.batch_id));
  updateDatalist('strain-list', [...new Set(allGrows.map(g => g.strain))]);
  populateBatchSelects();

  grid.innerHTML = allGrows.map(g => {
    const pct = g.stage_target ? Math.min(100, Math.round(g.stage_day / g.stage_target * 100)) : null;
    return `<div class="grow-card">
      <div class="grow-card-top">
        <div><div class="grow-card-strain">${sanitize(g.strain)}</div><div class="grow-card-id">${sanitize(g.batch_id)} · ${sanitize(g.room)}</div></div>
        ${stageBadge(g.stage)}
      </div>
      ${pct !== null ? `<div><div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span style="font-size:10px;color:var(--text3);">Day ${g.stage_day} of ${g.stage_target}</span><span class="mono" style="font-size:10px;color:var(--g8);">${pct}%</span></div><div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div></div>` : ''}
      <div class="grow-card-metrics">
        <div><div class="grow-metric-label">Plants</div><div class="grow-metric-value">${g.plant_count}</div></div>
        <div><div class="grow-metric-label">Medium</div><div class="grow-metric-value">${sanitize(g.grow_medium)||'─'}</div></div>
        <div><div class="grow-metric-label">Light</div><div class="grow-metric-value">${sanitize(g.light_schedule)||'─'}</div></div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <span class="badge ${g.health==='Alert'?'badge-red':g.health==='Monitor'?'badge-amber':'badge-green'}">${sanitize(g.health)||'Good'}</span>
        ${g.start_date ? `<span class="badge badge-gray">Since ${g.start_date}</span>` : ''}
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-ghost btn-sm" onclick="editGrow('${g.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="toast('Demo mode — changes not saved','info')">Delete</button>
      </div>
    </div>`;
  }).join('');
}
