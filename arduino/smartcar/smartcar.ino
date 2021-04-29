#include <Smartcar.h>
#include <MQTT.h>
#include <WiFi.h>

#ifdef __SMCE__
#include <OV767X.h>
#include <vector>
#include <string>
#endif
#if defined(__has_include) && __has_include("secrets.hpp")
#include "secrets.hpp"
#endif

const auto oneSecond = 1000UL;
const auto threeSeconds = 3000UL;
const auto fixSeconds = 5000UL;
const unsigned long PRINT_INTERVAL = 1000;
const unsigned long DETECT_INTERVAL_MED = 5000;
const unsigned long DETECT_INTERVAL_SHORT = 2000;
unsigned long previousPrintout     = 0;
unsigned long detectionTime = 0;
unsigned long detectionTime2 = 0;
unsigned long detectionTimeReverse = 0;
const auto pulsesPerMeter = 600;
unsigned long currentTime = millis();

boolean initialTurn = true;
int startDistance = 0;
float startSpeed = 0;
int startAngle = 0;
signed int turnAngle = 0;
signed int throttle = 30;

boolean cruiseControl = false;

enum DrivingMode {
  MANUAL,
  STARTUP,
  EXPLORE,
  SLOW,
  REVERSE,
  AVOIDFRONT,
  AVOIDRIGHT,
  AVOIDLEFT,
  UNSTUCK
};

enum CarSensor {
  FRONTUS,
  FRONTIR,
  BACKIR,
  LEFTIR,
  RIGHTIR
};

DrivingMode currentMode = STARTUP;
CarSensor sensor = FRONTUS;

ArduinoRuntime arduinoRuntime;
BrushedMotor leftMotor(arduinoRuntime, smartcarlib::pins::v2::leftMotorPins);
BrushedMotor rightMotor(arduinoRuntime, smartcarlib::pins::v2::rightMotorPins);
DifferentialControl control(leftMotor, rightMotor);

typedef GP2Y0A02 IR;
IR frontIR(arduinoRuntime, 0);
IR leftIR(arduinoRuntime, 1);
IR rightIR(arduinoRuntime, 2);
IR backIR(arduinoRuntime, 3);

SR04 frontUS(arduinoRuntime, 6, 7, 400);
const int GYROSCOPE_OFFSET = 37;
GY50 gyroscope(arduinoRuntime, GYROSCOPE_OFFSET);
std::vector<char> frameBuffer;

DirectionlessOdometer leftOdometer{
  arduinoRuntime,
  smartcarlib::pins::v2::leftOdometerPin,
  []() { leftOdometer.update(); },
  pulsesPerMeter};
DirectionlessOdometer rightOdometer{
  arduinoRuntime,
  smartcarlib::pins::v2::rightOdometerPin,
  []() { rightOdometer.update(); },
  pulsesPerMeter};

MQTTClient mqtt;
#ifndef __SMCE__
WiFiClient net;
#endif

SmartCar car(arduinoRuntime, control, gyroscope, leftOdometer, rightOdometer);

