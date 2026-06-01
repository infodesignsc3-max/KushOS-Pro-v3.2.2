// ══════════════════════════════════════════════════════════
// GROW ROOMS  — unlimited, user-managed rooms
// Table: grow_rooms
//   id uuid PK, name text UNIQUE, stage text,
//   capacity int, current_plants int, size_m2 numeric,
//   status text (Active|Offline|Maintenance),
//   notes text, created_at
// ══════════════════════════════════════════════════════════

// ── Load rooms from Supabase ───────────────────────────────
async function loadRooms() {
  const grid = document.getElementById('rooms-grid');
  if (!grid) return;

  if (typeof DEMO_MODE !== 'undefined' && DEMO_MODE) { return loadDemoRooms(); }
  if (!sb) { renderRoomsModule([]); return; }

  const { data, error } = await sb
    .from('grow_rooms')
    .select('*')
    .order('name');
  if (error) { console.warn('loadRooms error:', error.message); renderRoomsModule([]); return; }
  allRoomObjects = data || [];
  allRooms       = allRoomObjects.map(r => r.name);

  // Sync environment room tabs
  if (typeof renderRoomTabs === 'function') renderRoomTabs(allRooms);
  // Sync datalists
  if (typeof updateDatalist === 'function') {
    updateDatalist('room-list', allRooms);
    updateDatalist('room-list-grow', allRooms);
  }
  // Sync task / feed room dropdowns
  populateRoomSelects();
  renderRoomsModule(allRoomObjects);
  updateRoomsNavBadge();
}

function loadDemoRooms() {
  if (typeof DEMO_DATA === 'undefined') return;
  allRoomObjects = DEMO_DATA.rooms || [];
  allRooms       = allRoomObjects.map(r => r.name);
  if (typeof renderRoomTabs === 'function') renderRoomTabs(allRooms);
  populateRoomSelects();
  renderRoomsModule(allRoomObjects);
  updateRoomsNavBadge();
}

function updateRoomsNavBadge() {
  const badge = document.querySelector('#nav-rooms .nbadge');
  if (badge) badge.textContent = allRoomObjects.length || '0';
}

