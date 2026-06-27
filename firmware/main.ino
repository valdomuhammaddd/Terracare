/**
 * ============================================================================
 * TerraCare ESP32 Firmware — Event-Triggered Oximetry & Multi-Stage Thresholding
 * ============================================================================
 *
 * Thesis / Defense Overview:
 *   This firmware implements a power-efficient "wake-on-fall" pipeline. The
 *   MPU6050/LSM6DS3 IMU runs continuously at low duty. The MAX30102 oximeter
 *   remains idle until accelerometer heuristics cross configured thresholds.
 *   Upon a confirmed fall event, vitals are sampled for a short triage window
 *   and pushed to Supabase via HTTPS REST (service_role), triggering the React
 *   Native Emergency Overlay in real time.
 *
 * Hardware:
 *   - ESP32 (Wi-Fi)
 *   - MPU6050 / LSM6DS3 @ I2C (0x68 typical)
 *   - MAX30102 @ I2C (0x57 typical)
 *
 * Author: TerraCare IoT Team
 * Target: Arduino-ESP32 core (also portable to PlatformIO)
 * ============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <time.h>

// =============================================================================
// §1  CONFIGURATION — update before flashing
// =============================================================================

// --- Wi-Fi credentials -------------------------------------------------------
static const char *WIFI_SSID     = "YOUR_WIFI_SSID";
static const char *WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// --- Supabase REST API (service_role — NEVER ship to production clients) -----
// Prefer routing through a Supabase Edge Function in production; service_role
// is acceptable for controlled lab / thesis hardware prototypes.
static const char *SUPABASE_URL       = "https://YOUR_PROJECT.supabase.co";
static const char *SUPABASE_SERVICE_KEY = "YOUR_SUPABASE_SERVICE_ROLE_KEY";

// --- Device identity (must match rows in `devices` and `profiles` tables) ----
static const char *DEVICE_UUID = "00000000-0000-0000-0000-000000000000";
static const char *USER_UUID   = "00000000-0000-0000-0000-000000000000";
static const char *DEVICE_MAC  = "AA:BB:CC:DD:EE:01"; // Must match `devices.mac_address`

// --- Fall-detection thresholds (units: g, degrees, milliseconds) -------------
// Pulled from Supabase on heartbeat; defaults used until first successful fetch.
static float current_fall_threshold_g     = 2.5f;
static float current_angle_threshold_deg   = 60.0f;

static const float SOFT_FALL_RATIO         = 0.64f;  // soft impact = hard × ratio (~1.6g @ 2.5g)
static const float IMMOBILITY_THRESHOLD_G  = 0.25f;  // Stage-2: post-impact stillness
static const uint32_t IMMOBILITY_DURATION_MS = 3000; // Stage-2: 3 s silence window
static const uint32_t IMPACT_WINDOW_MS       = 500;  // Max time impact→immobility

// --- Oximetry sampling window ------------------------------------------------
static const uint32_t VITALS_SAMPLE_DURATION_MS = 8000; // 8 s event-triggered window
static const uint32_t VITALS_SAMPLE_INTERVAL_MS = 500;  // Read every 500 ms

// --- Telemetry loop timing ---------------------------------------------------
static const uint32_t IMU_SAMPLE_INTERVAL_MS    = 20;   // 50 Hz IMU polling
static const uint32_t HEARTBEAT_INTERVAL_MS     = 30000; // Device status ping
static const uint32_t WIFI_RECONNECT_INTERVAL_MS = 5000;

// --- I2C pin map (adjust for your PCB) ---------------------------------------
static const uint8_t I2C_SDA_PIN = 21;
static const uint8_t I2C_SCL_PIN = 22;

// =============================================================================
// §2  STATE MACHINE
// =============================================================================

enum SystemState {
  STATE_IDLE = 0,          // Normal monitoring — IMU only, oximeter sleep
  STATE_IMPACT_DETECTED,   // Transient: impact spike observed
  STATE_IMMOBILITY_CHECK,  // Soft-fall stage-2: verify stillness
  STATE_FALL_DETECTED,     // Fall confirmed — prepare oximeter
  STATE_READING_VITALS,    // Event-triggered SpO2 / HR acquisition
  STATE_SENDING_DATA,      // HTTPS POST to Supabase
};

static SystemState currentState = STATE_IDLE;

// =============================================================================
// §3  RUNTIME DATA STRUCTURES
// =============================================================================

struct ImuSample {
  float ax;
  float ay;
  float az;
  float svm; // Sum Vector Magnitude (√(ax²+ay²+az²)) in g
};

struct VitalSample {
  int heartRateBpm;
  int spo2Percent;
  bool valid;
};

struct FallContext {
  bool isHardFall;
  bool isSoftFall;
  unsigned long impactTimestampMs;
  unsigned long fallConfirmedTimestampMs;
  VitalSample lastVital;
};

static FallContext activeFall = {};
static ImuSample lastImu = {};

// Non-blocking timers (millis-based)
static unsigned long lastImuReadMs      = 0;
static unsigned long lastHeartbeatMs    = 0;
static unsigned long lastWifiAttemptMs  = 0;
static unsigned long stateEnteredMs     = 0;
static unsigned long immobilityStartMs  = 0;
static unsigned long vitalsWindowStartMs = 0;
static unsigned long lastVitalSampleMs  = 0;

// =============================================================================
// §4  FORWARD DECLARATIONS
// =============================================================================

void connectWiFi();
void ensureWiFi();
bool syncTimeNTP();
String iso8601UtcNow();

bool sensorsBegin();
bool readImu(ImuSample *out);
void oximeterWake();
void oximeterSleep();
bool readOximeter(VitalSample *out);

float calculateSvm(float ax, float ay, float az);
void resetFallContext();

bool postToSupabase(const char *tableName, const String &jsonPayload);
bool postEmergencyEvent(const char *fallType, const char *classification);
bool postVitalLog(int bpm, int spo2);
bool postDeviceHeartbeat(int batteryPercent, const char *status);
bool fetchDeviceConfig();

void transitionTo(SystemState nextState);
void runStateMachine();

// =============================================================================
// §5  ARDUINO ENTRY POINTS
// =============================================================================

void setup() {
  Serial.begin(115200);
  delay(500); // Boot settle only — not used in runtime loop

  Serial.println();
  Serial.println(F("============================================"));
  Serial.println(F(" TerraCare ESP32 — Event-Triggered Triage"));
  Serial.println(F("============================================"));

  // I2C + sensor placeholders
  if (!sensorsBegin()) {
    Serial.println(F("[WARN] Sensor init incomplete — running with stubs."));
  }

  connectWiFi();
  syncTimeNTP();
  fetchDeviceConfig(); // Initial pull — defaults retained on failure

  oximeterSleep(); // Power saving: oximeter off until fall detected
  stateEnteredMs = millis();
  Serial.println(F("[OK] Entering IDLE state — IMU monitoring active."));
}

void loop() {
  ensureWiFi();
  runStateMachine();

  // Periodic device heartbeat (battery + online status) + config sync
  if (millis() - lastHeartbeatMs >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatMs = millis();
    postDeviceHeartbeat(85, "online"); // Replace with ADC fuel-gauge read
    fetchDeviceConfig();               // Non-blocking relative to IMU loop (runs ~30 s)
  }
}

// =============================================================================
// §6  STATE MACHINE IMPLEMENTATION
// =============================================================================

void transitionTo(SystemState nextState) {
  currentState = nextState;
  stateEnteredMs = millis();

  switch (nextState) {
    case STATE_IDLE:
      oximeterSleep();
      resetFallContext();
      Serial.println(F("[FSM] → IDLE"));
      break;
    case STATE_IMPACT_DETECTED:
      Serial.println(F("[FSM] → IMPACT_DETECTED"));
      break;
    case STATE_IMMOBILITY_CHECK:
      immobilityStartMs = millis();
      Serial.println(F("[FSM] → IMMOBILITY_CHECK (soft-fall stage 2)"));
      break;
    case STATE_FALL_DETECTED:
      activeFall.fallConfirmedTimestampMs = millis();
      Serial.println(F("[FSM] → FALL_DETECTED — waking MAX30102"));
      oximeterWake();
      break;
    case STATE_READING_VITALS:
      vitalsWindowStartMs = millis();
      lastVitalSampleMs = 0;
      Serial.println(F("[FSM] → READING_VITALS (event-triggered oximetry)"));
      break;
    case STATE_SENDING_DATA:
      Serial.println(F("[FSM] → SENDING_DATA (Supabase REST)"));
      break;
  }
}

void runStateMachine() {
  const unsigned long now = millis();

  // --- Shared IMU sampling in all states except SENDING (non-blocking) ------
  if (currentState != STATE_SENDING_DATA && now - lastImuReadMs >= IMU_SAMPLE_INTERVAL_MS) {
    lastImuReadMs = now;
    readImu(&lastImu);
  }

  switch (currentState) {

    // -------------------------------------------------------------------------
    case STATE_IDLE: {
      // Stage-1 thresholding: Sum Vector Magnitude (SVM) impact detection
      const float softFallThresholdG = current_fall_threshold_g * SOFT_FALL_RATIO;

      if (lastImu.svm >= current_fall_threshold_g) {
        activeFall.isHardFall = true;
        activeFall.isSoftFall = false;
        activeFall.impactTimestampMs = now;
        transitionTo(STATE_FALL_DETECTED);
      } else if (lastImu.svm >= softFallThresholdG) {
        activeFall.isHardFall = false;
        activeFall.isSoftFall = true;
        activeFall.impactTimestampMs = now;
        transitionTo(STATE_IMPACT_DETECTED);
      }
      break;
    }

    // -------------------------------------------------------------------------
    case STATE_IMPACT_DETECTED: {
      // Wait briefly for either escalation to hard fall or immobility check
      if (lastImu.svm >= current_fall_threshold_g) {
        activeFall.isHardFall = true;
        transitionTo(STATE_FALL_DETECTED);
      } else if (now - activeFall.impactTimestampMs >= 200) {
        // Impact subsided — begin immobility/silence phase (soft fall stage 2)
        transitionTo(STATE_IMMOBILITY_CHECK);
      }
      break;
    }

    // -------------------------------------------------------------------------
    case STATE_IMMOBILITY_CHECK: {
      // Stage-2: subject must remain below immobility threshold
      // current_angle_threshold_deg reserved for gyro tilt validation (future hook)
      if (lastImu.svm >= current_fall_threshold_g) {
        activeFall.isHardFall = true;
        transitionTo(STATE_FALL_DETECTED);
        break;
      }

      if (lastImu.svm <= IMMOBILITY_THRESHOLD_G) {
        if (immobilityStartMs == 0) {
          immobilityStartMs = now;
        } else if (now - immobilityStartMs >= IMMOBILITY_DURATION_MS) {
          // Confirmed soft fall: impact + sustained immobility
          transitionTo(STATE_FALL_DETECTED);
        }
      } else {
        immobilityStartMs = 0; // Movement resumed — reset immobility timer
      }

      // Timeout: false alarm if no immobility within impact window
      if (now - activeFall.impactTimestampMs > IMPACT_WINDOW_MS + IMMOBILITY_DURATION_MS) {
        Serial.println(F("[FSM] Soft-fall window expired — returning to IDLE."));
        transitionTo(STATE_IDLE);
      }
      break;
    }

    // -------------------------------------------------------------------------
    case STATE_FALL_DETECTED: {
      // Single tick: immediately start oximetry window
      transitionTo(STATE_READING_VITALS);
      break;
    }

    // -------------------------------------------------------------------------
    case STATE_READING_VITALS: {
      if (now - vitalsWindowStartMs >= VITALS_SAMPLE_DURATION_MS) {
        transitionTo(STATE_SENDING_DATA);
        break;
      }

      if (now - lastVitalSampleMs >= VITALS_SAMPLE_INTERVAL_MS) {
        lastVitalSampleMs = now;
        VitalSample sample;
        if (readOximeter(&sample) && sample.valid) {
          activeFall.lastVital = sample; // Keep best/latest reading
          Serial.printf("[VITALS] HR=%d BPM, SpO2=%d%%\n",
                        sample.heartRateBpm, sample.spo2Percent);
        }
      }
      break;
    }

    // -------------------------------------------------------------------------
    case STATE_SENDING_DATA: {
      const char *fallType = activeFall.isHardFall ? "hard" : "soft";
      const char *classification = activeFall.isHardFall ? "confirmed_fall" : "suspected_fall";

      bool eventOk = postEmergencyEvent(fallType, classification);
      bool vitalOk = false;

      if (activeFall.lastVital.valid) {
        vitalOk = postVitalLog(activeFall.lastVital.heartRateBpm,
                               activeFall.lastVital.spo2Percent);
      } else {
        Serial.println(F("[WARN] No valid vitals — posting emergency event only."));
        vitalOk = true; // Do not block recovery if PPG failed
      }

      if (eventOk && vitalOk) {
        Serial.println(F("[OK] Supabase ingest complete."));
      } else {
        Serial.println(F("[ERR] Supabase ingest partial/failed — will retry next event."));
      }

      transitionTo(STATE_IDLE);
      break;
    }
  }
}

// =============================================================================
// §7  SENSOR LAYER (placeholders — swap with real I2C drivers)
// =============================================================================

/**
 * Initialize I2C bus and IMU / MAX30102.
 * Replace stubs with Adafruit_MPU6050, SparkFun LSM6DS3, or SparkFun MAX30105 libs.
 */
