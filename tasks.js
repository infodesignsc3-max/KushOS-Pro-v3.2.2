// ══════════════════════════════════════════════════════════
// TASK MANAGER — user_id stamped on all inserts/updates
// ══════════════════════════════════════════════════════════
async function loadTasks() {
  const pending   = document.getElementById('tasks-pending');
  const completed = document.getElementById('tasks-done');
  const countEl   = document.getElementById('tasks-count');
  if (!pending || !completed) return;

  pending.innerHTML   = '<div class="loading">Loading…</div>';
  completed.innerHTML = '<div class="loading">Loading…</div>';

  // FIX #1 — demo handler
  if (DEMO_MODE) { return loadDemoTasks(); }

  if (!sb) {
    pending.innerHTML   = '<div class="empty">Connect Supabase to see tasks</div>';
    completed.innerHTML = '';
    return;
  }

  const { data, error } = await sb
    .from('tasks')
    .select('*')
    .order('due_date', { ascending: true });

  if (error) {
    pending.innerHTML = `<div class="empty" style="color:var(--red-l)">${error.message}</div>`;
    completed.innerHTML = '';
    return;
  }

  // Decrypt encrypted fields on each task row
  const tasks = await Promise.all((data || []).map(decryptTask));

  const pendingTasks   = tasks.filter(t => t.status !== 'done' && t.status !== 'complete');
  const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'complete');

  if (countEl) countEl.textContent = pendingTasks.length || '─';

  pending.innerHTML   = pendingTasks.length   ? pendingTasks.map(t => renderTaskItem(t)).join('')        : '<div class="empty">No pending tasks</div>';
  completed.innerHTML = completedTasks.length ? completedTasks.map(t => renderTaskItem(t, true)).join('') : '<div class="empty">No completed tasks</div>';
}

// ── Encrypt / Decrypt helpers ──────────────────────────────

// Fields stored as ciphertext in Supabase
const TASK_ENCRYPTED_FIELDS = ['title', 'notes', 'batch_id'];

async function encryptTask(row) {
  if (!isCryptoReady()) return row; // passphrase not set — store plaintext
  const out = { ...row };
  for (const field of TASK_ENCRYPTED_FIELDS) {
    if (out[field] != null) {
      out[field] = await encryptData(out[field], cryptoKey);
    }
  }
  return out;
}

async function decryptTask(row) {
  if (!isCryptoReady()) return row;
  const out = { ...row };
  for (const field of TASK_ENCRYPTED_FIELDS) {
    if (out[field] != null) {
      try {
        out[field] = await decryptData(out[field], cryptoKey);
      } catch {
        // Ciphertext unreadable (wrong key, or stored plaintext) — leave as-is
      }
    }
  }
  return out;
}

// FIX #1 — demo handler (demo data is plaintext, no decryption needed)
function loadDemoTasks() {
  const pending   = document.getElementById('tasks-pending');
  const completed = document.getElementById('tasks-done');
  const countEl   = document.getElementById('tasks-count');
  const tasks        = DEMO_DATA.tasks;
  const pendingTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'complete');
  const doneTasks    = tasks.filter(t => t.status === 'done' || t.status === 'complete');
  if (countEl) countEl.textContent = pendingTasks.length || '─';
  pending.innerHTML   = pendingTasks.length ? pendingTasks.map(t => renderTaskItem(t, false, true)).join('')  : '<div class="empty">No pending tasks</div>';
  completed.innerHTML = doneTasks.length    ? doneTasks.map(t => renderTaskItem(t, true, true)).join('')      : '<div class="empty">No completed tasks</div>';
}