void setup()
{
  Serial.begin(9600);
  // car.setSpeed(30); // Maintain a speed of 1.5 m/sec

  // Start the camera and connect to MQTT broker
  #ifdef __SMCE__
    Camera.begin(QVGA, RGB888, 15);
    frameBuffer.resize(Camera.width() * Camera.height() * Camera.bytesPerPixel());
    mqtt.setKeepAlive(30);
    mqtt.begin(host, port, WiFi);
  #else
    mqtt.begin(net);
  #endif
    if (mqtt.connect(clientId, username, password)) {
        mqtt.subscribe("smartRover/#", 1);
        mqtt.onMessage([](String topic, String message) {
          String messageReceived = message + " on topic: " + topic;
          Serial.println(messageReceived);
          if (topic == "smartRover/control/throttle") {
            throttle += (message.toInt());
            currentMode = MANUAL;
            detectionTime = currentTime;
            turnAngle = 0;
            cruiseControl = false;
          } else if (topic == "smartRover/control/turnAngle") {
            turnAngle += (message.toInt());
            currentMode = MANUAL;
            detectionTime = currentTime;
            cruiseControl = false;
          } else if (topic == "smartRover/control/stop") {
            throttle = 0;
          } else if (topic == "smartRover/console/throttle") {
            throttle = message.toInt();
            currentMode = MANUAL;
            detectionTime = currentTime;
            cruiseControl = false;
          } else if (topic == "smartRover/console/turnAngle") {
            turnAngle = message.toInt();
            currentMode = MANUAL;
            detectionTime = currentTime;
            cruiseControl = false;
          } else if (topic == "smartRover/control/stop") {
            throttle = 0;
            turnAngle = 0;
            currentMode = MANUAL;
            detectionTime = currentTime;
            cruiseControl = false;
          } else if (topic == "smartRover/cruiseControl") {
            if (message.toInt() == 1) {
              currentMode = EXPLORE;
              cruiseControl = true;
            } else if (message.toInt() == 0) {
              currentMode = MANUAL;
              cruiseControl = false;
            }
          }
        });
  }

  // Start with random speed, random angle and goes random distance before starting "explore" mode
  startDistance = (rand() % 100) + 50;
  startSpeed = static_cast <float> (rand() % 40) + 20;
  startAngle = (rand() % 45) - 45;

  Serial.print("Start speed: ");
  Serial.println(startSpeed);
  Serial.print("Start angle: ");
  Serial.println(startAngle);
  Serial.print("Start distance: ");
  Serial.println(startDistance);
}

void loop()
{
  // if connect to MQTT, then listen ...
  if (isConnected())
  {
    mqtt.loop();
    currentTime = millis();
  #ifdef __SMCE__

    static auto previousFrame = 0UL;
    if (currentTime - previousFrame >= 65) {
      previousFrame = currentTime;
      Camera.readFrame(frameBuffer.data());
      int bufferSize = (int) frameBuffer.size();
      mqtt.publish("marsOrbiter/camera", frameBuffer.data(), bufferSize, false, 0);
    }
  #endif
    static auto previousTransmission = 0UL;
    if (currentTime - previousTransmission >= oneSecond) {
      previousTransmission = currentTime;
      //integers to String
      const auto throttleS = String((float) throttle);
      gyroscope.update();
      const auto headingS = String(gyroscope.getHeading());
      const auto speedS = String(car.getSpeed());
      const auto angleS = String(turnAngle);
      const auto distanceS = String(getMedianDistance());
      mqtt.publish("marsOrbiter/telemetry/heading", headingS);
      mqtt.publish("marsOrbiter/telemetry/throttle", throttleS);
      mqtt.publish("marsOrbiter/telemetry/speed", speedS);
      mqtt.publish("marsOrbiter/telemetry/turnAngle", angleS);
      mqtt.publish("marsOrbiter/telemetry/totalDistance", distanceS );
    }

    if (currentTime - previousTransmission >= threeSeconds) {
      previousTransmission = currentTime;
      mqtt.publish("marsOrbiter/control/mode", reportMode());
    }
    
  #ifdef __SMCE__
    // Avoid over-using the CPU if we are running in the emulator
    delay(50);
  #endif
  }

  // Monitor for driving modes
  switch (currentMode)
  {
    case MANUAL:
      manualMove();
      break;
    case STARTUP:
      startupMove();
      break;
    case EXPLORE:
      moveForward();
      currentMode = monitorForward();
      break;
    case SLOW:
      moveSlow();
      currentMode = monitorSlowForward();
      break;
    case REVERSE:
      moveBackward();
      currentMode = monitorBackward();
      break;
    case AVOIDFRONT:
      avoidFront();
      currentMode = monitorFrontAvoidance();
      break;
    case AVOIDRIGHT:
      avoidRight();
      currentMode = monitorRightAvoidance();
      break;
    case AVOIDLEFT:
      avoidLeft();
      currentMode = monitorLeftAvoidance();
      break;
    case UNSTUCK:
      unstuckBack();
      break;
    default:
      moveSlow();
      break;
  }

  // Keep printing out the current heading
  currentTime = millis();
  if (currentTime >= previousPrintout + PRINT_INTERVAL)
  {
    previousPrintout = currentTime;

    Serial.print("Heading: ");
    Serial.println(car.getHeading());
    Serial.print("Throttle: ");
    Serial.println(throttle );
    Serial.print("Speed: ");
    Serial.println(car.getSpeed());
    Serial.print("Angle: ");
    Serial.println(turnAngle);
    Serial.print("Distance");
    Serial.println(getMedianDistance());
    Serial.println();
  }

  if (cruiseControl) {

    if (currentTime >= detectionTime + DETECT_INTERVAL_MED)
    {
      detectionTime = currentTime;
      int usDistance = getSensorData(FRONTUS);
      int irDistance = getSensorData(FRONTIR);

      if (currentMode == MANUAL) {
        currentMode = EXPLORE;
      }

      if ((usDistance == 0 && irDistance == 0 && currentMode == SLOW)) {
        currentMode = EXPLORE;
      }

      if (currentMode == UNSTUCK && irDistance == 0 && usDistance > 200) {
        currentMode = SLOW;
      }
    }

    if (currentTime >= detectionTime2 + DETECT_INTERVAL_SHORT)
    {
      detectionTime2 = currentTime;
      float currentSpeed = getSpeedData();

      if (currentSpeed >= 0 && currentSpeed < 0.025) {
        currentMode = UNSTUCK;
        unstuckBack();
      }
    }
    
    if (currentTime >= detectionTimeReverse + 5000 && currentMode == REVERSE)
    {
      currentMode = EXPLORE;
    }
  }
}

