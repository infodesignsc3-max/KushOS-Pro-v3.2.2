// ══════════════════════════════════════════════════════════
// GLOBAL STATE — must load before auth.js and core.js
// Using var so all scripts share the same window-level bindings
// ══════════════════════════════════════════════════════════
var currentUser   = null;
var allGrows      = [];
var allRooms      = [];       // populated from grow_rooms table
var currentRoom   = 'All';
var realtimeSubs  = [];

// ── Seasons ────────────────────────────────────────────────
// Loaded from Supabase grow_seasons table on login.
// currentSeason = the active season object { id, name, number, start_date, end_date, active }
var allSeasons    = [];
var currentSeason = null;

// ── Grow Rooms ─────────────────────────────────────────────
// Loaded from Supabase grow_rooms table on login.
// allRoomObjects = full room objects { id, name, stage, capacity, size_m2, status, notes }
var allRoomObjects = [];

// ── Demo Mode ──────────────────────────────────────────────
// Set to true to load DEMO_DATA instead of hitting Supabase.
// Toggled via Settings (admin only). Never persisted to DB.
var DEMO_MODE = false;

// ── Zero-Knowledge Encryption ──────────────────────────────
// cryptoKey      : non-extractable CryptoKey derived from the
//                  user's passphrase via PBKDF2. Lives only in
//                  memory — never serialised or sent anywhere.
//                  Set by crypto.js:initCryptoKey() at login.
//                  Wiped by lockCryptoSession() on logout.
//
// passphraseReady: boolean flag — true only when cryptoKey is
//                  derived and ready for encrypt/decrypt calls.
//                  UI elements read this to show lock status.
var cryptoKey       = null;
var passphraseReady = false;