bool sensorsBegin() {
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  Wire.setClock(400000);
  Serial.println(F("[SENSORS] I2C initialized (400 kHz)."));
  // TODO: imu.begin(); max3010x.begin();
  return true;
}

/**
 * Read accelerometer and compute SVM in g.
 * Stub returns synthetic gravity vector (~1g) with noise for bench testing.
 */
bool readImu(ImuSample *out) {
  if (out == nullptr) return false;

  // --- PLACEHOLDER: replace with real IMU read -----------------
  // imu.getEvent(&accel, &gyro, &temp);
  // out->ax = accel.acceleration.x / 9.80665f;
  // out->ay = accel.acceleration.y / 9.80665f;
  // out->az = accel.acceleration.z / 9.80665f;

  // Bench stub: 1g on Z-axis + small noise (remove in production)
  out->ax = 0.02f * (random(-100, 100) / 100.0f);
  out->ay = 0.02f * (random(-100, 100) / 100.0f);
  out->az = 1.0f + 0.01f * (random(-100, 100) / 100.0f);
  // ---------------------------------------------------------------

  out->svm = calculateSvm(out->ax, out->ay, out->az);
  return true;
}

void oximeterWake() {
  Serial.println(F("[MAX30102] Wake — SpO2/HR engine enabled."));
  // TODO: max3010x.setLEDMode(); max3010x.setPulseAmplitudeRed(0x1F);
}

