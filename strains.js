// ══════════════════════════════════════════════════════════
// STRAINS — Genetic library (STUB / GENERATED)
// ══════════════════════════════════════════════════════════

async function loadStrains() {
  const tbody = document.getElementById('strains-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" class="loading">Loading genetic register…</td></tr>';

  if (DEMO_MODE) { return loadDemoStrains(); }
  if (!sb) { tbody.innerHTML = '<tr><td colspan="6" class="empty">Connect Supabase to see strains</td></tr>'; return; }

  const { data, error } = await sb.from('strains').select('*').order('name');
  if (error) { tbody.innerHTML = `<tr><td colspan="6" style="color:var(--red-l);padding:12px;">${error.message}</td></tr>`; return; }

  if (!data || !data.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty">No strains registered</td></tr>'; return; }
  tbody.innerHTML = data.map(s => renderStrainRow(s, false)).join('');
  updateDatalist('strain-list', data.map(s => s.name));
}

function loadDemoStrains() {
  const tbody = document.getElementById('strains-tbody');
  if (!tbody) return;
  const data = DEMO_DATA.strains || [];
  if (!data.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty">No strains registered</td></tr>'; return; }
  tbody.innerHTML = data.map(s => renderStrainRow(s, true)).join('');
  updateDatalist('strain-list', data.map(s => s.name));
}

function renderStrainRow(s, demo = false) {
  const delBtn = demo
    ? `<button class="btn btn-danger btn-sm" onclick="toast('Demo mode — changes not saved','info')">Del</button>`
    : `<button class="btn btn-danger btn-sm" onclick="confirmDelete('strains','${s.id}',loadStrains)">Del</button>`;
  return `
    <tr>
      <td><strong>${s.name || '─'}</strong><br><span style="font-size:10px;color:var(--text3);">${s.lineage || ''}</span></td>
      <td>${typeBadge ? typeBadge(s.type) : s.type || '─'}</td>
      <td class="mono">${s.flower_days ? s.flower_days + ' days' : '─'}</td>
      <td class="mono">${s.avg_yield_g ? s.avg_yield_g + 'g' : '─'} / ${s.thc_pct ? s.thc_pct + '% THC' : '─'}</td>
      <td>${s.difficulty || '─'}</td>
      <td><div class="td-actions">${delBtn}</div></td>
    </tr>`;
}

async function saveStrain() {
  if (DEMO_MODE) { toast('Demo mode — changes not saved', 'info'); closeModal('modal-strain'); return; }
  toast('Strain save — connect Supabase to enable', 'info');
  closeModal('modal-strain');
}
