// ══════════════════════════════════════════════════════════
// FEED LOGS — zero-knowledge encrypted fields
// ══════════════════════════════════════════════════════════
//
// ENCRYPTED FIELDS:
//   nutrients  (freeform recipe text, e.g. "Flora Bloom:8, Cal-Mag:3")
//   notes
//
// PLAINTEXT FIELDS (needed for RLS / analytics):
//   batch_id, feed_week, ph_in, ph_runoff, ec_ms,
//   volume_l, logged_at, user_id
// ══════════════════════════════════════════════════════════

async function _decryptFeedLog(r) {
  if (!isCryptoReady()) return r;
  const out = { ...r };
  try { out.nutrients = r.nutrients ? await decryptData(r.nutrients, cryptoKey) : null; } catch { out.nutrients = '[encrypted]'; }
  try { out.notes     = r.notes     ? await decryptData(r.notes,     cryptoKey) : null; } catch { out.notes     = '[encrypted]'; }
  return out;
}

async function _encryptFeedRow(row) {
  if (!isCryptoReady()) throw new Error('Encryption key not ready — re-enter your passphrase');
  return {
    ...row,
    nutrients: row.nutrients ? await encryptData(row.nutrients, cryptoKey) : null,
    notes:     row.notes     ? await encryptData(row.notes,     cryptoKey) : null,
  };
}

// ══════════════════════════════════════════════════════════
async function loadFeedBatches() {
  const sel = document.getElementById('feed-batch-filter'); if (!sel) return;
  if (DEMO_MODE) {
    const opts = DEMO_DATA.grows.map(g => `<option value="${g.batch_id}">${g.batch_id}</option>`).join('');
    sel.innerHTML = '<option value="">All Batches</option>' + opts;
    return;
  }
  if (!sb) return;
  if (!allGrows.length) return;
  const opts = allGrows.map(g => `<option value="${g.batch_id}">${g.batch_id}</option>`).join('');
  sel.innerHTML = '<option value="">All Batches</option>' + opts;
}

async function loadFeedLogs() {
  const tbody = document.getElementById('feed-tbody'); if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="10" class="loading">Waiting for user data...</td></tr>';
  if (DEMO_MODE) { return loadDemoFeedLogs(); }
  if (!sb) { tbody.innerHTML = '<tr><td colspan="10" class="empty">Connect Supabase to see data</td></tr>'; return; }

  const filter = document.getElementById('feed-batch-filter')?.value;
  let q = sb.from('feed_logs').select('*').order('logged_at', { ascending: false }).limit(50);
  if (filter) q = q.eq('batch_id', filter);
  const { data, error } = await q;
  if (error) { tbody.innerHTML = `<tr><td colspan="10" style="color:var(--red-l);padding:12px;">${error.message}</td></tr>`; return; }
  if (!data || !data.length) { tbody.innerHTML = '<tr><td colspan="10" class="empty">No feed records found</td></tr>'; return; }

  // Decrypt all rows in parallel
  const rows = await Promise.all(data.map(_decryptFeedLog));
  tbody.innerHTML = rows.map(r => renderFeedRow(r, false)).join('');
}

function loadDemoFeedLogs() {
  const tbody = document.getElementById('feed-tbody');
  if (!tbody) return;
  const filter = document.getElementById('feed-batch-filter')?.value;
  const data = filter
    ? DEMO_DATA.feed_logs.filter(r => r.batch_id === filter)
    : DEMO_DATA.feed_logs;
  if (!data.length) { tbody.innerHTML = '<tr><td colspan="10" class="empty">No feed records found</td></tr>'; return; }
  tbody.innerHTML = data.map(r => renderFeedRow(r, true)).join('');
}

function renderFeedRow(r, demo = false) {
  const delBtn = demo
    ? `<button class="btn btn-danger btn-sm" onclick="toast('Demo mode — changes not saved','info')">Del</button>`
    : `<button class="btn btn-danger btn-sm" onclick="confirmDelete('feed_logs','${r.id}',loadFeedLogs)">Del</button>`;
  return `
    <tr>
      <td class="mono" style="font-size:10px;color:var(--text2);">${fmtDt(r.logged_at)}</td>
      <td><span class="badge badge-gray">${r.batch_id||'─'}</span></td>
      <td class="mono">${r.feed_week||'─'}</td>
      <td style="${phColor(r.ph_in)}">${fmtN(r.ph_in,'',2)}</td>
      <td style="${phColor(r.ph_runoff)}">${fmtN(r.ph_runoff,'',2)}</td>
      <td>${fmtN(r.ec_ms,'',3)}</td>
      <td>${fmtN(r.volume_l,'L',1)}</td>
      <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;font-size:11px;color:var(--text2);">${r.nutrients||'─'}</td>
      <td style="max-width:100px;overflow:hidden;text-overflow:ellipsis;font-size:11px;color:var(--text2);">${r.notes||'─'}</td>
      <td><div class="td-actions">${delBtn}</div></td>
    </tr>`;
}

async function saveFeedLog() {
  if (DEMO_MODE) { toast('Demo mode — changes not saved', 'info'); closeModal('modal-feed'); return; }
  if (!isCryptoReady()) { toast('Encryption key not ready — re-enter your passphrase first', 'error'); return; }

  const id = document.getElementById('feed-id').value;
  const plainRow = {
    batch_id:  document.getElementById('f-batch').value||null,
    feed_week: parseOrNull(document.getElementById('f-week').value),
    ph_in:     parseOrNull(document.getElementById('f-ph-in').value),
    ph_runoff: parseOrNull(document.getElementById('f-ph-out').value),
    ec_ms:     parseOrNull(document.getElementById('f-ec').value),
    volume_l:  parseOrNull(document.getElementById('f-vol').value),
    nutrients: document.getElementById('f-nuts').value.trim()||null,
    notes:     document.getElementById('f-notes').value.trim()||null,
  };

  if (!plainRow.batch_id) { toast('Batch is required','error'); return; }
  if (!sb) { toast('Connect Supabase first','error'); return; }
  if (!currentUser?.id) { toast('Not authenticated','error'); return; }
  plainRow.user_id = currentUser.id;

  let row;
  try {
    row = await _encryptFeedRow(plainRow);
  } catch (e) {
    toast(e.message, 'error');
    return;
  }

  let err;
  if (id) { ({ error:err } = await sb.from('feed_logs').update(row).eq('id', id)); }
  else     { ({ error:err } = await sb.from('feed_logs').insert(row)); }
  if (err) { toast(err.message,'error'); return; }
  toast('Feed log saved','success'); closeModal('modal-feed'); loadFeedLogs();
}
