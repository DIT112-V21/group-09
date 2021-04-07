#include <Smartcar.h>

const unsigned long PRINT_INTERVAL = 1000;
const unsigned long DETECT_INTERVAL_MED = 5000;
const unsigned long DETECT_INTERVAL_SHORT = 2000;
unsigned long previousPrintout = 0;
unsigned long detectionTime = 0;
unsigned long detectionTime2 = 0;
unsigned long detectionTimeReverse = 0;
const auto pulsesPerMeter = 600;
String currentMode = "startUp";
boolean initialTurn = true;
int startDistance = 0;
int startSpeed = 0;
int startAngle = 0;

ArduinoRuntime arduinoRuntime;
BrushedMotor leftMotor(arduinoRuntime, smartcarlib::pins::v2::leftMotorPins);
BrushedMotor rightMotor(arduinoRuntime, smartcarlib::pins::v2::rightMotorPins);
DifferentialControl control(leftMotor, rightMotor);

GP2Y0A02 frontIR(arduinoRuntime, 0);
GP2Y0A02 leftIR(arduinoRuntime, 1);
GP2Y0A02 rightIR(arduinoRuntime, 2);
GP2Y0A02 backIR(arduinoRuntime, 3);

SR04 frontUS(arduinoRuntime, 6, 7, 300);

GY50 gyroscope(arduinoRuntime, 37);



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
      startDistance = (rand() % 500) + 200;
      startSpeed = (rand() % 40) + 20;
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
    // Maintain the speed and update the heading
    if (currentMode == "startUp") {
      startupMove();
    } else if (currentMode == "explore") {
      moveForward();
      currentMode = monitorForward();
    } else if (currentMode == "slow") {
      moveSlow();
      currentMode = monitorSlowForward();
    } else if (currentMode == "reverse") {
      moveBackward();
      currentMode = monitorBackward();
    } else if (currentMode == "avoidFront") {
      avoidFront();
      currentMode = monitorFrontAvoidance();
    } else if (currentMode == "avoidLeft") {
      avoidLeft();
      currentMode = monitorLeftAvoidance();
    } else if (currentMode == "avoidRight") {
      avoidRight();
      currentMode = monitorRightAvoidance();
    } else if (currentMode == "unstuckBack") {
      unstuckBack();
    }

    // Keep printing out the current heading
    unsigned long currentTime = millis();
    if (currentTime >= previousPrintout + PRINT_INTERVAL)
    {
        previousPrintout = currentTime;

        Serial.print("Current mode: ");
        Serial.println(currentMode);

        float speed = car.getSpeed();
        Serial.print("Current speed: ");
        Serial.println(speed);
       
    }

    if (currentTime >= detectionTime + DETECT_INTERVAL_MED)
    {
        detectionTime = currentTime;
        if (frontUS.getDistance() == 0 && frontIR.getDistance() ==0 && currentMode == "slow") {
            currentMode = "explore";
        }

        if (currentMode == "unstuckBack" && frontIR.getDistance() == 0 && frontUS.getDistance() > 200) {
            currentMode = "slow";
          } else if (currentMode == "unstuckForward" && backIR.getDistance() == 0) {
            currentMode = "reverse";
          }
    }

    if (currentTime >= detectionTime2 + DETECT_INTERVAL_SHORT)
    {
        detectionTime2 = currentTime;
        if (car.getSpeed() >= 0 && car.getSpeed() < 0.025 && (currentMode == "explore" || currentMode == "slow" || currentMode == "reverse")) {
            currentMode = "unstuckBack";
            unstuckBack();
        }

        if (car.getSpeed() >= 0 && car.getSpeed() < 0.025 && (currentMode == "avoidRight" || currentMode == "avoidLeft")) {
            currentMode = "reverse";
            unstuckBack();
        }
    }

    if (currentTime >= detectionTimeReverse + 5000 && currentMode == "reverse")
    {
        currentMode = "explore";
    }    
}

void startupMove() {
      // String currentMode = "startUp";
      
      car.setAngle(startAngle);
      car.setSpeed(startSpeed);
      if (car.getDistance() > startDistance) {
        car.setAngle(0);
        initialTurn = false;
        currentMode = "explore";        
      }
}

String monitorForward() {
    String currentMode = "explore";
    if ((frontUS.getDistance() > 0 && frontUS.getDistance() < 300) || (frontUS.getDistance() > 0 && frontUS.getDistance() < 100 && frontIR.getDistance() < 40)) {
        currentMode = "slow";
        moveSlow();
    }

    return currentMode;    
}

