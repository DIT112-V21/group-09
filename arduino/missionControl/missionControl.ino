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

// Environment variables
unsigned long currentTime = millis();
const auto oneSecond = 1000UL;
const auto threeSeconds = 3000UL;
const auto fiveSeconds = 5000UL;
const unsigned long PRINT_INTERVAL = 1000;
const unsigned long DETECT_INTERVAL_SHORT = 2000;
const unsigned long DETECT_INTERVAL_MED = 5000;
unsigned long previousPrintout = 0;
unsigned long detectionTime = 0;
unsigned long detectionTime2 = 0;
unsigned long detectionTimeReverse = 0;
const auto pulsesPerMeter = 600;

// Rover mission variables
signed int turnAngle = 0;
signed int throttle = 0;
int currentStep = 0;
int rotationSpeed = 10; // Speed for rotating rover on the spot
boolean missionHasStarted = false;
boolean targetHasReached = false;
boolean contentReceived = false;
String statusMessage = "No updates ...";
double initialDistance = 0;
std::vector<String> missionContent;
int missionSteps = 0;

enum DrivingMode {
  STARTUP,
  DRIVE,
  ROTATE,
  OBSTACLE_AVOIDANCE,
  ENDMISSION,
  UNSTUCK,
  SLOW,
  AVOIDFRONT,
  AVOIDRIGHT,
  AVOIDLEFT,
  REVERSE
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
void setup() {
  
  Serial.begin(9600);
  #ifdef __SMCE__
    Camera.begin(VGA, RGB888, 30);
    frameBuffer.resize(Camera.width() * Camera.height() * Camera.bytesPerPixel());
    mqtt.setKeepAlive(30);
    mqtt.begin(host, port, WiFi);
  #else
    mqtt.begin(net);
  #endif
  
  if (mqtt.connect(clientId, username, password)) {
    mqtt.subscribe("mission/#", 2);

    mqtt.onMessage(+[](String topic, String message) {
      String messageReceived = message + " on topic: " + topic;
      Serial.println(messageReceived);
      if (topic == "mission/content") {
        if (!missionHasStarted) {
          detectionTime = currentTime;
          contentReceived = true;
          splitStringToVector(message);
          statusMessage = "Mission content received.";
        }
      } else if (topic == "mission/qrcode") {
        throttle = 0;
        turnAngle = 0;
        targetHasReached = true;
        currentMode = ENDMISSION;
        statusMessage = "QR Code detected. Mission accomplished.";
      }
    });
  }
  gyroscope.update();
  int startHeading = gyroscope.getHeading();
  Serial.print("start heading: ");
  Serial.println(startHeading);
  delay(2000);
}

void loop() {
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
    currentTime = millis();
    if (currentTime - previousTransmission >= fiveSeconds) {
      previousPrintout = currentTime;
      mqtt.publish("marsOrbiter/status", statusMessage);
      // mqtt.publish("marsOrbiter/status", reportStatus());
    }

#ifdef __SMCE__
    // Avoid over-using the CPU if we are running in the emulator
    delay(50);
#endif
  }
  
  switch (currentMode)
  {
    case STARTUP:
      startup();
      break;
    case DRIVE:
      drive();
      break;
    case ROTATE:
      rotate();
      break;
    case ENDMISSION:
      endMission();
      break;
    case SLOW:
      moveSlow();
      // currentMode =  monitorSlowForward();
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
      currentMode =  monitorSlowForward();
      break;
  }
}

int getTargetHeading() {
  int stepIndex = currentStep * 4;
  String tHeading = missionContent[stepIndex+1];
  int targetHeading = tHeading.toInt();
  
  return targetHeading;
}

int getTargetSpeed() {
  int stepIndex = currentStep * 4;
  String tSpeed = missionContent[stepIndex+2];
  int targetSpeed = tSpeed.toInt();
  
  return targetSpeed;
}

int getTargetDistance() {
  int stepIndex = currentStep * 4;
  String tDistance = missionContent[stepIndex+3];
  int targetDistance = tDistance.toInt();
  
  return targetDistance;
}

void drive() //source: smartcar_shield/examples/Car/automatedMovements/automatedMovements.ino
{
  throttle = getTargetSpeed();
  int stepDistance = getTargetDistance();
  Serial.print("Step distance: ");
  Serial.println(stepDistance);  

  Serial.print("Step speed: ");
  Serial.println(throttle);  
  
  delay(3000);
  // Ensure the speed is towards the correct direction
  throttle = smartcarlib::utils::getAbsolute(throttle) * ((throttle < 0) ? -1 : 1);
  car.setAngle(turnAngle);
  car.setSpeed(throttle);

  car.update();
  double currentDistance   = getMedianDistance();
  double traveledDistance = currentDistance - initialDistance;
  statusMessage = "Step " + String(currentStep+1) + " in progress.";
  
  if (traveledDistance >= stepDistance) {
       car.setSpeed(0);
       statusMessage = "Step " + String(currentStep+1) + " has completed.";

      if (currentStep == (missionSteps-1)) {
        endMission();
      } else {
        currentStep++;
        currentMode = ROTATE; 
      }
  } 
}

