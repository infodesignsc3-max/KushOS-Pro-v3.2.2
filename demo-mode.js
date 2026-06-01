// ══════════════════════════════════════════════════════════
// DEMO MODE — GENERATED (was missing / 404)
// Controls demo bypass flow from the login screen
// ══════════════════════════════════════════════════════════

/**
 * Called by the "ENTER AS DEMO (OFFLINE BYPASS)" button on the
 * login screen. Sets DEMO_MODE=true, hides login, shows app
 * and the demo banner, then loads the dashboard with DEMO_DATA.
 */
function doDemoBypass() {
  DEMO_MODE = true;
  window.sb = null; // Prevent any Supabase calls in demo mode

  // Fake a minimal currentUser so role guards don't crash
  currentUser = {
    id:    'demo',
    email: 'demo@kushos.pro',
    role:  'admin',
    active: true,
  };

  // Show demo banner
  const banner = document.getElementById('demo-banner');
  if (banner) banner.style.display = '';

  // Hide login, show app
  const loginScreen = document.getElementById('login-screen');
  const app         = document.getElementById('app');
  if (loginScreen) loginScreen.style.display = 'none';
  if (app)         app.classList.add('visible');

  // Update avatar
  const avatar = document.getElementById('user-avatar');
  if (avatar) avatar.textContent = 'DM';

  // Show admin nav (demo user is admin)
  const adminNav = document.getElementById('admin-nav-section');
  if (adminNav) adminNav.style.display = '';

  // Skip crypto — demo data is plaintext
  passphraseReady = false;
  cryptoKey       = null;
  updateCryptoLockUI();

  // Load dashboard
  if (typeof loadDashboard === 'function') loadDashboard();
  if (typeof updateSeasonChip === 'function') updateSeasonChip();

  console.log('⚡ KushOS Pro demo mode activated.');
}

/**
 * Called by the "Exit Demo" button in the demo banner.
 * Reloads the page to return to the login screen cleanly.
 */
function disableDemoMode() {
  DEMO_MODE   = false;
  currentUser = null;
  location.reload();
}
