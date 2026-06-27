/**
 * TerraCare — ESP32 Hardware Simulator
 * --------------------------------------
 * Simulates firmware heartbeat, vital_logs streaming, and emergency_events
 * so you can test Dashboard / AdminDashboard / EmergencyOverlay without hardware.
 *
 * Usage:
 *   cd scripts
 *   cp .env.example .env   # fill in Supabase URL, service_role key, user UUID
 *   npm install
 *   node simulate_esp32.js
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env from scripts/ first, then repo root
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEST_USER_ID = process.env.TEST_USER_ID;
const TEST_DEVICE_MAC = process.env.TEST_DEVICE_MAC || 'AA:BB:CC:DD:EE:01';
const TEST_DEVICE_NAME = process.env.TEST_DEVICE_NAME || 'Simulator-ESP32';

const VITAL_INTERVAL_MS = 3000;
const EMERGENCY_AFTER_MS = 15_000;
const EMERGENCY_WAIT_MS = 20_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isoNow() {
  return new Date().toISOString();
}

function validateEnv() {
  const missing = [];
  if (!SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_KEY');
  if (!TEST_USER_ID) missing.push('TEST_USER_ID');

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    console.error('   Copy scripts/.env.example → scripts/.env and fill in values.');
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Supabase client (service_role bypasses RLS)
// ---------------------------------------------------------------------------

validateEnv();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---------------------------------------------------------------------------
// Runtime state
// ---------------------------------------------------------------------------

/** @type {{ id: string; user_id: string; mac_address: string } | null} */
let activeDevice = null;

/** @type {string | null} */
let activeEmergencyId = null;

let normalPhaseStartedAt = Date.now();
let emergencyTriggeredThisCycle = false;
let waitingForEmergencyResolution = false;
let emergencyWaitStartedAt = 0;

// ---------------------------------------------------------------------------
// Database operations
// ---------------------------------------------------------------------------

async function ensureTestDevice() {
  log('🔍 Checking for simulator device...');

  const { data: existing, error: selectError } = await supabase
    .from('devices')
    .select('id, user_id, mac_address, name, battery_level, status')
    .eq('mac_address', TEST_DEVICE_MAC)
    .maybeSingle();

  if (selectError) {
    throw new Error(`Device lookup failed: ${selectError.message}`);
  }

  if (existing) {
    log(`✅ Found existing device: ${existing.name} (${existing.id})`);
    return existing;
  }

  log('📦 No device found — seeding dummy ESP32 device...');

  const { data: inserted, error: insertError } = await supabase
    .from('devices')
    .insert({
      user_id: TEST_USER_ID,
      mac_address: TEST_DEVICE_MAC,
      name: TEST_DEVICE_NAME,
      battery_level: 92,
      status: 'online',
      last_seen_at: isoNow(),
    })
    .select('id, user_id, mac_address, name, battery_level, status')
    .single();

  if (insertError) {
    throw new Error(`Device seed failed: ${insertError.message}`);
  }

  log(`✅ Seeded device: ${inserted.name} (${inserted.id})`);
  return inserted;
}

async function sendNormalVitals() {
  const heartRate = randomInt(75, 85);
  const spo2 = randomInt(97, 99);

  const { error } = await supabase.from('vital_logs').insert({
    device_id: activeDevice.id,
    user_id: activeDevice.user_id,
    heart_rate_bpm: heartRate,
    spo2_percent: spo2,
    recorded_at: isoNow(),
  });

  if (error) {
    log(`❌ vital_logs insert failed: ${error.message}`);
    return;
  }

  log(`📡 Sending normal vitals… HR=${heartRate} BPM, SpO₂=${spo2}%`);
}

async function updateDeviceTelemetry() {
  const batteryLevel = randomInt(65, 100);
  const status = batteryLevel <= 20 ? 'low_battery' : 'online';

  const { error } = await supabase
    .from('devices')
    .update({
      battery_level: batteryLevel,
      status,
      last_seen_at: isoNow(),
    })
    .eq('id', activeDevice.id);

  if (error) {
    log(`❌ devices update failed: ${error.message}`);
    return;
  }

  log(`🔋 Battery updated → ${batteryLevel}% (${status})`);
}