void oximeterSleep() {
  Serial.println(F("[MAX30102] Sleep — low-power mode."));
  // TODO: max3010x.shutDown();
}

/**
 * Read a single HR / SpO2 estimate from MAX30102 FIFO.
 * Stub returns plausible resting vitals after sensor warm-up.
 */
bool readOximeter(VitalSample *out) {
  if (out == nullptr) return false;

  // --- PLACEHOLDER: integrate MAX30102 library -------------------
  // while (particleSensor.available()) { particleSensor.nextSample(); ... }
  out->heartRateBpm = 72 + random(-3, 4);
  out->spo2Percent  = 96 + random(-2, 3);
  out->valid = true;
  // ---------------------------------------------------------------
  return true;
}

float calculateSvm(float ax, float ay, float az) {
  return sqrtf(ax * ax + ay * ay + az * az);
}

void resetFallContext() {
  activeFall = {};
  immobilityStartMs = 0;
}

// =============================================================================
// §8  NETWORKING — Wi-Fi + Supabase REST
// =============================================================================

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.printf("[WiFi] Connecting to %s ", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  const unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(250);
    Serial.print('.');
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print(F("[WiFi] Connected. IP: "));
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(F("[WiFi] Connection failed — will retry in loop."));
  }
}

void ensureWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  const unsigned long now = millis();
  if (now - lastWifiAttemptMs >= WIFI_RECONNECT_INTERVAL_MS) {
    lastWifiAttemptMs = now;
    Serial.println(F("[WiFi] Reconnecting..."));
    connectWiFi();
    if (WiFi.status() == WL_CONNECTED) {
      syncTimeNTP();
    }
  }
}