void startupMove() {

  // String currentMode = "startUp";
  turnAngle = startAngle;
  car.setAngle(turnAngle);
  car.setSpeed(startSpeed);
  long distanceLeft = leftOdometer.getDistance();
  long distanceRight = rightOdometer.getDistance();

  if (distanceLeft > startDistance || distanceRight > startDistance) {
    turnAngle = 0;
    car.setAngle(turnAngle);
    initialTurn = false;
    
    if (cruiseControl) {
      currentMode = EXPLORE;
    } else {
      currentMode = MANUAL;
      }
  }
}

double getMedianDistance() {
  long distanceLeft = leftOdometer.getDistance();
  long distanceRight = rightOdometer.getDistance();

  return (distanceLeft + distanceRight) / 2;
}

void manualMove() {
  currentMode = MANUAL;
  car.setSpeed((float) throttle);
  car.setAngle(turnAngle);
}

DrivingMode monitorForward() {
  currentMode = EXPLORE;
  int usDistance = getSensorData(FRONTUS);
  int irDistance = getSensorData(FRONTIR);

  if ((usDistance > 0 && usDistance < 250) || (usDistance > 0 && usDistance < 100 && irDistance < 40)) {
    currentMode = SLOW;
    moveSlow();
  }

  return currentMode;
}

DrivingMode monitorSlowForward() {

  int sensorFrontUS = getSensorData(FRONTUS);
  int sensorFrontIR = getSensorData(FRONTIR);
  int sensorLeftIR = getSensorData(LEFTIR);
  int sensorRightIR = getSensorData(RIGHTIR);
  int sensorBackIR = getSensorData(BACKIR);

  if (sensorFrontUS > 50 && sensorFrontUS < 200) {
    checkAvoidDirection();
  }

  if (currentMode == DrivingMode::SLOW) {
    delay(100);
    currentMode = SLOW;

    if (sensorFrontUS > 50 && sensorFrontUS < 100 && sensorFrontIR == 0 && sensorLeftIR == 0 && sensorRightIR == 0 && sensorBackIR == 0) {
      currentMode = AVOIDFRONT;
    }

    if (sensorFrontUS > 0 && sensorFrontUS < 150 && sensorFrontIR == 0 && sensorLeftIR == 0 && sensorRightIR > 0 && sensorRightIR < 50 && sensorBackIR == 0) {
      currentMode = AVOIDLEFT;
    }

    if (sensorFrontUS > 0 && sensorFrontUS < 150 && sensorFrontIR == 0 && sensorRightIR == 0 && sensorLeftIR > 0 && sensorLeftIR < 50 && sensorBackIR == 0) {
      currentMode = AVOIDRIGHT;
    }

    if (sensorFrontUS > 0 && sensorFrontUS <= 50 && sensorFrontIR > 0 && sensorFrontIR < 50  && sensorLeftIR == 0 && sensorRightIR == 0) {
      currentMode = REVERSE;
    }
  }
  return currentMode;
}

