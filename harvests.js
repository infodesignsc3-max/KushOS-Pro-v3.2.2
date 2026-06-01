// ══════════════════════════════════════════════════════════
// HARVESTS — zero-knowledge encrypted fields
// ══════════════════════════════════════════════════════════
//
// ENCRYPTED FIELDS:
//   notes, lab_name, lab_report_url
//
// PLAINTEXT FIELDS (needed for RLS / analytics queries):
//   batch_id, strain, harvest_date, plant_count,
//   wet_weight_g, dry_weight_g, thc_pct, cbd_pct,
//   grade, lab_tested, user_id
// ══════════════════════════════════════════════════════════

async function _decryptHarvest(r) {
  if (!isCryptoReady()) return r;
  const out = { ...r };
  try { out.notes          = r.notes          ? await decryptData(r.notes,          cryptoKey) : null; } catch { out.notes          = '[encrypted]'; }
  try { out.lab_name       = r.lab_name       ? await decryptData(r.lab_name,       cryptoKey) : null; } catch { out.lab_name       = '[encrypted]'; }
  try { out.lab_report_url = r.lab_report_url ? await decryptData(r.lab_report_url, cryptoKey) : null; } catch { out.lab_report_url = '[encrypted]'; }
  return out;
}

async function _encryptHarvestRow(row) {
  if (!isCryptoReady()) throw new Error('Encryption key not ready — re-enter your passphrase');
  return {
    ...row,
    notes:          row.notes          ? await encryptData(row.notes,          cryptoKey) : null,
    lab_name:       row.lab_name       ? await encryptData(row.lab_name,       cryptoKey) : null,
    lab_report_url: row.lab_report_url ? await encryptData(row.lab_report_url, cryptoKey) : null,
  };
}

// ══════════════════════════════════════════════════════════
async function loadHarvests() {
  const tbody = document.getElementById('harvest-tbody'); if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="11" class="loading">Waiting for user data...</td></tr>';
  if (DEMO_MODE) { return loadDemoHarvests(); }
  if (!sb) { tbody.innerHTML = '<tr><td colspan="11" class="empty">Connect Supabase to see data</td></tr>'; return; }

  const { data, error } = await sb.from('harvests').select('*').order('harvest_date', { ascending: false });
  if (error) { tbody.innerHTML = `<tr><td colspan="11" style="color:var(--red-l);padding:12px;">${error.message}</td></tr>`; return; }

  // Decrypt all rows in parallel
  const rows = data ? await Promise.all(data.map(_decryptHarvest)) : [];

  if (rows.length) {
    const totalDry = data.reduce((a, h) => a + (h.dry_weight_g||0), 0);
    const totalWet = data.reduce((a, h) => a + (h.wet_weight_g||0), 0);
    const statsEl = document.getElementById('harvest-stats');
    if (statsEl) statsEl.innerHTML = `
      <div class="stat-card"><div class="stat-label">Total Harvests</div><div class="stat-value">${rows.length}</div></div>
      <div class="stat-card gold"><div class="stat-label">Total Dry Yield</div><div class="stat-value">${(totalDry/1000).toFixed(2)} kg</div></div>
      <div class="stat-card"><div class="stat-label">Avg g/Plant</div><div class="stat-value">${rows.length ? Math.round(data.reduce((a,h)=>a+(h.dry_weight_g||0)/(h.plant_count||1),0)/rows.length) : '─'}g</div></div>`;
  }
  if (!rows.length) { tbody.innerHTML = '<tr><td colspan="11" class="empty">No harvests recorded yet</td></tr>'; return; }
  tbody.innerHTML = rows.map(r => renderHarvestRow(r)).join('');
}

function renderHarvestRow(r) {
  return `
    <tr>
      <td class="mono" style="font-size:11px;">${r.harvest_date||'─'}</td>
      <td class="mono">${r.batch_id||'─'}</td>
      <td>${r.strain||'─'}</td>
      <td class="mono">${r.plant_count||'─'}</td>
      <td class="mono">${fmtN(r.wet_weight_g,'g',0)}</td>
      <td class="mono text-gold">${fmtN(r.dry_weight_g,'g',0)}</td>
      <td class="mono">${r.dry_weight_g&&r.plant_count ? Math.round(r.dry_weight_g/r.plant_count)+'g' : '─'}</td>
      <td class="mono">${r.thc_pct ? r.thc_pct+'%' : '─'}</td>
      <td>${gradeBadge(r.grade)}</td>
      <td>${r.lab_tested ? '<span class="badge badge-green">Tested</span>' : '<span class="badge badge-gray">No</span>'}</td>
      <td><div class="td-actions">
        <button class="btn btn-danger btn-sm" onclick="confirmDelete('harvests','${r.id}',loadHarvests)">Del</button>
      </div></td>
    </tr>`;
}

