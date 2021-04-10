#include <Smartcar.h>

const unsigned long PRINT_INTERVAL = 1000;
const unsigned long DETECT_INTERVAL_MED = 5000;
const unsigned long DETECT_INTERVAL_SHORT = 2000;
unsigned long previousPrintout = 0;
unsigned long detectionTime = 0;
unsigned long detectionTime2 = 0;
unsigned long detectionTimeReverse = 0;
const auto pulsesPerMeter = 600;

boolean initialTurn = true;
int startDistance = 0;
float startSpeed = 0;
int startAngle = 0;

enum DrivingMode {
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

GY50 gyroscope(arduinoRuntime, 37, 1);

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

SmartCar car(arduinoRuntime, control, gyroscope, leftOdometer, rightOdometer);

void setup()
{
    Serial.begin(9600);
    // car.setSpeed(30); // Maintain a speed of 1.5 m/sec

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
    switch(currentMode)
    {
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

    unsigned long currentTime = millis();
    if (currentTime >= previousPrintout + PRINT_INTERVAL)
    {
        previousPrintout = currentTime;
        
        float speed = car.getSpeed();
        long distanceLeft = leftOdometer.getDistance();
        long distanceRight = rightOdometer.getDistance();

        Serial.print("Mode: ");
        Serial.println(reportMode());
        Serial.print("Speed: ");
        Serial.println(speed);
        Serial.print("Left: ");
        Serial.println(distanceLeft);
        Serial.print("Right: ");
        Serial.println(distanceRight);
        Serial.println(" ");
    }
    

    if (currentTime >= detectionTime + DETECT_INTERVAL_MED)
    {
        detectionTime = currentTime;
        int usDistance = getSensorData(FRONTUS);
        int irDistance = getSensorData(FRONTIR); 
        
        if (usDistance == 0 && irDistance == 0 && currentMode == SLOW) {
            currentMode = EXPLORE;
        }

        if (currentMode == DrivingMode::UNSTUCK && irDistance == 0 && usDistance > 200) {
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

    if (currentTime >= detectionTimeReverse + 5000 && currentMode == DrivingMode::REVERSE)
    {
        currentMode = EXPLORE;
    }    
}

void startupMove() {

      // String currentMode = "startUp";
      car.setAngle(startAngle);
      car.setSpeed(startSpeed);
      long distanceLeft = leftOdometer.getDistance();
      long distanceRight = rightOdometer.getDistance();
     
      if (distanceLeft > startDistance || distanceRight > startDistance) {
        car.setAngle(0);
        initialTurn = false;
        currentMode = EXPLORE;
      }
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
    
    if (sensorFrontUS > 50 && sensorFrontUS < 250) {
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
    car.setSpeed(20);
    car.setAngle(-30);
    delay(1500);
    int sensorFrontUS2 = getSensorData(FRONTUS);
    car.setAngle(0);

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
  car.setAngle(0);
  car.setSpeed(50);
  monitorForward();
}

void moveSlow()
{
  car.setAngle(0);
  car.setSpeed(15);
  monitorSlowForward();
}

void avoidLeft() {
  monitorLeftAvoidance();
  car.setSpeed(-25);
  car.setAngle(-45);
  
}

void avoidRight() {
  monitorRightAvoidance();
  car.setSpeed(-25);
  car.setAngle(45);

}

void avoidFront() {
  monitorFrontAvoidance();
  car.setSpeed(-20);
  car.setAngle(45);
  
}

void moveBackward()
{
  monitorBackward();
  car.setAngle(0);
  car.setSpeed(-40);
}


void unstuckBack() {
  int sensorBackIR = getSensorData(BACKIR);
  car.setSpeed(-50);
  car.setAngle(-40);
  
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
  switch(currentMode)
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
  switch(sensorName)
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
