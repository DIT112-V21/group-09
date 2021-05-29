#include <Smartcar.h>
#include <MQTT.h>
#include <WiFi.h>

//#include <vector>

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
unsigned long previousPrintout = 0;
unsigned long detectionTime = 0;
unsigned long detectionTime2 = 0;
unsigned long detectionTimeReverse = 0;
const auto pulsesPerMeter = 600;
signed int turnAngle = 0;
signed int throttle = 30;
boolean initialTurn = false;
boolean cruiseControl = false;

//mission variables
unsigned long currentTime = millis();
const int steps = 99; //this need to be const which is problematic. we could have a max step num
const int columns = 4;
int currentStep = 0;
int steps_num = 0;
int mission[steps][columns] = {};
String content;

boolean missionHasStarted = false;
boolean targetHasReached = false;
boolean contentRecieved = false;

enum DrivingMode {
  OBSTACLE_AVOIDANCE,
  UNSTUCK,
  DRIVE,
  ROTATE,
  SLOW,
  AVOIDFRONT,
  AVOIDRIGHT,
  AVOIDLEFT,
  REVERSE
};

enum Status {
  MISSION_COMPLETE,
  MISSION_START,
  STEP_COMPLETE,
  STEP_START,
  TARGET_REACHED
};

enum CarSensor {
  FRONTUS,
  FRONTIR,
  BACKIR,
  LEFTIR,
  RIGHTIR
};

Status status;
DrivingMode currentMode = ROTATE;
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
  if (mqtt.connect(clientId, username, password)) {
    mqtt.subscribe("smartRover/#", 2);

    mqtt.onMessage(+[](String topic, String message) {
      String messageReceived = message + " on topic: " + topic;
      Serial.println(messageReceived);

      if (topic == "mission/content") {
        detectionTime = currentTime;
        content = message;
        contentRecieved = true;
        Serial.println("Message recieved!");
        saveContentToArray(content);
        turnAngle = getTargetHeading();
        missionHasStarted = true;
       
      } else if (topic == "mission/steps") {
        steps_num = message.toInt();

        detectionTime = currentTime;

      } else if (topic == "mission/qrcode1") {
        throttle = 0;
        targetHasReached = true;
      }
    });
  }
  // content = "1;10;30;100;2;42;50;100;3;10;99;300;4;12;50;400;5;12;100;500;6;3;100;600;7;4;100;700";
  content = "1;15;80;400 ;2;42;60;900;3;40;99;300;4;52;10;400;5;12;100;500;6;3;100;1600;7;40;100;1300";
  saveContentToArray(content);
  //  drive();



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
    
       /* while (!contentRecieved){
        String msg = "Rover is ready!";
         mqtt.publish("marsOrbiter/rover/ready", msg);
      }

    if (missionHasStarted && currentTime - previousTransmission >= threeSeconds ) {
        previousTransmission = currentTime;

        mqtt.publish("marsOrbiter/status", reportStatus());
        mqtt.publish("marsOrbiter/stepStatus", reportStepStatus());
      }*/
    if (contentRecieved && currentTime - previousTransmission >= oneSecond) {
      previousPrintout = currentTime;
      String msg = "mission content recieved!";
      mqtt.publish("marsOrbiter/status", msg);
    }

    currentTime = millis();
    if (currentTime >= previousPrintout + PRINT_INTERVAL)
    {
      previousPrintout = currentTime;

    }


#ifdef __SMCE__
    // Avoid over-using the CPU if we are running in the emulator
    delay(50);
