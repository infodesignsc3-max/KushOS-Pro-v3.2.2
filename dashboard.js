// ══════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════
async function loadDashboard() {
  if (DEMO_MODE) { return loadDemoDashboard(); }
  if (!sb) {
    document.getElementById('ds-batches').textContent = '─';
    document.getElementById('ds-yield').textContent   = '─';
    document.getElementById('ds-tasks').textContent   = '─';
    loadDashTasks();
    return;
  }
  try {
    // FIX: use .select('id', { count: 'exact', head: true }) to avoid fetching
    // all rows — also avoids RLS-triggered 400s on large tables.
    const [batchRes, taskRes, harvestRes] = await Promise.all([
      sb.from('grows').select('id', { count: 'exact', head: true }),
      sb.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      sb.from('harvests').select('dry_weight_g'),
    ]);

    // batchRes.count is the row count when head:true is used
    document.getElementById('ds-batches').textContent = batchRes.count ?? '─';

    const pendingCount = taskRes.count ?? 0;
    document.getElementById('ds-tasks').textContent = pendingCount || '─';
    const tasksBadge = document.getElementById('tasks-count');
    if (tasksBadge) tasksBadge.textContent = pendingCount || '─';

    const totalYield = (harvestRes.data || []).reduce((a, h) => a + (h.dry_weight_g || 0), 0);
    document.getElementById('ds-yield').textContent = totalYield > 0 ? (totalYield / 1000).toFixed(2) + ' kg' : '─';
  } catch(e) {
    console.warn('Dashboard load error:', e.message);
  }
  loadDashTasks();
}

async function loadDashTasks() {
  const el = document.getElementById('dash-tasks-list');
  if (!el) return;
  if (DEMO_MODE) { return loadDemoDashTasks(); }
  if (!sb) { el.innerHTML = '<div class="empty">Connect Supabase to see tasks</div>'; return; }

  // FIX: added explicit error handling; due_date ascending is default so no .order() needed
  // which avoids the malformed desc&limit query string in some SDK versions
  const { data, error } = await sb
    .from('tasks')
    .select('id, title, due_date, priority')
    .eq('status', 'pending')
    .order('due_date', { ascending: true })
    .limit(5);

  if (error) {
    console.warn('loadDashTasks error:', error.message);
    el.innerHTML = '<div class="empty">Could not load tasks</div>';
    return;
  }

  const tasks = data || [];
  if (!tasks.length) { el.innerHTML = '<div class="empty">No pending tasks</div>'; return; }

  // FIX: use textContent for user-supplied strings to prevent XSS
  el.innerHTML = '';
  tasks.forEach(t => {
    const div = document.createElement('div');
    div.className = 'task-item';

    const check = document.createElement('div');
    check.className = 'task-check';
    check.addEventListener('click', () => { toggleTask(t.id, 'done'); loadDashboard(); });

    const info = document.createElement('div');

    const titleEl = document.createElement('div');
    titleEl.className = 'task-title';
    titleEl.textContent = t.title; // textContent — not innerHTML

    const metaEl = document.createElement('div');
    metaEl.className = 'task-meta';
    metaEl.textContent = (t.due_date ? '📅 ' + t.due_date : 'No due date') + (t.priority ? ' · ' + t.priority : '');

    info.appendChild(titleEl);
    info.appendChild(metaEl);
    div.appendChild(check);
    div.appendChild(info);
    el.appendChild(div);
  });
}


// Minimal sanitizer for values inserted into innerHTML
function sanitize(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── DEMO MODE ─────────────────────────────────────────────
function loadDemoDashboard() {
  const harvests = DEMO_DATA.harvests;
  const totalYield = harvests.reduce((a, h) => a + (h.dry_weight_g || 0), 0);
  const pending = DEMO_DATA.tasks.filter(t => t.status === 'pending').length;

  document.getElementById('ds-batches').textContent = DEMO_DATA.grows.length;
  document.getElementById('ds-tasks').textContent = pending || '─';
  document.getElementById('ds-yield').textContent = totalYield > 0 ? (totalYield / 1000).toFixed(2) + ' kg' : '─';
  const tasksBadge = document.getElementById('tasks-count');
  if (tasksBadge) tasksBadge.textContent = pending || '─';

  loadDemoDashTasks();
}

function loadDemoDashTasks() {
  const el = document.getElementById('dash-tasks-list');
  if (!el) return;
  const tasks = DEMO_DATA.tasks.filter(t => t.status === 'pending').slice(0, 5);
  if (!tasks.length) { el.innerHTML = '<div class="empty">No pending tasks</div>'; return; }
  el.innerHTML = '';
  tasks.forEach(t => {
    const div = document.createElement('div');
    div.className = 'task-item';
    const check = document.createElement('div');
    check.className = 'task-check';
    check.addEventListener('click', () => toast('Demo mode — changes not saved', 'info'));
    const info = document.createElement('div');
    const titleEl = document.createElement('div');
    titleEl.className = 'task-title';
    titleEl.textContent = t.title;
    const metaEl = document.createElement('div');
    metaEl.className = 'task-meta';
    metaEl.textContent = (t.due_date ? '📅 ' + t.due_date : 'No due date') + (t.priority ? ' · ' + t.priority : '');
    info.appendChild(titleEl);
    info.appendChild(metaEl);
    div.appendChild(check);
    div.appendChild(info);
    el.appendChild(div);
  });
}