function loadDemoHarvests() {
  const tbody = document.getElementById('harvest-tbody');
  if (!tbody) return;
  const data = DEMO_DATA.harvests;
  const statsEl = document.getElementById('harvest-stats');
  if (statsEl && data.length) {
    const totalDry = data.reduce((a, h) => a + (h.dry_weight_g||0), 0);
    statsEl.innerHTML = `
      <div class="stat-card"><div class="stat-label">Total Harvests</div><div class="stat-value">${data.length}</div></div>
      <div class="stat-card gold"><div class="stat-label">Total Dry Yield</div><div class="stat-value">${(totalDry/1000).toFixed(2)} kg</div></div>
      <div class="stat-card"><div class="stat-label">Avg g/Plant</div><div class="stat-value">${Math.round(data.reduce((a,h)=>a+(h.dry_weight_g||0)/(h.plant_count||1),0)/data.length)}g</div></div>`;
  }
  if (!data.length) { tbody.innerHTML = '<tr><td colspan="11" class="empty">No harvests recorded yet</td></tr>'; return; }
  tbody.innerHTML = data.map(r => `
    <tr>
      <td class="mono" style="font-size:11px;">${r.harvest_date||'─'}</td>
      <td class="mono">${r.batch_id||'─'}</td>
      <td>${r.strain||'─'}</td>
      <td class="mono">${r.plant_count||'─'}</td>
      <td class="mono">${fmtN(r.wet_weight_g,'g',0)}</td>
      <td class="mono text-gold">${fmtN(r.dry_weight_g,'g',0)}</td>
      <td class="mono">${r.dry_weight_g&&r.plant_count ? Math.round(r.dry_weight_g/r.plant_count)+'g' : '─'}</td>
      <td class="mono">${r.thc_pct ? r.thc_pct+'%' : '─'}</td>
      <td>${gradeBadge(r.grade)}</td>
      <td>${r.lab_tested ? '<span class="badge badge-green">Tested</span>' : '<span class="badge badge-gray">No</span>'}</td>
      <td><div class="td-actions"><button class="btn btn-danger btn-sm" onclick="toast('Demo mode — changes not saved','info')">Del</button></div></td>
    </tr>`).join('');
}

async function saveHarvest() {
  if (DEMO_MODE) { toast('Demo mode — changes not saved', 'info'); closeModal('modal-harvest'); return; }
  if (!isCryptoReady()) { toast('Encryption key not ready — re-enter your passphrase first', 'error'); return; }

  const id = document.getElementById('harvest-id').value;
  const plainRow = {
    batch_id:       document.getElementById('h-batch').value.trim()||null,
    strain:         document.getElementById('h-strain').value.trim()||null,
    harvest_date:   document.getElementById('h-date').value||null,
    plant_count:    parseOrNull(document.getElementById('h-plants').value),
    wet_weight_g:   parseOrNull(document.getElementById('h-wet').value),
    dry_weight_g:   parseOrNull(document.getElementById('h-dry').value),
    thc_pct:        parseOrNull(document.getElementById('h-thc').value),
    cbd_pct:        parseOrNull(document.getElementById('h-cbd').value),
    grade:          document.getElementById('h-grade').value,
    lab_tested:     document.getElementById('h-lab').value==='true',
    lab_name:       document.getElementById('h-labname').value.trim()||null,
    lab_report_url: document.getElementById('h-laburl').value.trim()||null,
    notes:          document.getElementById('h-notes').value.trim()||null,
  };

  if (!plainRow.harvest_date || !plainRow.plant_count) { toast('Date and plant count required','error'); return; }
  if (!sb) { toast('Connect Supabase first','error'); return; }
  if (!currentUser?.id) { toast('Not authenticated','error'); return; }
  plainRow.user_id = currentUser.id;

  let row;
  try {
    row = await _encryptHarvestRow(plainRow);
  } catch (e) {
    toast(e.message, 'error');
    return;
  }

  let err;
  if (id) { ({ error:err } = await sb.from('harvests').update(row).eq('id', id)); }
  else     { ({ error:err } = await sb.from('harvests').insert(row)); }
  if (err) { toast(err.message,'error'); return; }
  toast('Harvest logged','success'); closeModal('modal-harvest'); loadHarvests();
}
