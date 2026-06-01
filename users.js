// ══════════════════════════════════════════════════════════
// USERS
// ══════════════════════════════════════════════════════════
async function loadUsers() {
  const tbody = document.getElementById('users-tbody'); if (!tbody) return;
  if (currentUser.role !== 'admin') { tbody.innerHTML = '<tr><td colspan="7" class="empty">Admin access required</td></tr>'; return; }
  tbody.innerHTML = '<tr><td colspan="7" class="loading">Waiting for user data...</td></tr>';
  if (!sb) { tbody.innerHTML = '<tr><td colspan="7" class="empty">Connect Supabase to manage users</td></tr>'; return; }
  const { data, error } = await sb.from('user_access').select('*').order('created_at', { ascending:false });
  if (error) { tbody.innerHTML = `<tr><td colspan="7" style="color:var(--red-l);padding:12px;">${error.message}</td></tr>`; return; }
  if (!data || !data.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty">No users found</td></tr>'; return; }
  tbody.innerHTML = data.map(u => `
    <tr>
      <td>${u.email||'─'}</td>
      <td class="mono">${u.access_code}</td>
      <td><span class="badge ${u.role==='admin'?'badge-red':u.role==='grower'?'badge-green':'badge-gray'}">${u.role}</span></td>
      <td><span class="badge ${u.active?'badge-green':'badge-gray'}">${u.active?'Active':'Inactive'}</span></td>
      <td class="mono" style="font-size:10px;">${u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB') : '─'}</td>
      <td class="mono" style="font-size:10px;">${u.last_login ? new Date(u.last_login).toLocaleDateString('en-GB') : '─'}</td>
      <td><div class="td-actions">
        <button class="btn btn-ghost btn-sm" onclick="editUser('${u.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="confirmDelete('user_access','${u.id}',loadUsers)">Del</button>
      </div></td>
    </tr>`).join('');
}
async function editUser(id) {
  if (!sb) return;
  const { data } = await sb.from('user_access').select('*').eq('id', id).single();
  if (!data) return;
  document.getElementById('modal-user-title').textContent = 'Edit User';
  document.getElementById('user-id').value = id;
  document.getElementById('u-email').value = data.email||'';
  document.getElementById('u-code').value = data.access_code||'';
  document.getElementById('u-role').value = data.role||'grower';
  document.getElementById('u-active').value = String(data.active);
  openModal('modal-user');
}
async function saveUser() {
  const id = document.getElementById('user-id').value;
  const code = document.getElementById('u-code').value.trim();
  if (!code) { toast('Access code required','error'); return; }
  const row = { email:document.getElementById('u-email').value.trim()||null, access_code:code, role:document.getElementById('u-role').value, active:document.getElementById('u-active').value==='true' };
  if (!sb) { toast('Connect Supabase first','error'); return; }
  let err;
  if (id) { ({ error:err } = await sb.from('user_access').update(row).eq('id', id)); }
  else     { ({ error:err } = await sb.from('user_access').insert(row)); }
  if (err) { toast(err.message,'error'); return; }
  toast(id ? 'User updated' : 'User created','success'); closeModal('modal-user'); loadUsers();
}
function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  document.getElementById('u-code').value = Array.from({length:12}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
}