void checkAvoidDirection() {
  int sensorFrontUS = getSensorData(FRONTUS);
  throttle = 20;
  car.setSpeed((float) throttle);
  turnAngle = -30;
  car.setAngle(turnAngle);
  delay(1500);
  int sensorFrontUS2 = getSensorData(FRONTUS);
  turnAngle = 0;
  car.setAngle(turnAngle);

  if (sensorFrontUS2 > 0 && (sensorFrontUS < sensorFrontUS2)) {
    currentMode = AVOIDLEFT;
  } else if (sensorFrontUS2 > 0 && (sensorFrontUS > sensorFrontUS2)) {
    currentMode = AVOIDRIGHT;
  } else if (sensorFrontUS2 == 0) {
    currentMode = SLOW;
  }
}

DrivingMode monitorBackward() {
  currentMode = REVERSE;
  int sensorBackIR = getSensorData(BACKIR);

  if (sensorBackIR > 0 && sensorBackIR < 50) {
    currentMode = EXPLORE;
    moveForward();
  }
  return currentMode;
}

DrivingMode monitorFrontAvoidance() {
  currentMode = AVOIDFRONT;
  int sensorFrontUS = getSensorData(FRONTUS);
  int sensorFrontIR = getSensorData(FRONTIR);
  int sensorLeftIR = getSensorData(LEFTIR);
  int sensorRightIR = getSensorData(RIGHTIR);
  int sensorBackIR = getSensorData(BACKIR);

  if (sensorFrontUS == 0 && sensorFrontIR == 0 && sensorLeftIR == 0 && sensorRightIR == 0) {
    delay(1200);
    currentMode = EXPLORE;
  }

  if (sensorFrontIR > 0 && sensorFrontIR < 50) {
    currentMode = REVERSE;
    moveBackward();
  }

  if (sensorFrontUS > 350 || (sensorBackIR > 0 && sensorBackIR < 50)) {
    currentMode = SLOW;
  }

  if (sensorFrontUS > 0 && sensorFrontUS < 2500 && sensorLeftIR == 0 && sensorRightIR > 0 && sensorRightIR < 35) {
    currentMode = AVOIDLEFT;
  }

  if (sensorFrontUS > 0 && sensorFrontUS < 2500 && sensorRightIR == 0 && sensorLeftIR > 0 && sensorLeftIR < 35) {
    currentMode = AVOIDRIGHT;
  }

  return currentMode;
}

DrivingMode monitorLeftAvoidance() {
  currentMode = AVOIDLEFT;
  int sensorFrontUS = getSensorData(FRONTUS);
  int sensorFrontIR = getSensorData(FRONTIR);
  int sensorLeftIR = getSensorData(LEFTIR);
  int sensorRightIR = getSensorData(RIGHTIR);
  int sensorBackIR = getSensorData(BACKIR);

  if (sensorFrontUS == 0 && sensorFrontIR == 0 && sensorLeftIR == 0 && sensorRightIR == 0) {
    delay(500);
    currentMode = EXPLORE;
  }

  if (sensorFrontIR > 0 && sensorFrontIR < 50) {
    currentMode = REVERSE;
    moveBackward();
  }

  if (sensorFrontUS > 350 || (sensorRightIR >= 25 && sensorFrontUS > 300)) {
    currentMode = SLOW;
  }

  if (sensorBackIR > 0 && sensorBackIR < 50) {
    currentMode = SLOW;
  }

  return currentMode;
}