#endif
  }

  Serial.print(getTargetHeading());
  

  while(!targetHasReached){
    

  switch (currentMode)
  {
    case DRIVE:
      drive();
      currentMode = monitorDriveMode();
      break;
    case ROTATE:
      rotate();
      currentMode = DRIVE;
      break;
    case SLOW:
      moveSlow();
      currentMode =  monitorSlowForward();
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

}



int getTargetDistance() {

  return mission[currentStep][3]; //distance is at the third column
}
int getTargetSpeed() {

  return mission[currentStep][2];
}
int getTargetHeading() {

  return mission[currentStep][1];
}

void drive() //source: smartcar_shield/examples/Car/automatedMovements/automatedMovements.ino
{

  float stepSpeed = getTargetSpeed();
  long stepDistance = getTargetDistance();

  
  if (stepDistance == 0)
    {
    currentStep++;
    }
  // Ensure the speed is towards the correct direction
  stepSpeed = smartcarlib::utils::getAbsolute(stepSpeed) * ((stepDistance < 0) ? -1 : 1);
  car.setAngle(0);
  car.setSpeed(stepSpeed);

  double initialDistance  = getMedianDistance();
  bool hasReachedTargetDistance = false;
  status = STEP_START;
  while (!hasReachedTargetDistance)
  {
    car.update();
    auto currentDistance   = getMedianDistance();
    auto travelledDistance = initialDistance > currentDistance
                             ? initialDistance - currentDistance
                             : currentDistance - initialDistance;
    hasReachedTargetDistance = travelledDistance >= smartcarlib::utils::getAbsolute(getTargetDistance());


  }
  status = STEP_COMPLETE;
  currentStep++;
  //Serial.print("drive()");
  //car.setSpeed(0);

  
}

DrivingMode monitorDriveMode() {
  detectionTime2 = currentTime;
  float currentSpeed = getSpeedData();

  if (status = STEP_COMPLETE) {
     rotate();
     currentMode = DRIVE;

  }
  if (currentSpeed >= 0 && currentSpeed < 0.025) {
    currentMode = UNSTUCK;
    unstuckBack();
  }
  

  return currentMode;

}
void saveContentToArray(String content) { //called when content is recieved
  for ( int i = 0; i < steps; i++) {
    for ( int j = 0; j < columns; j++) {
      String value = getValue(content, ';', (j + (4 * i)));
      mission[i][j] = (value).toInt();

    }
  }
}

void rotate() //to find the right angle (smartCar_shield)
{

  int degrees = getTargetHeading();
  
  gyroscope.update();
  const auto initialHeading    = gyroscope.getHeading();
  bool hasReachedTargetHeading = false;
  while (!hasReachedTargetHeading)
  {    
    car.setSpeed(25);
    if (degrees >initialHeading ){
      car.setAngle(10);
    }
    else{
      car.setAngle(-10);
      
    }
    
    
    car.update();
    gyroscope.update();
    auto currentHeading = gyroscope.getHeading();   
    int degreesTurnedSoFar  = initialHeading - currentHeading;
    hasReachedTargetHeading = smartcarlib::utils::getAbsolute(degreesTurnedSoFar)
                              >= smartcarlib::utils::getAbsolute(degrees);
  }

  car.setAngle(0);
  currentMode = DRIVE;
  

}

boolean isConnected()
{
  return mqtt.connected();
}
double getMedianDistance() {

  leftOdometer.update();
  rightOdometer.update();

  long distanceLeft = leftOdometer.getDistance();
  long distanceRight = rightOdometer.getDistance();

  return (distanceLeft + distanceRight) / 2;
}

String getValue(String data, char separator, int index)
{
  int found = 0;
  int strIndex[] = { 0, -1 };
  int maxIndex = data.length() - 1;

  for (int i = 0; i <= maxIndex && found <= index; i++) {
    if (data.charAt(i) == separator || i == maxIndex) {
      found++;
      strIndex[0] = strIndex[1] + 1;
      strIndex[1] = (i == maxIndex) ? i + 1 : i;
    }
  }
  return found > index ? data.substring(strIndex[0], strIndex[1]) : "";
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

String reportStepStatus() {
  String sStatus;

  switch (status)
  {
    case STEP_START:
      sStatus = "Step 1 started";
      break;
    // case STEP_COMPLETE:                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       :
    // sStatus = "Step 1 started";
    //break;
    default:
      sStatus = "Unknown";
      break;
  }
  return sStatus;
}

String reportStatus() {
  String mStatus;

  switch (status)
  {
    case MISSION_START:
      mStatus = "Mission Started!";
      break;
    case  MISSION_COMPLETE:
      mStatus = "Mission Ended!";
      break;
    case TARGET_REACHED:
      mStatus = "Target reached!";
      break;
    default:
      mStatus  = "Unknown";
      break;
  }
  return mStatus;
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
