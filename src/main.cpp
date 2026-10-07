#include <Arduino.h>
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <LittleFS.h>
#include <ESP32Servo.h>

const char* SSID = "PLDTHOMEFIBRVv6PH";
const char* PASSWORD = "PLDTWIFI2nCrH";

// --- HARDWARE PINOUT ---
const int SERVO_PIN = 4; // GPIO 4 connected to SG90 Signal wire

Servo steeringServo;
AsyncWebServer server(80);

void setup() {
    Serial.begin(115200);
    delay(1000);

    // 1. Initialize ESP32-C3 PWM timers for Servo
    ESP32PWM::allocateTimer(0);
    ESP32PWM::allocateTimer(1);
    steeringServo.setPeriodHertz(50);
    steeringServo.attach(SERVO_PIN, 500, 2400);
    steeringServo.write(90); // Center at boot

    // 2. Initialize LittleFS File System
    if (!LittleFS.begin(true)) {
        Serial.println("Error mounting LittleFS!");
        return;
    }

    // 3. Connect to Wi-Fi
    WiFi.persistent(false);
    WiFi.disconnect(true);
    delay(500);
    WiFi.mode(WIFI_STA);
    WiFi.begin(SSID, PASSWORD);

    Serial.print("Connecting to Wi-Fi");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nConnected!");
    Serial.print("Game Dashboard IP: http://");
    Serial.println(WiFi.localIP());

    // 4. API Endpoint to update Servo Angle from Web Dashboard
    server.on("/api/servo", HTTP_GET, [](AsyncWebServerRequest *request) {
        if (request->hasParam("angle")) {
            String val = request->getParam("angle")->value();
            int angle = constrain(val.toInt(), 0, 180);
            steeringServo.write(angle);
            request->send(200, "text/plain", "OK");
        } else {
            request->send(400, "text/plain", "Missing angle param");
        }
    });

    // 5. Serve Web Files from /data folder
    server.serveStatic("/", LittleFS, "/").setDefaultFile("index.html");

    server.begin();
}

void loop() {
    // Web server runs asynchronously in background
}