function renderTaskItem(t, done = false, demo = false) {
  const priorityColor = { Low:'badge-gray', Medium:'badge-amber', High:'badge-red', Critical:'badge-red' };
  const badge = t.priority ? `<span class="badge ${priorityColor[t.priority]||'badge-gray'}">${sanitize(t.priority)}</span>` : '';
  // FIX #5 — demo tasks use a toast instead of calling toggleTask (which would hit Supabase)
  const toggleAction = demo
    ? `onclick="toast('Demo mode — changes not saved','info')"`
    : `onclick="toggleTask('${t.id}','${done ? 'pending' : 'done'}')"`;
  const editAction = demo
    ? `onclick="toast('Demo mode — edit disabled','info')"`
    : `onclick="editTask('${t.id}')"`;
  const delAction = demo
    ? `onclick="toast('Demo mode — changes not saved','info')"`
    : `onclick="confirmDelete('tasks','${t.id}',loadTasks)"`;
  return `
    <div class="task-item" style="${done ? 'opacity:.55' : ''}">
      <div class="task-check ${done ? 'done' : ''}" ${toggleAction}></div>
      <div style="flex:1;min-width:0;">
        <div class="task-title ${done ? 'done' : ''}">${sanitize(t.title) || '─'}</div>
        <div class="task-meta">${t.due_date ? '📅 ' + t.due_date : ''}${t.batch_id ? ' · ' + sanitize(t.batch_id) : ''}</div>
        ${t.notes ? `<div class="task-meta" style="margin-top:2px;color:var(--text3);">${sanitize(t.notes)}</div>` : ''}
      </div>
      <div style="display:flex;gap:6px;align-items:center;flex-shrink:0;">
        ${badge}
        <button class="btn btn-ghost btn-sm" ${editAction}>Edit</button>
        <button class="btn btn-danger btn-sm" ${delAction}>Del</button>
      </div>
    </div>`;
}

// FIX #5 — guard against demo mode before hitting Supabase
async function toggleTask(id, newStatus) {
  if (DEMO_MODE) { toast('Demo mode — changes not saved', 'info'); return; }
  if (!sb) return;
  const { error } = await sb.from('tasks').update({ status: newStatus }).eq('id', id);
  if (error) { toast(error.message, 'error'); return; }
  loadTasks();
}

async function editTask(id) {
  if (DEMO_MODE) { toast('Demo mode — edit disabled', 'info'); return; }
  if (!id) {
    document.getElementById('modal-task-title').textContent = 'New Task';
    document.getElementById('task-id').value    = '';
    document.getElementById('tk-title').value   = '';
    document.getElementById('tk-due').value     = '';
    document.getElementById('tk-priority').value = 'Medium';
    document.getElementById('tk-notes').value   = '';
    populateBatchSelects();
    openModal('modal-task');
    return;
  }
  if (!sb) return;
  const { data } = await sb.from('tasks').select('*').eq('id', id).single();
  if (!data) return;

  // Decrypt before populating the form
  const decrypted = await decryptTask(data);

  document.getElementById('modal-task-title').textContent = 'Edit Task';
  document.getElementById('task-id').value     = decrypted.id;
  document.getElementById('tk-title').value    = decrypted.title || '';
  document.getElementById('tk-due').value      = decrypted.due_date || '';
  document.getElementById('tk-priority').value = decrypted.priority || 'Medium';
  document.getElementById('tk-notes').value    = decrypted.notes || '';
  populateBatchSelects();
  const batchEl = document.getElementById('t-batch');
  if (batchEl && decrypted.batch_id) batchEl.value = decrypted.batch_id;
  openModal('modal-task');
}

async function saveTask() {
  if (DEMO_MODE) { toast('Demo mode — changes not saved', 'info'); closeModal('modal-task'); return; }
  if (!currentUser?.id) { toast('Not authenticated', 'error'); return; }
  const id    = document.getElementById('task-id').value;
  const title = document.getElementById('tk-title').value.trim();
  if (!title) { toast('Task title is required', 'error'); return; }

  const row = {
    title,
    due_date: document.getElementById('tk-due').value || null,
    priority: document.getElementById('tk-priority').value || 'Medium',
    batch_id: document.getElementById('t-batch')?.value || null,
    notes:    document.getElementById('tk-notes').value.trim() || null,
    status:   'pending',
    user_id:  currentUser.id,
  };

  if (!sb) { toast('Connect Supabase first', 'error'); return; }

  // Encrypt sensitive fields before writing to Supabase
  const encrypted = await encryptTask(row);

  let err;
  if (id) {
    ({ error: err } = await sb.from('tasks').update(encrypted).eq('id', id));
  } else {
    ({ error: err } = await sb.from('tasks').insert(encrypted));
  }
  if (err) { toast(err.message, 'error'); return; }
  toast(id ? 'Task updated' : 'Task created', 'success');
  closeModal('modal-task');
  loadTasks();
}
