#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include "time.h"

// =============================================
// ===  CONFIGURATION — CHANGE THESE VALUES  ===
// =============================================

// WiFi Credentials
const char* ssid = "K";
const char* password = "keerthi@123";

// Supabase Config
const char* SUPABASE_URL = "https://tiiurnpxrpiunsfkvkxe.supabase.co";
const char* SUPABASE_ANON_KEY = "sb_publishable_j1Bln93RqmlWe7hH7TWjiw_0pU7XZja";

// User ID — change this for each user's fridge
// Must match a user_id in your Supabase 'users' table
String USER_ID = "5675673f-13c3-4ecf-805c-b415ab7eee20";

// NTP Settings (IST = UTC+5:30 = 19800 seconds)
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 19800;
const int   daylightOffset_sec = 0;

// =============================================
// ===  PIN DEFINITIONS                      ===
// =============================================
#define SS_PIN      5
#define RST_PIN     4
#define MQ2_PIN     34
#define MQ3_PIN     35
#define TRIG_PIN    14
#define ECHO_PIN    27
#define BUZZER_PIN  26

// =============================================
// ===  OBJECTS                              ===
// =============================================
LiquidCrystal_I2C lcd(0x27, 16, 2);
MFRC522 mfrc522(SS_PIN, RST_PIN);

// Authorized RFID UID (uppercase hex, space-separated)
String myCardUID = "03 FC 93";

// =============================================
// ===  VARIABLES                            ===
// =============================================
long duration;
float distance;

// Spoilage detection
int baseline1 = 0;
int baseline2 = 0;
int margin = 3;
int persistCount1 = 0;
int persistCount2 = 0;
int persistLimit = 5;

// Drop detection (item removal)
int lastPeak1 = 0;
int lastPeak2 = 0;
int dropThreshold = 5;

// Alert cooldown
unsigned long lastAlertTime = 0;
int alertCooldown = 5000;

// ── Supabase upload throttling ──
unsigned long lastGasUpload = 0;
const unsigned long GAS_UPLOAD_INTERVAL = 5000;  // Send gas readings every 5 seconds

// ── Door state tracking (only send on change) ──
String prevDoorState = "unknown";

// =============================================
// ===  SUPABASE HTTP HELPERS                ===
// =============================================

// Generic POST to Supabase REST API
bool supabasePost(String table, String jsonPayload) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi disconnected, skipping upload");
    return false;
  }

  HTTPClient http;
  String url = String(SUPABASE_URL) + "/rest/v1/" + table;

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
  http.addHeader("Prefer", "return=minimal");

  int httpCode = http.POST(jsonPayload);

  if (httpCode >= 200 && httpCode < 300) {
    Serial.println("✅ Uploaded to " + table);
    http.end();
    return true;
  } else {
    Serial.println("❌ Upload failed to " + table + " — HTTP " + String(httpCode));
    Serial.println("   Response: " + http.getString());
    http.end();
    return false;
  }
}

// ── Send gas readings ──
void sendGasReading(int mq2, int mq3, float dist, String doorState) {
  String json = "{";
  json += "\"user_id\":\"" + USER_ID + "\",";
  json += "\"mq2_percent\":" + String(mq2) + ",";
  json += "\"mq3_percent\":" + String(mq3) + ",";
  json += "\"distance_cm\":" + String(dist, 1) + ",";
  json += "\"door_state\":\"" + doorState + "\"";
  json += "}";

  supabasePost("fridge_gas_readings", json);
}

// ── Send door event ──
void sendDoorEvent(float dist, String doorState) {
  String json = "{";
  json += "\"user_id\":\"" + USER_ID + "\",";
  json += "\"distance_cm\":" + String(dist, 1) + ",";
  json += "\"door_state\":\"" + doorState + "\"";
  json += "}";

  supabasePost("fridge_door_events", json);
}

