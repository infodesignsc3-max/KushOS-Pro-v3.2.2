// ══════════════════════════════════════════════════════════
// ENVIRONMENT — Sensor log removed; module retained for
// room-list datalist population only.
// ══════════════════════════════════════════════════════════

async function buildRoomTabs() {
  if (DEMO_MODE) {
    const rooms = DEMO_DATA.rooms.map(r => r.name);
    updateDatalist('room-list', rooms);
    return;
  }
  if (!sb) return;
  // Populate room-list datalist from grows table instead of sensor_logs
  const { data } = await sb.from('rooms').select('name').order('name');
  const { data } = await sb.from('grow_rooms').select('name').order('name');
  updateDatalist('room-list', rooms);
}