bool syncTimeNTP() {
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  struct tm timeinfo;
  for (uint8_t i = 0; i < 10; i++) {
    if (getLocalTime(&timeinfo, 500)) {
      Serial.println(F("[NTP] Time synchronized (UTC)."));
      return true;
    }
  }
  Serial.println(F("[NTP] Time sync failed — timestamps may be inaccurate."));
  return false;
}

String iso8601UtcNow() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo, 100)) {
    return "1970-01-01T00:00:00Z";
  }
  char buffer[32];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buffer);
}

/**
 * Generic Supabase REST insert helper.
 *
 * POST {SUPABASE_URL}/rest/v1/{tableName}
 * Headers:
 *   apikey:              service_role key
 *   Authorization:       Bearer {service_role key}
 *   Content-Type:        application/json
 *   Prefer:              return=minimal
 */
bool postToSupabase(const char *tableName, const String &jsonPayload) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("[HTTP] Skipped — Wi-Fi down."));
    return false;
  }

  WiFiClientSecure client;
  client.setInsecure(); // Thesis/lab: skip cert validation. Use root CA in production.

  HTTPClient http;
  String url = String(SUPABASE_URL) + "/rest/v1/" + tableName;

  if (!http.begin(client, url)) {
    Serial.println(F("[HTTP] begin() failed."));
    return false;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_SERVICE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_SERVICE_KEY);
  http.addHeader("Prefer", "return=minimal");

  Serial.printf("[HTTP] POST %s\n", url.c_str());
  Serial.printf("[HTTP] Body: %s\n", jsonPayload.c_str());

  const int statusCode = http.POST(jsonPayload);
  const bool success = statusCode >= 200 && statusCode < 300;

  if (success) {
    Serial.printf("[HTTP] Success (%d)\n", statusCode);
  } else {
    Serial.printf("[HTTP] Failed (%d): %s\n", statusCode, http.getString().c_str());
  }

  http.end();
  return success;
}