// ── Send RFID access log ──
void sendAccessLog(String cardUID, bool granted, String userType) {
  String json = "{";
  json += "\"user_id\":\"" + USER_ID + "\",";
  json += "\"card_uid\":\"" + cardUID + "\",";
  json += "\"access_granted\":" + String(granted ? "true" : "false") + ",";
  json += "\"user_type\":\"" + userType + "\"";
  json += "}";

  supabasePost("fridge_access_logs", json);
}

// ── Send spoilage alert ──
void sendSpoilageAlert(String shelf, int mq2, int mq3, bool isNightMode) {
  String json = "{";
  json += "\"user_id\":\"" + USER_ID + "\",";
  json += "\"shelf\":\"" + shelf + "\",";
  json += "\"mq2_percent\":" + String(mq2) + ",";
  json += "\"mq3_percent\":" + String(mq3) + ",";
  json += "\"night_mode\":" + String(isNightMode ? "true" : "false");
  json += "}";

  supabasePost("fridge_spoilage_alerts", json);
}

// =============================================
// ===  SETUP                                ===
// =============================================
void setup() {
  Serial.begin(115200);

  // WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" Connected!");
  Serial.println("IP: " + WiFi.localIP().toString());

  // NTP
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

  // SPI + RFID
  SPI.begin();
  mfrc522.PCD_Init();

  // Pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // LCD
  lcd.begin();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("SMART FRIDGE");
  lcd.setCursor(0, 1);
  lcd.print("CALIBRATING...");
  delay(2000);

  // Calibrate gas baselines
  baseline1 = map(analogRead(MQ2_PIN), 0, 4095, 0, 100);
  baseline2 = map(analogRead(MQ3_PIN), 0, 4095, 0, 100);
  lastPeak1 = baseline1;
  lastPeak2 = baseline2;

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("USER: " + USER_ID);
  lcd.setCursor(0, 1);
  lcd.print("Ready!");
  delay(1500);
  lcd.clear();

  Serial.println("=== Smart Fridge Ready ===");
  Serial.println("User ID: " + USER_ID);
  Serial.println("Supabase URL: " + String(SUPABASE_URL));
}

