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
    int currentStep=0;  
    int steps_num = 0;
    int mission[steps][columns] = {};
    String content;
  
    boolean missionHasStarted = false;
    boolean targetHasReached = false; 
    boolean contentRecieved= false; 
    
    enum DrivingMode {
      OBSTACLE_AVOIDANCE,
      UNSTUCK,
      DRIVE,
      ROTATE,
      SLOW,
     
      
    };

    enum Status{
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
    DrivingMode currentMode = DRIVE;
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
            contentRecieved= true; 
            Serial.println("Message recieved!");
            saveContentToArray(content);
            
            missionHasStarted = true;
            //currentMode = ROTATE;
          } else if (topic == "mission/steps") {
            steps_num = message.toInt();
    
            detectionTime = currentTime;
    
          } else if (topic == "mission/qrcode1") {
            throttle = 0;
          }
        });
      }
     // content = "1;10;30;100;2;42;50;100;3;10;99;300;4;12;10;400;5;12;100;500;6;3;100;600;7;4;100;700"; 
      content = "1;-2;30;50;2;42;50;100;3;10;99;30;4;12;10;40;5;12;100;50;6;3;10;60;7;4;100;70";
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
    /* 
        while (!contentRecieved){
        String msg = "Rover is ready!";
         mqtt.publish("marsOrbiter/rover/ready", msg);
      }
    
      if (missionHasStarted && currentTime - previousTransmission >= threeSeconds ) { 
        previousTransmission = currentTime; 
          
        mqtt.publish("marsOrbiter/status", reportStatus());
        mqtt.publish("marsOrbiter/stepStatus", reportStepStatus());
      }*/
        if(contentRecieved && currentTime - previousTransmission >= oneSecond){
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
        currentMode = ROTATE;
        break;
      case UNSTUCK:
        unstuckBack();
        break;
      default:
        currentMode= moveSlow();
        break;
    }
      
  }
  
     
  
      int getTargetDistance(){
      
      return mission[currentStep][3]; //distance is at the third column
    }
    int getTargetSpeed(){
      
      return mission[currentStep][2];
    }
    int getTargetHeading(){
     
      return mission[currentStep][1];
    }
  
   void drive() //source: smartcar_shield/examples/Car/automatedMovements/automatedMovements.ino
    {
       
      float stepSpeed = getTargetSpeed();
      long stepDistance = getTargetDistance();
      /*if (stepDistance == 0)
      {
        return;
      }*/
      // Ensure the speed is towards the correct direction
      //stepSpeed = smartcarlib::utils::getAbsolute(stepSpeed) * ((stepDistance < 0) ? -1 : 1);
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
  
  DrivingMode monitorDriveMode(){
   detectionTime2 = currentTime;
      float currentSpeed = getSpeedData();

      if (status = STEP_COMPLETE){
        currentMode = moveSlow(); 
        
      }else if (currentSpeed >= 0 && currentSpeed < 0.025) {
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
      //float speed = getTargetSpeed();
      
      float speed = smartcarlib::utils::getAbsolute(speed);
    //  degrees %= 360; // Put degrees in a (-360,360) scale
      /*if (degrees == 0)
      {
        return;
      }
    */
      car.setSpeed(speed);
     /* if (degrees > 0)
      {
        car.setAngle(90);
      }
      else
      {
        car.setAngle(-90);
      }*/
    
      const auto initialHeading    = car.getHeading();
      bool hasReachedTargetDegrees = false;
      while (!hasReachedTargetDegrees)
      {
        car.update();
        auto currentHeading = car.getHeading();
        if (degrees < 0 && currentHeading > initialHeading)
        {
          // If we are turning left and the current heading is larger than the
          // initial one (e.g. started at 10 degrees and now we are at 350), we need to substract
          // 360 so to eventually get a signed displacement from the initial heading (-20)
          currentHeading =getTargetHeading();
        }
        else if (degrees > 0 && currentHeading < initialHeading)
        {
         
          currentHeading += 360;
        }
        // Degrees turned so far is initial heading minus current (initial heading
        // is at least 0 and at most 360. To handle the "edge" cases we substracted or added 360 to
        // currentHeading)
        int degreesTurnedSoFar  = initialHeading - currentHeading;
        hasReachedTargetDegrees = smartcarlib::utils::getAbsolute(degreesTurnedSoFar)
                                  >= smartcarlib::utils::getAbsolute(degrees);
      }
    
      car.setSpeed(0);
      
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
  
   DrivingMode moveSlow()
  {
    turnAngle = 0;
    car.setAngle(turnAngle);
    throttle = 15;
    car.setSpeed((float) throttle);
    return ROTATE;
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
