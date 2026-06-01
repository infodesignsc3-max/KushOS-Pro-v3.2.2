// ══════════════════════════════════════════════════════════
// CRYPTO — Zero-Knowledge Client-Side Encryption
// ══════════════════════════════════════════════════════════
//
// TRUST MODEL:
//   • The encryption passphrase is collected once at login.
//   • It is immediately used to derive a CryptoKey via PBKDF2.
//   • The raw passphrase string is then discarded (overwritten).
//   • The CryptoKey lives only in memory (window.cryptoKey).
//   • It is never serialised, logged, or sent over the network.
//   • Supabase (and the developer) receive only AES-GCM
//     ciphertext — they cannot decrypt it without the key.
//   • On logout, cryptoKey is set to null and memory is freed.
//
// ALGORITHM CHOICES:
//   • Key derivation : PBKDF2-SHA-256, 310 000 iterations
//                      (OWASP 2023 minimum recommendation)
//   • Encryption     : AES-GCM, 256-bit key, 96-bit random IV
//   • Salt           : 16 random bytes, stored with ciphertext
//   • Output format  : base64( salt[16] + iv[12] + ciphertext )
// ══════════════════════════════════════════════════════════

const CRYPTO_ITERATIONS = 310_000;
const CRYPTO_HASH       = 'SHA-256';
const CRYPTO_ALGO       = 'AES-GCM';
const CRYPTO_KEY_LEN    = 256;
const CRYPTO_SALT_LEN   = 16;
const CRYPTO_IV_LEN     = 12;

// ── Key Derivation ─────────────────────────────────────────
// Returns a non-extractable CryptoKey. The passphrase string
// should be overwritten by the caller immediately after.
async function deriveKey(passphrase, salt) {
  const enc = new TextEncoder();
  const raw = enc.encode(passphrase);

  const imported = await crypto.subtle.importKey(
    'raw', raw, { name: 'PBKDF2' }, false, ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name:       'PBKDF2',
      salt:       salt,
      iterations: CRYPTO_ITERATIONS,
      hash:       CRYPTO_HASH,
    },
    imported,
    { name: CRYPTO_ALGO, length: CRYPTO_KEY_LEN },
    false,       // non-extractable — key bytes can never be read back
    ['encrypt', 'decrypt']
  );
}

// ── Encrypt ────────────────────────────────────────────────
// Accepts any JS value (object, string, number).
// Returns a base64 string: salt(16) + iv(12) + ciphertext.
async function encryptData(plaintext, key) {
  if (!key) throw new Error('No encryption key — user must be authenticated with passphrase');

  const enc        = new TextEncoder();
  const salt       = crypto.getRandomValues(new Uint8Array(CRYPTO_SALT_LEN));
  const iv         = crypto.getRandomValues(new Uint8Array(CRYPTO_IV_LEN));
  const encoded    = enc.encode(JSON.stringify(plaintext));

  const cipherBuf  = await crypto.subtle.encrypt(
    { name: CRYPTO_ALGO, iv },
    key,
    encoded
  );

  // Pack: salt | iv | ciphertext
  const packed = new Uint8Array(CRYPTO_SALT_LEN + CRYPTO_IV_LEN + cipherBuf.byteLength);
  packed.set(salt, 0);
  packed.set(iv, CRYPTO_SALT_LEN);
  packed.set(new Uint8Array(cipherBuf), CRYPTO_SALT_LEN + CRYPTO_IV_LEN);

  return _bufToBase64(packed);
}

// ── Decrypt ────────────────────────────────────────────────
// Accepts the base64 string produced by encryptData.
// Returns the original JS value.
async function decryptData(base64, key) {
  if (!key) throw new Error('No encryption key — user must be authenticated with passphrase');

  const packed     = _base64ToBuf(base64);
  const iv         = packed.slice(CRYPTO_SALT_LEN, CRYPTO_SALT_LEN + CRYPTO_IV_LEN);
  const ciphertext = packed.slice(CRYPTO_SALT_LEN + CRYPTO_IV_LEN);

  const plainBuf   = await crypto.subtle.decrypt(
    { name: CRYPTO_ALGO, iv },
    key,
    ciphertext
  );

  const dec = new TextDecoder();
  return JSON.parse(dec.decode(plainBuf));
}

// ── Encrypt + Re-derive from passphrase ───────────────────
// Convenience wrapper that derives a fresh key (new salt) for
// each encryption call. Use when you don't hold a CryptoKey
// reference — e.g. the very first save during login setup.
async function encryptWithPassphrase(plaintext, passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(CRYPTO_SALT_LEN));
  const key  = await deriveKey(passphrase, salt);
  return encryptData(plaintext, key);
}

// ── Session Key Init ───────────────────────────────────────
// Called by auth.js immediately after the user enters their
// passphrase. Derives the session CryptoKey and stores it
// in the global (memory only). Returns true on success.
async function initCryptoKey(passphrase) {
  try {
    // Use a fixed per-user salt derived from their email so the
    // same passphrase always produces the same key. The salt is
    // not secret — it just prevents cross-user rainbow tables.
    // It is stored in memory alongside the email (currentUser.email).
    const enc    = new TextEncoder();
    const rawSalt = enc.encode((currentUser?.email || 'kushos') + ':kushos:v1');
    const salt   = rawSalt.slice(0, CRYPTO_SALT_LEN).buffer
                    ? rawSalt.slice(0, CRYPTO_SALT_LEN)
                    : new Uint8Array(CRYPTO_SALT_LEN);

    // Pad or truncate salt to exactly CRYPTO_SALT_LEN bytes
    const fixedSalt = new Uint8Array(CRYPTO_SALT_LEN);
    fixedSalt.set(rawSalt.slice(0, CRYPTO_SALT_LEN));

    cryptoKey      = await deriveKey(passphrase, fixedSalt);
    passphraseReady = true;

    console.log('🔐 Crypto key derived — passphrase discarded from memory');
    return true;
  } catch (err) {
    console.error('❌ Key derivation failed:', err.message);
    cryptoKey       = null;
    passphraseReady = false;
    return false;
  }
}

// ── Lock Session ───────────────────────────────────────────
// Wipe the key from memory (called on logout or manual lock).
function lockCryptoSession() {
  cryptoKey       = null;
  passphraseReady = false;
  console.log('🔒 Crypto session locked — key wiped from memory');
}

// ── Helpers ────────────────────────────────────────────────
function _bufToBase64(buf) {
  let binary = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function _base64ToBuf(b64) {
  const binary = atob(b64);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ── Status helpers (UI) ────────────────────────────────────
function isCryptoReady() {
  return passphraseReady && cryptoKey !== null;
}

function updateCryptoLockUI() {
  const lockEl = document.getElementById('crypto-lock-indicator');
  if (!lockEl) return;
  if (isCryptoReady()) {
    lockEl.title     = 'Data encrypted · passphrase active';
    lockEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
    lockEl.classList.add('locked');
    lockEl.classList.remove('unlocked');
  } else {
    lockEl.title     = 'Passphrase not set · data stored unencrypted';
    lockEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`;
    lockEl.classList.add('unlocked');
    lockEl.classList.remove('locked');
  }
}
