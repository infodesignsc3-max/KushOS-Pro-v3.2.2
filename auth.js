// ══════════════════════════════════════════════════════════
// AUTH — v3.2
// Supabase email/password + browser-only passphrase
//
// LOGIN FLOW:
//   1. User enters email (or license code) + passphrase
//   2. Supabase Auth validates credentials
//   3. Passphrase → PBKDF2 CryptoKey derived (browser only)
//   4. launchApp() shows the main UI
// ══════════════════════════════════════════════════════════

// ── Auto-restore session on page reload ───────────────────
(async function () {
  if (!sb) return;
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (session) {
      await _resolveCurrentUser(session.user);
      _waitForDom(() => {
        if (!isCryptoReady()) {
          _showPassphrasePrompt(launchApp);
        } else {
          launchApp();
        }
      });
    }
  } catch (e) {
    console.warn('Session restore failed:', e.message);
  }

  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      await _resolveCurrentUser(session.user);
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      lockCryptoSession();
    }
  });
})();

// ── Resolve current user ───────────────────────────────────
async function _resolveCurrentUser(authUser) {
  currentUser = {
    id:    authUser.id,
    email: authUser.email,
    role:  authUser.user_metadata?.role || 'admin',
  };
  if (sb) {
    try {
      const { data } = await sb
        .from('user_access')
        .select('role, email, active')
        .eq('email', authUser.email)
        .maybeSingle();
      if (data) {
        currentUser.role   = data.role;
        currentUser.email  = data.email;
        currentUser.active = data.active;
      }
    } catch (_) { /* table may not exist yet — ignore */ }
  }
}

function _waitForDom(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

// ── Launch the main app UI ─────────────────────────────────
function launchApp() {
  const loginScreen = document.getElementById('login-screen');
  const app         = document.getElementById('app');
  if (loginScreen) loginScreen.style.display = 'none';
  if (app)         app.classList.add('visible');

  const leafCanvas = document.getElementById('leaf-canvas');
  const leafGlow   = document.getElementById('leaf-glow');
  if (leafCanvas) leafCanvas.style.opacity = '';
  if (leafGlow)   leafGlow.style.display = 'block';

  const avatar = document.getElementById('user-avatar');
  if (avatar && currentUser?.email) {
    avatar.textContent = currentUser.email.slice(0, 2).toUpperCase();
  }

  const adminNav = document.getElementById('admin-nav-section');
  if (adminNav) {
    adminNav.style.display = currentUser?.role === 'admin' ? '' : 'none';
  }

  if (typeof setupRealtime   === 'function') setupRealtime();
  if (typeof loadDashboard   === 'function') loadDashboard();
  if (typeof updateSeasonChip === 'function') updateSeasonChip();
  updateCryptoLockUI();
  console.log('✅ KushOS Pro launched — user:', currentUser?.email);
}

// ── Passphrase re-entry prompt (after page refresh) ───────
function _showPassphrasePrompt(onSuccess) {
  const overlay = document.getElementById('modal-passphrase');
  if (!overlay) { onSuccess(); return; }

  overlay.classList.add('active');
  const btn   = document.getElementById('pp-submit');
  const input = document.getElementById('pp-input');
  const errEl = document.getElementById('pp-error');

  async function attempt() {
    const pass = input.value;
    if (!pass) { errEl.textContent = 'Passphrase required'; return; }
    btn.disabled = true;
    btn.textContent = 'Deriving key…';
    errEl.textContent = '';
    const ok = await initCryptoKey(pass);
    input.value = '';
    if (ok) {
      overlay.classList.remove('active');
      updateCryptoLockUI();
      onSuccess();
    } else {
      btn.disabled = false;
      btn.textContent = 'Unlock';
      errEl.textContent = 'Incorrect passphrase — try again';
    }
  }

  btn.onclick = attempt;
  input.onkeydown = e => { if (e.key === 'Enter') attempt(); };
  setTimeout(() => input.focus(), 80);
}

// ── Login ──────────────────────────────────────────────────
async function doLogin() {
  const keyInput   = document.getElementById('login-input');
  const passInput  = document.getElementById('login-passphrase');
  const errEl      = document.getElementById('login-error');
  const btnEl      = document.querySelector('#login-screen button[type="submit"]');
  const btnTxt     = document.getElementById('login-btn-text');

  const rawKey     = keyInput.value.trim();
  const passphrase = passInput.value;

  errEl.textContent = '';

  if (!rawKey) {
    errEl.textContent = 'License key or email required';
    keyInput.focus();
    return;
  }

  // Quick offline/demo shortcut — type "demo" in the license field
  if (rawKey.toLowerCase() === 'demo') {
    doDemoBypass();
    return;
  }

  if (!passphrase) {
    errEl.textContent = 'Encryption passphrase required';
    passInput.focus();
    return;
  }
  if (!sb) {
    errEl.textContent = 'Database connection failed — check supabase-config.js';
    return;
  }

  // Lock the button
  if (btnEl) btnEl.disabled = true;
  btnTxt.textContent = 'Authenticating…';

  // Derive email from input: plain email passes through,
  // bare license codes become <code>@kushos.pro
  const email    = rawKey.includes('@') ? rawKey : rawKey.toLowerCase() + '@kushos.pro';
  const password = rawKey; // Supabase password == the license key

  try {
    const { data: authData, error: authErr } = await sb.auth.signInWithPassword({ email, password });

    if (authErr) {
      // Map common Supabase error codes to friendlier messages
      const msg = authErr.message || '';
      if (msg.toLowerCase().includes('invalid login') || msg.toLowerCase().includes('invalid credentials')) {
        throw new Error('Invalid license key or password. Check your credentials and try again.');
      }
      if (msg.toLowerCase().includes('email not confirmed')) {
        throw new Error('Email not confirmed. Check your inbox for a confirmation link.');
      }
      throw new Error(authErr.message);
    }

    await _resolveCurrentUser(authData.user);

    btnTxt.textContent = 'Deriving key…';
    const ok = await initCryptoKey(passphrase);
    passInput.value = ''; // wipe immediately

    if (!ok) throw new Error('Passphrase key derivation failed — try again');

    launchApp();

  } catch (err) {
    passInput.value   = '';
    errEl.textContent = err.message || 'Authentication failed';
    btnTxt.textContent = 'ENTER LAB →';
    if (btnEl) btnEl.disabled = false;
    console.error('Login error:', err.message);
  }
}

// ── Logout ─────────────────────────────────────────────────
async function doLogout() {
  lockCryptoSession();
  if (sb) await sb.auth.signOut();
  localStorage.clear();
  location.reload();
}

// ── Keyboard: license field → passphrase on Enter ─────────
document.addEventListener('DOMContentLoaded', () => {
  const keyInput  = document.getElementById('login-input');
  const passInput = document.getElementById('login-passphrase');
  if (keyInput) keyInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); passInput?.focus(); }
  });
});
