// ══════════════════════════════════════════════════════════
// SUPABASE CONFIG
// ══════════════════════════════════════════════════════════

const SUPABASE_URL     = "https://emshmwpplytrqbkyxxfy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtc2htd3BwbHl0cnFia3l4eGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTgxMjQsImV4cCI6MjA5NTgzNDEyNH0.k51gvJjsCSa8X4W9nEn5Z_sT8zeuqMAk8NqeWcDyc6w";

let sb = null;

try {
  sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.sb = sb;
  console.log("✅ Supabase client created");
} catch (e) {
  console.error("❌ Supabase init failed:", e.message);
  window.sb = null;
}