async function triggerEmergency() {
  log('🚨 TRIGGERING EMERGENCY!');
  log('   Classification: Pingsan Terdeteksi (Soft Fall) → DB: suspected_fall');

  const { data, error } = await supabase
    .from('emergency_events')
    .insert({
      device_id: activeDevice.id,
      user_id: activeDevice.user_id,
      fall_type: 'soft',
      classification: 'suspected_fall',
      handled_status: 'pending',
      triggered_at: isoNow(),
    })
    .select('id, handled_status')
    .single();

  if (error) {
    log(`❌ emergency_events insert failed: ${error.message}`);
    return;
  }

  activeEmergencyId = data.id;
  waitingForEmergencyResolution = true;
  emergencyWaitStartedAt = Date.now();

  log(`🚨 Emergency event created: ${data.id} (handled_status=pending)`);

  // Post-fall vitals (event-triggered oximetry simulation)
  const postFallHr = randomInt(88, 102);
  const postFallSpo2 = randomInt(93, 96);

  const { error: vitalError } = await supabase.from('vital_logs').insert({
    device_id: activeDevice.id,
    user_id: activeDevice.user_id,
    heart_rate_bpm: postFallHr,
    spo2_percent: postFallSpo2,
    recorded_at: isoNow(),
  });

  if (vitalError) {
    log(`⚠️  Post-fall vitals failed: ${vitalError.message}`);
  } else {
    log(`🩺 Post-fall vitals sent → HR=${postFallHr} BPM, SpO₂=${postFallSpo2}%`);
  }
}

async function checkEmergencyResolved() {
  if (!activeEmergencyId) return false;

  const { data, error } = await supabase
    .from('emergency_events')
    .select('id, handled_status')
    .eq('id', activeEmergencyId)
    .maybeSingle();

  if (error) {
    log(`⚠️  Emergency status check failed: ${error.message}`);
    return false;
  }

  if (!data) return false;

  const resolved = data.handled_status === 'resolved' || data.handled_status === 'false_positive';

  if (resolved) {
    log(`✅ Emergency ${activeEmergencyId} marked ${data.handled_status} — resuming normal operation.`);
    activeEmergencyId = null;
    waitingForEmergencyResolution = false;
    emergencyTriggeredThisCycle = false;
    normalPhaseStartedAt = Date.now();
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

async function tick() {
  if (!activeDevice) return;

  const now = Date.now();

  if (waitingForEmergencyResolution) {
    await checkEmergencyResolved();

    if (now - emergencyWaitStartedAt >= EMERGENCY_WAIT_MS && waitingForEmergencyResolution) {
      log('⏱️  20s emergency window elapsed — resuming normal vitals (event may still be pending).');
      waitingForEmergencyResolution = false;
      emergencyTriggeredThisCycle = false;
      normalPhaseStartedAt = Date.now();
      activeEmergencyId = null;
    } else if (waitingForEmergencyResolution) {
      log('⏳ Waiting for emergency dismissal or 20s timeout…');
      return;
    }
  }

  if (!emergencyTriggeredThisCycle && now - normalPhaseStartedAt >= EMERGENCY_AFTER_MS) {
    emergencyTriggeredThisCycle = true;
    await triggerEmergency();
    return;
  }

  await sendNormalVitals();
  await updateDeviceTelemetry();
}

async function main() {
  log('🚀 TerraCare ESP32 Simulator starting…');
  log(`   Supabase: ${SUPABASE_URL}`);
  log(`   User ID:  ${TEST_USER_ID}`);
  log(`   MAC:      ${TEST_DEVICE_MAC}`);

  activeDevice = await ensureTestDevice();

  log(`💓 Normal vitals every ${VITAL_INTERVAL_MS / 1000}s`);
  log(`🚨 Emergency triggers after ${EMERGENCY_AFTER_MS / 1000}s of normal operation`);
  log('   Press Ctrl+C to stop.\n');

  await tick();
  setInterval(() => {
    tick().catch((err) => log(`❌ Tick error: ${err.message}`));
  }, VITAL_INTERVAL_MS);
}

main().catch((err) => {
  console.error('❌ Simulator crashed:', err.message);
  process.exit(1);
});