DrivingMode monitorRightAvoidance() {
  currentMode = AVOIDRIGHT;
  int sensorFrontUS = getSensorData(FRONTUS);
  int sensorFrontIR = getSensorData(FRONTIR);
  int sensorLeftIR = getSensorData(LEFTIR);
  int sensorRightIR = getSensorData(RIGHTIR);
  int sensorBackIR = getSensorData(BACKIR);

  if (sensorFrontUS == 0 && sensorFrontIR == 0 && sensorLeftIR == 0 && sensorRightIR == 0) {
    delay(500);
    currentMode = EXPLORE;
  }

  if (sensorFrontIR > 0 && sensorFrontIR < 50) {
    currentMode = REVERSE;
  }

  if (sensorFrontUS > 350 || (sensorLeftIR >= 25 && sensorFrontUS > 300)) {
    currentMode = SLOW;
  }

  if (sensorBackIR > 0 && sensorBackIR < 50) {
    currentMode = SLOW;
  }

  return currentMode;
}

void moveForward()
{
  turnAngle = 0;
  car.setAngle(turnAngle);
  throttle = 50;
  car.setSpeed((float) throttle);
  monitorForward();
}

void moveSlow()
{
  turnAngle = 0;
  car.setAngle(turnAngle);
  throttle = 15;
  car.setSpeed((float) throttle);
  monitorSlowForward();
}

void avoidLeft() {
  monitorLeftAvoidance();
  throttle = -25;
  car.setSpeed((float) throttle);
  turnAngle = 45;
  car.setAngle(turnAngle);

}

void avoidRight() {
  monitorRightAvoidance();
  throttle = -25;
  car.setSpeed((float) throttle);
  turnAngle = -45;
  car.setAngle(turnAngle);

}

void avoidFront() {
  monitorFrontAvoidance();
  throttle = -20;
  car.setSpeed((float) throttle);
  turnAngle = 45;
  car.setAngle(turnAngle);
}

void moveBackward()
{
  monitorBackward();
  turnAngle = 0;
  car.setAngle(turnAngle);
  throttle = -40;
  car.setSpeed((float) throttle);
}


void unstuckBack() {
  int sensorBackIR = getSensorData(BACKIR);
  throttle = -50;
  car.setSpeed((float) throttle);
  turnAngle = -40;
  car.setAngle(turnAngle);

  // delay(1000);
  float currentSpeed = getSpeedData();
  if (currentSpeed > 0.4) {
    currentMode = SLOW;
  }

  if (sensorBackIR > 0 && sensorBackIR < 50) {
    currentMode = SLOW;
  }
}


String reportMode() {
  String driveMode;
  switch (currentMode)
  {
    case STARTUP:
      driveMode = "Startup";
      break;
    case EXPLORE:
      driveMode = "Explore";
      break;
    case SLOW:
      driveMode = "Slow";
      break;
    case REVERSE:
      driveMode = "Reverse";
      break;
    case AVOIDFRONT:
      driveMode = "Avoid front";
      break;
    case AVOIDRIGHT:
      driveMode = "Avoid right";
      break;
    case AVOIDLEFT:
      driveMode = "Avoid left";
      break;
    case UNSTUCK:
      driveMode = "Unstuck";
      break;
    default:
      driveMode = "Unknown";
      break;
  }
  return driveMode;
}

int getSensorData(CarSensor sensorName) {
  int detectedDistance;
  switch (sensorName)
  {
    case FRONTUS:
      detectedDistance = frontUS.getDistance();
      break;
    case FRONTIR:
      detectedDistance = frontIR.getDistance();
      break;
    case BACKIR:
      detectedDistance = backIR.getDistance();
      break;
    case LEFTIR:
      detectedDistance = leftIR.getDistance();;
      break;
    case RIGHTIR:
      detectedDistance = rightIR.getDistance();
      break;
    default:
      detectedDistance = 0;
      break;
  }
  return detectedDistance;
}


float getSpeedData() {
  return car.getSpeed();
}

boolean isConnected()
{
  return mqtt.connected();
}

int msgToInt(String msg)
{
  return msg.toInt();
}

void println(String msg)
{
  Serial.println(msg);
}