String monitorSlowForward() {
    delay(100);
    String currentMode = "slow";
    if (frontUS.getDistance()> 0 && frontUS.getDistance() < 100 && frontIR.getDistance() == 0 && leftIR.getDistance() == 0 && rightIR.getDistance() == 0) {
      currentMode = "avoidFront";
    }

    if (frontUS.getDistance()> 0 && frontUS.getDistance() < 350 && frontIR.getDistance() == 0 && leftIR.getDistance() == 0 && rightIR.getDistance() > 0 && rightIR.getDistance() < 50) {
      currentMode = "avoidLeft";
    } 
    
    if (frontUS.getDistance()> 0 && frontUS.getDistance() < 350 && frontIR.getDistance() == 0 && rightIR.getDistance() == 0 && leftIR.getDistance() > 0 && leftIR.getDistance() < 50) {
      currentMode = "avoidRight";
    }
    
    if (frontIR.getDistance() > 0 && frontIR.getDistance() < 50  && leftIR.getDistance() == 0 && rightIR.getDistance() == 0) {
        currentMode = "reverse";
        moveBackward();
    }
    return currentMode;    
}

String monitorBackward() {
    String currentMode = "reverse";
    if (backIR.getDistance() > 0 && backIR.getDistance() < 50) {
        currentMode = "explore";
        moveForward();
    }
    return currentMode;    
}

String monitorFrontAvoidance() {
    String currentMode = "avoidFront";
    if (car.getDistance() >= 100 && frontUS.getDistance() == 0 && frontIR.getDistance() == 0 && leftIR.getDistance() == 0 && leftIR.getDistance() == 0) {
      currentMode = "explore";
    }

    if (frontIR.getDistance() > 0 && frontIR.getDistance() < 50) {
        currentMode = "reverse";
        moveBackward();
    }

    if (car.getDistance() >= 100 && frontUS.getDistance() > 300) {
      currentMode = "slow";
    }

    if (frontUS.getDistance()> 0 && frontUS.getDistance() < 2500 && leftIR.getDistance() == 0 && rightIR.getDistance() > 0 && rightIR.getDistance() < 35) {
      currentMode = "avoidLeft";
    } 
    
    if (frontUS.getDistance()> 0 && frontUS.getDistance() < 2500 && rightIR.getDistance() == 0 && leftIR.getDistance() > 0 && leftIR.getDistance() < 35) {
      currentMode = "avoidRight";
    }

    if (backIR.getDistance() > 0 && backIR.getDistance() < 50) {
        currentMode = "slow";
        moveForward();
    }
    
    return currentMode;    
}

String monitorLeftAvoidance() {
    String currentMode = "avoidLeft";
    if (frontUS.getDistance() == 0 && frontIR.getDistance() == 0 && leftIR.getDistance() == 0 && leftIR.getDistance() == 0) {
      currentMode = "explore";
    }

    if (frontIR.getDistance() > 0 && frontIR.getDistance() < 50) {
        currentMode = "reverse";
        moveBackward();
    }

    if ((car.getDistance() >= 100 && frontUS.getDistance() > 300) || (rightIR.getDistance() >= 25 && frontUS.getDistance() > 300)) {
      currentMode = "slow";
    }

    if (backIR.getDistance() > 0 && backIR.getDistance() < 50) {
        currentMode = "slow";
        moveForward();
    }
    
    return currentMode;    
}

String monitorRightAvoidance() {
    String currentMode = "avoidRight";
    if (frontUS.getDistance() == 0 && frontIR.getDistance() == 0 && leftIR.getDistance() == 0 && leftIR.getDistance() == 0) {
      currentMode = "explore";
    }

    if (frontIR.getDistance() > 0 && frontIR.getDistance() < 50) {
        currentMode = "reverse";
        moveBackward();
    }

    if ((car.getDistance() >= 100 && frontUS.getDistance() > 300) || (leftIR.getDistance() >= 25 && frontUS.getDistance() > 300)) {
      currentMode = "slow";
    }

    if (backIR.getDistance() > 0 && backIR.getDistance() < 50) {
        currentMode = "slow";
        moveForward();
    }
    
    return currentMode;    
}

void avoidLeft() {
  monitorLeftAvoidance();
  car.setSpeed(-20);
  car.setAngle(60);
  
}

void avoidRight() {
  monitorRightAvoidance();
  car.setSpeed(-20);
  car.setAngle(-60);

}

void avoidFront() {
  monitorFrontAvoidance();
  car.setSpeed(-20);
  car.setAngle(-45);
  
}

void moveForward()
{
  monitorForward();
  car.setAngle(0);
  car.setSpeed(50);
}

void moveSlow()
{
  monitorSlowForward();
  car.setAngle(0);
  car.setSpeed(15);
}

void moveBackward()
{
  monitorBackward();
  car.setAngle(0);
  car.setSpeed(-40);
}


void unstuckBack() {
  car.setSpeed(-40);
  car.setAngle(-40);
  // delay(1000);
  if (car.getDistance() >= 800 && car.getSpeed() > 0.4) {
    currentMode = "slow";
  }
}
