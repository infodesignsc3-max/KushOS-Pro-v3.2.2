// ══════════════════════════════════════════════════════════
// DEMO DATA — Realistic seeded data for demo mode
// ══════════════════════════════════════════════════════════

const DEMO_DATA = {

  grows: [
    { id:'d-g1', batch_id:'B-2025-01', strain:'OG Kush', room:'Room 1 — Flower', plant_count:16, grow_medium:'Coco/Perlite', light_schedule:'12/12', stage:'Flowering', stage_day:42, stage_target:63, health:'Good', start_date:'2025-03-10', notes:'Looking exceptional, trichomes developing well.', user_id:'demo' },
    { id:'d-g2', batch_id:'B-2025-02', strain:'Blue Dream', room:'Room 2 — Veg', plant_count:24, grow_medium:'Rockwool', light_schedule:'18/6', stage:'Vegetative', stage_day:18, stage_target:28, health:'Excellent', start_date:'2025-04-01', notes:'Fast growth, topped at day 14.', user_id:'demo' },
    { id:'d-g3', batch_id:'B-2025-03', strain:'Gorilla Glue #4', room:'Room 3 — Flower', plant_count:12, grow_medium:'Soil', light_schedule:'12/12', stage:'Flowering', stage_day:55, stage_target:70, health:'Monitor', start_date:'2025-02-20', notes:'Minor calcium deficiency corrected week 6.', user_id:'demo' },
    { id:'d-g4', batch_id:'B-2025-04', strain:'White Widow', room:'Room 2 — Veg', plant_count:20, grow_medium:'Coco/Perlite', light_schedule:'20/4', stage:'Seedling', stage_day:7, stage_target:14, health:'Good', start_date:'2025-04-15', notes:'New batch, healthy germination rate.', user_id:'demo' },
    { id:'d-g5', batch_id:'B-2024-12', strain:'Amnesia Haze', room:'Room 4 — Drying', plant_count:18, grow_medium:'Hydro DWC', light_schedule:'12/12', stage:'Drying', stage_day:8, stage_target:14, health:'Good', start_date:'2024-12-01', notes:'Harvest complete, drying in progress.', user_id:'demo' },
  ],

  rooms: [
    { id:'d-r1', name:'Room 1 — Flower', stage:'Flowering', capacity:20, current_plants:16, size_m2:12, status:'Active', notes:'HPS 1000W × 4, CO₂ supplemented' },
    { id:'d-r2', name:'Room 2 — Veg', stage:'Vegetative', capacity:30, current_plants:24, size_m2:8, status:'Active', notes:'LED full spectrum, 18/6 cycle' },
    { id:'d-r3', name:'Room 3 — Flower', stage:'Flowering', capacity:16, current_plants:12, size_m2:10, status:'Active', notes:'LED 800W × 3, sealed room' },
    { id:'d-r4', name:'Room 4 — Drying', stage:'Drying', capacity:50, current_plants:18, size_m2:6, status:'Active', notes:'60% RH target, 18°C, dark' },
    { id:'d-r5', name:'Nursery', stage:'Seedling', capacity:100, current_plants:20, size_m2:4, status:'Active', notes:'T5 fluorescent, humidity dome' },
  ],

  seasons: [
    { id:'d-s1', name:'Season 4', number:4, start_date:'2024-09-01', end_date:'2025-01-31', active:false, notes:'Strong yield season, 4 batches completed.' },
    { id:'d-s2', name:'Season 5', number:5, start_date:'2025-02-01', end_date:null, active:true, notes:'Current season, 5 batches running.' },
  ],

  sensor_logs: [
    { id:'d-sl1', room:'Room 1 — Flower', temp_c:24.8, humidity_rh:52.3, vpd_kpa:1.21, co2_ppm:1050, light_ppfd:820, ph:6.1, ec_ms:2.1, logged_at: new Date(Date.now()-600000).toISOString(), notes:null },
    { id:'d-sl2', room:'Room 2 — Veg', temp_c:26.2, humidity_rh:65.1, vpd_kpa:0.92, co2_ppm:900, light_ppfd:600, ph:5.9, ec_ms:1.4, logged_at: new Date(Date.now()-900000).toISOString(), notes:null },
    { id:'d-sl3', room:'Room 3 — Flower', temp_c:23.9, humidity_rh:48.7, vpd_kpa:1.35, co2_ppm:1100, light_ppfd:780, ph:6.2, ec_ms:2.3, logged_at: new Date(Date.now()-1200000).toISOString(), notes:null },
    { id:'d-sl4', room:'Room 4 — Drying', temp_c:18.2, humidity_rh:59.8, vpd_kpa:0.71, co2_ppm:520, light_ppfd:0, ph:null, ec_ms:null, logged_at: new Date(Date.now()-1800000).toISOString(), notes:'Dark period' },
    { id:'d-sl5', room:'Room 1 — Flower', temp_c:24.5, humidity_rh:53.1, vpd_kpa:1.18, co2_ppm:1030, light_ppfd:820, ph:6.0, ec_ms:2.0, logged_at: new Date(Date.now()-3600000).toISOString(), notes:null },
    { id:'d-sl6', room:'Room 2 — Veg', temp_c:25.8, humidity_rh:63.4, vpd_kpa:0.95, co2_ppm:880, light_ppfd:590, ph:5.8, ec_ms:1.3, logged_at: new Date(Date.now()-7200000).toISOString(), notes:null },
  ],

  harvests: [
    { id:'d-h1', batch_id:'B-2024-08', strain:'OG Kush', harvest_date:'2024-11-15', plant_count:16, wet_weight_g:4800, dry_weight_g:980, thc_pct:22.4, cbd_pct:0.3, grade:'AAA', lab_tested:true, lab_name:'Cape Labs', lab_report_url:'https://example.com', notes:'Best batch of the season.', user_id:'demo' },
    { id:'d-h2', batch_id:'B-2024-09', strain:'Blue Dream', harvest_date:'2024-12-02', plant_count:20, wet_weight_g:5600, dry_weight_g:1120, thc_pct:18.8, cbd_pct:0.8, grade:'AA', lab_tested:true, lab_name:'Cape Labs', lab_report_url:'https://example.com', notes:null, user_id:'demo' },
    { id:'d-h3', batch_id:'B-2024-10', strain:'Gorilla Glue #4', harvest_date:'2024-12-28', plant_count:14, wet_weight_g:3900, dry_weight_g:820, thc_pct:24.1, cbd_pct:0.2, grade:'AAA', lab_tested:false, lab_name:null, lab_report_url:null, notes:'Exceptional resin production.', user_id:'demo' },
    { id:'d-h4', batch_id:'B-2024-11', strain:'White Widow', harvest_date:'2025-01-20', plant_count:18, wet_weight_g:5100, dry_weight_g:1050, thc_pct:19.5, cbd_pct:0.5, grade:'AA', lab_tested:true, lab_name:'GreenTest ZA', lab_report_url:'https://example.com', notes:null, user_id:'demo' },
    { id:'d-h5', batch_id:'B-2024-12', strain:'Amnesia Haze', harvest_date:'2025-04-18', plant_count:18, wet_weight_g:5400, dry_weight_g:null, thc_pct:null, cbd_pct:null, grade:'AA', lab_tested:false, lab_name:null, lab_report_url:null, notes:'Currently drying.', user_id:'demo' },
  ],

  strains: [
    { id:'d-st1', name:'OG Kush', type:'Hybrid', lineage:'Chemdawg × Hindu Kush', flower_days:63, avg_yield_g:65, thc_pct:22.0, cbd_pct:0.3, difficulty:'Intermediate', status:'Active', notes:'Classic strain, dense buds.' },
    { id:'d-st2', name:'Blue Dream', type:'Sativa', lineage:'Blueberry × Haze', flower_days:70, avg_yield_g:58, thc_pct:19.0, cbd_pct:0.8, difficulty:'Easy', status:'Active', notes:'High yielder, smooth smoke.' },
    { id:'d-st3', name:'Gorilla Glue #4', type:'Hybrid', lineage:'Chem Sis × Sour Dubb × Chocolate Diesel', flower_days:68, avg_yield_g:60, thc_pct:24.0, cbd_pct:0.2, difficulty:'Intermediate', status:'Active', notes:'Extreme resin production.' },
    { id:'d-st4', name:'White Widow', type:'Hybrid', lineage:'Brazilian × South Indian', flower_days:60, avg_yield_g:55, thc_pct:19.5, cbd_pct:0.5, difficulty:'Easy', status:'Active', notes:'Beginner-friendly, reliable.' },
    { id:'d-st5', name:'Amnesia Haze', type:'Sativa', lineage:'Haze × Afghani × Hawaiian', flower_days:84, avg_yield_g:70, thc_pct:21.0, cbd_pct:0.3, difficulty:'Advanced', status:'Active', notes:'Long flower time, worth the wait.' },
    { id:'d-st6', name:'Northern Lights', type:'Indica', lineage:'Afghani × Thai', flower_days:56, avg_yield_g:50, thc_pct:18.0, cbd_pct:0.4, difficulty:'Easy', status:'Testing', notes:'Fast finisher, compact plants.' },
  ],

  tasks: [
    { id:'d-t1', title:'Feed Room 1 — Week 7 nutrient solution', due_date: new Date(Date.now()+86400000).toISOString().slice(0,10), priority:'High', batch_id:'B-2025-01', status:'pending', notes:'Increase PK boost this week.', user_id:'demo' },
    { id:'d-t2', title:'Check Room 3 calcium deficiency — foliar spray', due_date: new Date(Date.now()+172800000).toISOString().slice(0,10), priority:'High', batch_id:'B-2025-03', status:'pending', notes:'CaMg+ at 2ml/L.', user_id:'demo' },
    { id:'d-t3', title:'Flip Room 2 lights to 12/12 — Blue Dream ready', due_date: new Date(Date.now()+604800000).toISOString().slice(0,10), priority:'Medium', batch_id:'B-2025-02', status:'pending', notes:'Plants at 45cm, ready for flip.', user_id:'demo' },
    { id:'d-t4', title:'Weigh and jar Room 4 — Amnesia Haze dry check', due_date: new Date(Date.now()+518400000).toISOString().slice(0,10), priority:'Medium', batch_id:'B-2024-12', status:'pending', notes:'Target 10–12% moisture.', user_id:'demo' },
    { id:'d-t5', title:'Order nutrients — Flora Series running low', due_date: new Date(Date.now()+259200000).toISOString().slice(0,10), priority:'Low', batch_id:null, status:'pending', notes:'Flora Bloom, CalMag, Hydroguard.', user_id:'demo' },
    { id:'d-t6', title:'Deep clean Room 1 after harvest', due_date: new Date(Date.now()-86400000).toISOString().slice(0,10), priority:'Medium', batch_id:'B-2024-08', status:'done', notes:'H2O2 wash, replace rockwool slabs.', user_id:'demo' },
    { id:'d-t7', title:'Submit lab samples — GG#4 batch', due_date: new Date(Date.now()-172800000).toISOString().slice(0,10), priority:'High', batch_id:'B-2024-10', status:'done', notes:'Sent to Cape Labs.', user_id:'demo' },
  ],

  feed_logs: [
    { id:'d-f1', batch_id:'B-2025-01', feed_week:6, ph_in:6.1, ph_runoff:6.3, ec_ms:2.1, volume_l:24, nutrients:'Flora Bloom:8, CalMag:3, Hydroguard:2', logged_at: new Date(Date.now()-86400000).toISOString(), notes:null, user_id:'demo' },
    { id:'d-f2', batch_id:'B-2025-02', feed_week:2, ph_in:5.9, ph_runoff:6.0, ec_ms:1.4, volume_l:18, nutrients:'Flora Grow:10, CalMag:3', logged_at: new Date(Date.now()-172800000).toISOString(), notes:null, user_id:'demo' },
    { id:'d-f3', batch_id:'B-2025-03', feed_week:7, ph_in:6.2, ph_runoff:6.5, ec_ms:2.3, volume_l:20, nutrients:'Flora Bloom:10, PK13/14:3, CalMag:3', logged_at: new Date(Date.now()-259200000).toISOString(), notes:'Added CaMg to address deficiency.', user_id:'demo' },
    { id:'d-f4', batch_id:'B-2025-01', feed_week:5, ph_in:6.0, ph_runoff:6.2, ec_ms:1.9, volume_l:24, nutrients:'Flora Bloom:7, CalMag:3', logged_at: new Date(Date.now()-604800000).toISOString(), notes:null, user_id:'demo' },
  ],

  users: [
    { id:'d-u1', email:'admin@kushos.pro', role:'admin', active:true, access_code:'KUSHOS-ADMIN-001', created_at:'2025-01-01T00:00:00Z', last_login: new Date().toISOString() },
    { id:'d-u2', email:'grower1@kushos.pro', role:'grower', active:true, access_code:'GRWR-DEMO-002', created_at:'2025-02-01T00:00:00Z', last_login: new Date(Date.now()-86400000).toISOString() },
    { id:'d-u3', email:'grower2@kushos.pro', role:'grower', active:true, access_code:'GRWR-DEMO-003', created_at:'2025-03-01T00:00:00Z', last_login: new Date(Date.now()-604800000).toISOString() },
  ],
};

// ── Demo sensor history for chart (60 points per metric) ──
function generateDemoChartHistory() {
  const metrics = {
    temp: { base:24.5, range:2.5 },
    rh:   { base:52.0, range:8.0 },
    vpd:  { base:1.20, range:0.25 },
    co2:  { base:1050, range:120 },
    ph:   { base:6.1,  range:0.3 },
  };
  const out = {};
  Object.entries(metrics).forEach(([k, m]) => {
    const arr = [];
    let v = m.base;
    for (let i = 0; i < 60; i++) {
      v += (Math.random() - 0.49) * m.range * 0.18;
      v = Math.max(m.base - m.range, Math.min(m.base + m.range, v));
      arr.push(+v.toFixed(3));
    }
    out[k] = arr;
  });
  return out;
}
