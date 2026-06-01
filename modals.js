// ══════════════════════════════════════════════════════════
// MODAL / CONFIRM HELPERS
// ══════════════════════════════════════════════════════════
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('open');
  const m = el.querySelector('.modal-body');
  if (m) {
    m.querySelectorAll('input:not([type=hidden])').forEach(i => { i.value = ''; });
    m.querySelectorAll('textarea').forEach(t => { t.value = ''; });
    m.querySelectorAll('input[type=hidden]').forEach(i => { i.value = ''; });
    m.querySelectorAll('select').forEach(s => { s.selectedIndex = 0; });
  }
}

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) closeModal(e.target.id);
  if (e.target.id === 'confirm-overlay') closeConfirm();
});

let _pendingDel = null;
function confirmDelete(table, id, reloadFn) {
  _pendingDel = { table, id, reloadFn };
  document.getElementById('confirm-msg').textContent = `Delete this record from "${table}"? This cannot be undone.`;
  document.getElementById('confirm-overlay').classList.add('open');
  document.getElementById('confirm-ok').onclick = execDelete;
}
function closeConfirm() {
  _pendingDel = null;
  document.getElementById('confirm-overlay').classList.remove('open');
}
async function execDelete() {
  if (!_pendingDel || !sb) { closeConfirm(); return; }
  const { table, id, reloadFn } = _pendingDel;
  const { error } = await sb.from(table).delete().eq('id', id);
  if (error) { toast(error.message, 'error'); } else { toast('Deleted successfully', 'success'); if (reloadFn) reloadFn(); }
  closeConfirm();
}

// ══════════════════════════════════════════════════════════
// CALENDAR
// ══════════════════════════════════════════════════════════
function renderMiniCalendar() {
  const cal = document.getElementById('mini-calendar');
  if (!cal) return;
  const today = new Date();
  const year  = today.getFullYear();
  const month = today.getMonth();
  const titleEl = document.getElementById('cal-month-title');
  if (titleEl) titleEl.textContent = today.toLocaleString('default', { month:'long', year:'numeric' });
  const days = ['S','M','T','W','T','F','S'];
  const first       = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const eventDays   = [3, 8, 15, 18, 23, 26, 28];
  let html = days.map(d => `<div class="mini-cal-header">${d}</div>`).join('');
  for (let i = 0; i < first; i++) html += '<div class="mini-cal-day other-month"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    html += `<div class="mini-cal-day ${d === today.getDate() ? 'today' : ''} ${eventDays.includes(d) ? 'has-event' : ''}">${d}</div>`;
  }
  cal.innerHTML = html;
}

// ══════════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════════
function toast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className  = `toast ${type}`;
  el.textContent = (type === 'success' ? '✓ ' : type === 'error' ? '✗ ' : 'ℹ ') + msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}