// =============================================
// ===  LOOP                                 ===
// =============================================
void loop() {

  // ── Time / Night Mode ──
  struct tm timeinfo;
  int hour = 12;
  if (getLocalTime(&timeinfo)) hour = timeinfo.tm_hour;
  bool nightMode = (hour >= 22 || hour <= 6);

  // ── Ultrasonic Sensor ──
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  duration = pulseIn(ECHO_PIN, HIGH);
  distance = duration * 0.034 / 2;

  // ── Gas Sensors ──
  int gasPercent1 = map(analogRead(MQ2_PIN), 0, 4095, 0, 100);
  int gasPercent2 = map(analogRead(MQ3_PIN), 0, 4095, 0, 100);

  // ── Door State ──
  String currentDoorState = (distance > 40) ? "closed" : "open";

  // ── Track Peak (for removal detection) ──
  if (gasPercent1 > lastPeak1 && gasPercent1 > baseline1 + margin)
    lastPeak1 = gasPercent1;
  if (gasPercent2 > lastPeak2 && gasPercent2 > baseline2 + margin)
    lastPeak2 = gasPercent2;

  // ── Detect Item Removal ──
  bool removed1 = (lastPeak1 > baseline1 + margin) && ((lastPeak1 - gasPercent1) >= dropThreshold);
  bool removed2 = (lastPeak2 > baseline2 + margin) && ((lastPeak2 - gasPercent2) >= dropThreshold);

  // ── UPLOAD: Gas Readings (throttled to every 5s) ──
  if (millis() - lastGasUpload >= GAS_UPLOAD_INTERVAL) {
    sendGasReading(gasPercent1, gasPercent2, distance, currentDoorState);
    lastGasUpload = millis();
  }

  // ── UPLOAD: Door State Change ──
  if (currentDoorState != prevDoorState) {
    sendDoorEvent(distance, currentDoorState);
    prevDoorState = currentDoorState;
    Serial.println("🚪 Door: " + currentDoorState);
  }

  // ── Spoilage Detection ──
  bool isDoorClosed = (distance > 40);
  bool shelf1Spoiled = false;
  bool shelf2Spoiled = false;

  if (isDoorClosed) {
    if (removed1) {
      persistCount1 = 0;
      lastPeak1 = gasPercent1;
    } else if (gasPercent1 > baseline1 + margin) {
      persistCount1++;
    } else {
      persistCount1 = 0;
    }

    if (removed2) {
      persistCount2 = 0;
      lastPeak2 = gasPercent2;
    } else if (gasPercent2 > baseline2 + margin) {
      persistCount2++;
    } else {
      persistCount2 = 0;
    }

    if (persistCount1 >= persistLimit) shelf1Spoiled = true;
    if (persistCount2 >= persistLimit) shelf2Spoiled = true;

    if ((shelf1Spoiled || shelf2Spoiled) && (millis() - lastAlertTime > alertCooldown)) {

      // Determine shelf
      String shelf = "both";
      if (shelf1Spoiled && !shelf2Spoiled) shelf = "shelf1";
      else if (!shelf1Spoiled && shelf2Spoiled) shelf = "shelf2";

      // LCD alert
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("SPOILAGE ALERT!");
      lcd.setCursor(0, 1);
      if (shelf == "both")   lcd.print("Shelf1 & Shelf2");
      else if (shelf == "shelf1") lcd.print("Shelf1 Spoiled");
      else                        lcd.print("Shelf2 Spoiled");

      // Buzzer
      if (nightMode) {
        digitalWrite(BUZZER_PIN, HIGH);
        delay(100);
        digitalWrite(BUZZER_PIN, LOW);
      } else {
        for (int i = 0; i < 2; i++) {
          digitalWrite(BUZZER_PIN, HIGH);
          delay(800);
          digitalWrite(BUZZER_PIN, LOW);
          delay(400);
        }
      }

      // ── UPLOAD: Spoilage Alert ──
      sendSpoilageAlert(shelf, gasPercent1, gasPercent2, nightMode);

      lastAlertTime = millis();
      persistCount1 = 0;
      persistCount2 = 0;

      delay(2000);
      lcd.clear();
    }
  }

  // ── LCD Display ──
  lcd.setCursor(0, 0);
  lcd.print("G1:"); lcd.print(gasPercent1); lcd.print("% ");
  lcd.print("G2:"); lcd.print(gasPercent2); lcd.print("% ");

  lcd.setCursor(0, 1);
  lcd.print("D:"); lcd.print(distance, 0); lcd.print("cm ");
  lcd.print(currentDoorState == "open" ? "OPEN " : "SHUT ");

  // ── RFID ──
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {

    String scannedUID = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
      scannedUID += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
      scannedUID += String(mfrc522.uid.uidByte[i], HEX);
      if (i < mfrc522.uid.size - 1) scannedUID += " ";
    }
    scannedUID.toUpperCase();

    lcd.clear();

    bool isAuthorized = (scannedUID.indexOf(myCardUID) >= 0);
    bool doorOpen = (distance < 40);

    if (isAuthorized && doorOpen) {
      // ✅ Adult, door is open → ACCESS GRANTED
      lcd.print("Access granted");
      lcd.setCursor(0, 1);
      lcd.print("Welcome Adult");

      digitalWrite(BUZZER_PIN, HIGH);
      delay(150);
      digitalWrite(BUZZER_PIN, LOW);

      // ── UPLOAD: Access Granted ──
      sendAccessLog(scannedUID, true, "adult");

    } else {
      // ❌ Denied
      lcd.print("Access Denied");
      lcd.setCursor(0, 1);

      String userType = "unknown";
      if (isAuthorized) {
        lcd.print("Child Detected");
        userType = "child";
      } else {
        lcd.print("Unknown User");
        userType = "unknown";
      }

      for (int i = 0; i < 5; i++) {
        digitalWrite(BUZZER_PIN, HIGH);
        delay(80);
        digitalWrite(BUZZER_PIN, LOW);
        delay(80);
      }

      // ── UPLOAD: Access Denied ──
      sendAccessLog(scannedUID, false, userType);
    }

    delay(2000);
    lcd.clear();
  }

  delay(200);
}