// ── Render the Grow Rooms module grid ──────────────────────
function renderRoomsModule(rooms) {
  const grid = document.getElementById('rooms-grid');
  if (!grid) return;
  if (!rooms.length) {
    grid.innerHTML = '<div class="empty">No grow rooms yet. Create your first room below.</div>';
    return;
  }

  const stageBadgeRoom = s => {
    const m = {
      Seedling:   'badge-green',
      Vegetative: 'badge-green',
      Flowering:  'badge-amber',
      Drying:     'badge-blue',
      Curing:     'badge-purple',
      Nursery:    'badge-gray',
      Offline:    'badge-gray',
    };
    return `<span class="badge ${m[s] || 'badge-gray'}">${s || '─'}</span>`;
  };

  grid.innerHTML = rooms.map(r => {
    const current = r.current_plants || 0;
    const cap     = r.capacity       || 0;
    const pct     = cap > 0 ? Math.min(100, Math.round(current / cap * 100)) : 0;
    const offline = r.status === 'Offline' || r.status === 'Maintenance';
    return `
    <div class="panel room-card" style="${offline ? 'opacity:.55' : ''}">
      <div class="panel-header">
        <div class="panel-title">${r.name}</div>
        ${stageBadgeRoom(offline ? r.status : r.stage)}
      </div>
      <div class="panel-body" style="display:flex;flex-direction:column;gap:10px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div style="background:var(--g2);border-radius:8px;padding:10px;border:1px solid var(--border);">
            <div style="font-size:9px;color:var(--text3);font-family:var(--font-mono);">CAPACITY</div>
            <div class="mono" style="font-size:15px;color:var(--text);margin-top:2px;">${current} / ${cap || '─'}</div>
          </div>
          <div style="background:var(--g2);border-radius:8px;padding:10px;border:1px solid var(--border);">
            <div style="font-size:9px;color:var(--text3);font-family:var(--font-mono);">SIZE</div>
            <div class="mono" style="font-size:15px;color:var(--text);margin-top:2px;">${r.size_m2 ? r.size_m2 + ' m²' : '─'}</div>
          </div>
        </div>
        ${r.notes ? `<div style="font-size:12px;color:var(--text3);">${r.notes}</div>` : ''}
        ${cap > 0 ? `
        <div>
          <div class="progress-bar">
            <div class="progress-fill ${pct > 85 ? 'amber' : ''}" style="width:${pct}%"></div>
          </div>
          <div style="font-size:9px;color:var(--text3);font-family:var(--font-mono);margin-top:4px;">${pct}% capacity</div>
        </div>` : ''}
        <div style="display:flex;gap:8px;">
          <button class="btn btn-ghost btn-sm" onclick="editRoom('${r.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteRoom('${r.id}')">Delete</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── Open add / edit room modal ─────────────────────────────
function openAddRoom() {
  document.getElementById('modal-room-title').textContent = 'Add Grow Room';
  document.getElementById('room-id').value          = '';
  document.getElementById('r-name').value           = '';
  document.getElementById('r-stage').value          = 'Vegetative';
  document.getElementById('r-capacity').value       = '';
  document.getElementById('r-current').value        = '';
  document.getElementById('r-size').value           = '';
  document.getElementById('r-status').value         = 'Active';
  document.getElementById('r-notes').value          = '';
  openModal('modal-room');
}

async function editRoom(id) {
  const r = allRoomObjects.find(x => x.id === id);
  if (!r) return;
  document.getElementById('modal-room-title').textContent = 'Edit Room';
  document.getElementById('room-id').value          = id;
  document.getElementById('r-name').value           = r.name           || '';
  document.getElementById('r-stage').value          = r.stage          || 'Vegetative';
  document.getElementById('r-capacity').value       = r.capacity       || '';
  document.getElementById('r-current').value        = r.current_plants || '';
  document.getElementById('r-size').value           = r.size_m2        || '';
  document.getElementById('r-status').value         = r.status         || 'Active';
  document.getElementById('r-notes').value          = r.notes          || '';
  openModal('modal-room');
}

async function saveRoom() {
  const id   = document.getElementById('room-id').value;
  const name = document.getElementById('r-name').value.trim();
  if (!name) { toast('Room name is required', 'error'); return; }
  const row = {
    name,
    stage:          document.getElementById('r-stage').value    || null,
    capacity:       parseOrNull(document.getElementById('r-capacity').value),
    current_plants: parseOrNull(document.getElementById('r-current').value),
    size_m2:        parseOrNull(document.getElementById('r-size').value),
    status:         document.getElementById('r-status').value   || 'Active',
    notes:          document.getElementById('r-notes').value.trim() || null,
  };
  if (!sb) { toast('Connect Supabase first', 'error'); return; }
  let err;
  if (id) { ({ error: err } = await sb.from('grow_rooms').update(row).eq('id', id)); }
  else     { ({ error: err } = await sb.from('grow_rooms').insert(row)); }
  if (err) { toast(err.message, 'error'); return; }
  toast(id ? 'Room updated' : 'Room created', 'success');
  closeModal('modal-room');
  await loadRooms();
}

async function deleteRoom(id) {
  if (!sb) return;
  const r = allRoomObjects.find(x => x.id === id);
  if (!confirm(`Delete "${r ? r.name : 'this room'}"? Grow and sensor records with this room name will keep their data.`)) return;
  const { error } = await sb.from('grow_rooms').delete().eq('id', id);
  if (error) { toast(error.message, 'error'); return; }
  toast('Room deleted', 'success');
  await loadRooms();
}

// ── Populate every <select> that needs room names ──────────
function populateRoomSelects() {
  const opts = allRooms.map(n => `<option value="${n}">${n}</option>`).join('');
  ['g-room', 's-room', 'task-room-filter'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const prev = el.value;
    el.innerHTML = '<option value="">Select room…</option>' + opts;
    if (prev && allRooms.includes(prev)) el.value = prev;
  });
}