bool postEmergencyEvent(const char *fallType, const char *classification) {
  StaticJsonDocument<384> doc;
  doc["device_id"]        = DEVICE_UUID;
  doc["user_id"]          = USER_UUID;
  doc["fall_type"]        = fallType;
  doc["classification"]   = classification;
  doc["handled_status"]   = "pending";
  doc["triggered_at"]     = iso8601UtcNow();

  String payload;
  serializeJson(doc, payload);
  return postToSupabase("emergency_events", payload);
}

bool postVitalLog(int bpm, int spo2) {
  StaticJsonDocument<256> doc;
  doc["device_id"]       = DEVICE_UUID;
  doc["user_id"]         = USER_UUID;
  doc["heart_rate_bpm"]  = bpm;
  doc["spo2_percent"]    = spo2;
  doc["recorded_at"]     = iso8601UtcNow();

  String payload;
  serializeJson(doc, payload);
  return postToSupabase("vital_logs", payload);
}

bool postDeviceHeartbeat(int batteryPercent, const char *status) {
  StaticJsonDocument<192> doc;
  doc["battery_level"] = batteryPercent;
  doc["status"]        = status;
  doc["last_seen_at"]  = iso8601UtcNow();

  String payload;
  serializeJson(doc, payload);

  if (WiFi.status() != WL_CONNECTED) return false;

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  // PATCH specific device row by UUID
  String url = String(SUPABASE_URL) + "/rest/v1/devices?id=eq." + DEVICE_UUID;
  if (!http.begin(client, url)) return false;

  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_SERVICE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_SERVICE_KEY);
  http.addHeader("Prefer", "return=minimal");

  const int statusCode = http.PATCH(payload);
  http.end();
  return statusCode >= 200 && statusCode < 300;
}

/**
 * Pull fall_threshold_g and angle_threshold_deg from Supabase by MAC address.
 * Called on boot and after each 30 s heartbeat — never from the IMU loop.
 * On HTTP/JSON failure, retains the last known (or default) thresholds.
 */
bool fetchDeviceConfig() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("[CONFIG] Skipped — Wi-Fi down."));
    return false;
  }

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  // PostgREST: quote MAC so colons are parsed correctly
  String url = String(SUPABASE_URL)
               + "/rest/v1/devices?mac_address=eq.%22"
               + DEVICE_MAC
               + "%22&select=fall_threshold_g,angle_threshold_deg";

  if (!http.begin(client, url)) {
    Serial.println(F("[CONFIG] HTTP begin() failed."));
    return false;
  }

  http.addHeader("apikey", SUPABASE_SERVICE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_SERVICE_KEY);
  http.setTimeout(8000);

  const int statusCode = http.GET();

  if (statusCode < 200 || statusCode >= 300) {
    Serial.printf("[CONFIG] GET failed (%d): %s\n", statusCode, http.getString().c_str());
    http.end();
    return false;
  }

  const String responseBody = http.getString();
  http.end();

  StaticJsonDocument<512> doc;
  const DeserializationError parseError = deserializeJson(doc, responseBody);

  if (parseError) {
    Serial.printf("[CONFIG] JSON parse error: %s\n", parseError.c_str());
    return false;
  }

  if (!doc.is<JsonArray>() || doc.size() == 0) {
    Serial.println(F("[CONFIG] No device row returned — keeping current thresholds."));
    return false;
  }

  JsonObject row = doc[0].as<JsonObject>();
  if (row.isNull()) {
    Serial.println(F("[CONFIG] Empty device object — keeping current thresholds."));
    return false;
  }

  const float fallG = row["fall_threshold_g"] | current_fall_threshold_g;
  const float angleDeg = row["angle_threshold_deg"] | current_angle_threshold_deg;

  // Clamp to sane ranges (matches DB constraints)
  current_fall_threshold_g = constrain(fallG, 0.5f, 10.0f);
  current_angle_threshold_deg = constrain(angleDeg, 0.0f, 90.0f);

  Serial.printf("⚙️ Config Pulled: Fall=%.1fg, Angle=%.0f°\n",
                current_fall_threshold_g,
                current_angle_threshold_deg);

  return true;
}