void startup()
{
  if (missionHasStarted) {
    statusMessage = "Message received. Mission is starting ...";
    currentMode = ROTATE;
  } else {
    statusMessage = "Rover is ready. Waiting for a mission ...";
  }
}

void splitStringToVector(String msg) {
  int j=0;
  for(int i =0; i < msg.length(); i++){
    if(msg.charAt(i) == ';'){
      missionContent.push_back(msg.substring(j,i));
      j = i+1;
    }
  }
  missionContent.push_back(msg.substring(j,msg.length()));
  missionSteps = missionContent.size()/4;
  
  missionHasStarted = true;
  statusMessage = "Mission content received!";


  for (int i =0; i < missionContent.size(); i+=4) {
    Serial.println("Verifying mission content");
    delay(500);
    Serial.print("Step: ");
    Serial.println(missionContent[i]);
    delay(1000);
    Serial.print("Heading: ");
    Serial.println(missionContent[i+1]);
    delay(1000);
    Serial.print("Speed: ");
    Serial.println(missionContent[i+2]);
    delay(1000);
    Serial.print("Distance: ");
    Serial.println(missionContent[i+3]);
    delay(1000);
  }

  delay(5000);
}

void rotate()
{
  int targetHeading = getTargetHeading();
  gyroscope.update();
  int currentHeading = gyroscope.getHeading();
  Serial.print("Current heading: ");
  Serial.println(currentHeading);
  signed int degrees2Turn = currentHeading - targetHeading;
  rotationSpeed = smartcarlib::utils::getAbsolute(rotationSpeed);

  if (degrees2Turn > 0)
    { // positive value means we should rotate clockwise
        car.overrideMotorSpeed(rotationSpeed,
                               -rotationSpeed);
    }
    else
    { // rotate counter clockwise
        car.overrideMotorSpeed(-rotationSpeed,
                               rotationSpeed);
    }
  if (targetHeading == currentHeading) {
    car.setSpeed(0);
    initialDistance = getMedianDistance();
    currentMode = DRIVE;  
  }
}

void endMission() {
    car.setSpeed(0);
    car.setAngle(0);
    statusMessage = "Mission has ended. Please reset and restart everything to start a new mission.";
}

boolean isConnected() {
  return mqtt.connected();
}

double getMedianDistance() {
  leftOdometer.update();
  rightOdometer.update();
  long distanceLeft = leftOdometer.getDistance();
  long distanceRight = rightOdometer.getDistance();

  return (distanceLeft + distanceRight) / 2;
}

void moveSlow()
{
  turnAngle = 0;
  car.setAngle(turnAngle);
  throttle = 15;
  car.setSpeed((float) throttle);
  
}

float getSpeedData() {
  return car.getSpeed();
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
    //delay(100);
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


DrivingMode monitorRightAvoidance() {
  currentMode = AVOIDRIGHT;
  int sensorFrontUS = getSensorData(FRONTUS);
  int sensorFrontIR = getSensorData(FRONTIR);
  int sensorLeftIR = getSensorData(LEFTIR);
  int sensorRightIR = getSensorData(RIGHTIR);
  int sensorBackIR = getSensorData(BACKIR);

  if (sensorFrontUS == 0 && sensorFrontIR == 0 && sensorLeftIR == 0 && sensorRightIR == 0) {
    delay(500);
    currentMode = DRIVE;
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

DrivingMode monitorFrontAvoidance() {
  currentMode = AVOIDFRONT;
  int sensorFrontUS = getSensorData(FRONTUS);
  int sensorFrontIR = getSensorData(FRONTIR);
  int sensorLeftIR = getSensorData(LEFTIR);
  int sensorRightIR = getSensorData(RIGHTIR);
  int sensorBackIR = getSensorData(BACKIR);

  if (sensorFrontUS == 0 && sensorFrontIR == 0 && sensorLeftIR == 0 && sensorRightIR == 0) {
    delay(1200);
    currentMode = DRIVE;
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
    currentMode = DRIVE;
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

void moveBackward()
{
  monitorBackward();
  turnAngle = 0;
  car.setAngle(turnAngle);
  throttle = -40;
  car.setSpeed((float) throttle);
}
DrivingMode monitorBackward() {
  currentMode = REVERSE;
  int sensorBackIR = getSensorData(BACKIR);

  if (sensorBackIR > 0 && sensorBackIR < 50) {
    currentMode = DRIVE;
    drive();
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
