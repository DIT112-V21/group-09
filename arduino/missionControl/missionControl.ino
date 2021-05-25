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
  unsigned long missionStartTime = 0; //this time should be set equal currentTime when the mode is changed to missionControl
  double missionStartDistance = 0; //missionStartDistance = getMidianDistance(); should be called when the mode is changed to missionControl
  double  missionDistance =0;
  const auto missionHeading = 0;
  float missionSpeed = 0;
  int steps = 7;
  int columns = 4;
  String content;
  int stepDistance = 0;
  
  double startDistance = 0;
  float startSpeed = 0;
  int startAngle = 0;
  
  
  
  
  enum DrivingMode {
    MANUAL,
    STARTUP,
    EXPLORE,
    SLOW,
    REVERSE,
  
    AVOIDFRONT,
    AVOIDRIGHT,
    AVOIDLEFT,
    UNSTUCK,
    MISSION_CONTROL
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
    // car.setSpeed(30); // Maintain a speed of 1.5 m/sec
  
    // Start the camera and connect to MQTT broker
  #ifdef __SMCE__
    Camera.begin(VGA, RGB888, 30);
    frameBuffer.resize(Camera.width() * Camera.height() * Camera.bytesPerPixel());
    mqtt.setKeepAlive(30);
    mqtt.begin(host, port, WiFi);
  #else
    mqtt.begin(net);
  #endif
    if (mqtt.connect(clientId, username, password)) {
      mqtt.subscribe("smartRover/#", 1);
      currentMode = MISSION_CONTROL;
      mqtt.onMessage([](String topic, String message) {
        String messageReceived = message + " on topic: " + topic;
        Serial.println(messageReceived);
        /*currentMode = MISSION_CONTROL;
  
          if (topic == "mission/content") {
  
  
          detectionTime = currentTime;
          turnAngle = 0;
          cruiseControl = false;
          } else if (topic == "mission/steps") {
          steps= (message.toInt());
  
          detectionTime = currentTime;
          cruiseControl = false;
          } else if (topic == "mission/qrcode1") {
          throttle = 0;
          }      */
      });
    }
  
  
    // String content = "1;120;30;500&2;120;30;500&3;120;30;500&4;120;30;500&5;120;30;500&6;120;30;500&7;120;30;500";
    String content = "1;10;30;100;2;12;70;200;3;10;30;300;4;12;30;400;5;12;30;500;6;30;30;600;7;40;30;700";
  
    //String getValue(String data, char separator, int index)
  
       missionExecution(content, steps);
  
    /*
      int mission[4][4] = {
       {1, 3, 30, 100},
       {2, 4, 40, 200},
       {3, 3, 40, 300},
       {4, 3, 40, 400}
      };
    */
  
  /*
    int stepDistance = 0;
    
  
    for (int stepNum = 0; stepNum < steps; stepNum++) { //rows
  
      int j = 1;
      stepDistance = 0;
      car.setAngle(mission[stepNum][j]);  //stepHeading;
      car.setSpeed(mission[stepNum][j + 1]);
  
  
      while (stepDistance <= mission[stepNum][j + 2]) { //currentDistance< stepDistance
        stepDistance = + getMedianDistance();
  
      }
 
      Serial.print("step ");
      Serial.print(stepNum);
      Serial.println(" completed ");
      Serial.print("Measured Distance ");
      Serial.println(stepDistance);
  
  
      delay(200);
  
  
    }*/
  
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
  

  
      currentTime = millis();
      if (currentTime >= previousPrintout + PRINT_INTERVAL)
      {
        previousPrintout = currentTime;
  
      }
  
    }
  
  }
  
  
  void missionExecution(String content, int steps) {
    // int mission[][] = {{stepNum, stepHeading, stepSpeed, stepDistance},{},{}, ...}
     content = "1;10;30;1000;2;12;70;2000;3;10;30;3000;4;12;30;4000;5;12;30;5000;6;30;30;6000;7;40;30;7000";
     
    int mission[7][4];
  
    for ( int i = 0; i < steps; i++) {
      for ( int j = 0; j < columns; j++) {
        String value = getValue(content, ';', (j + (4 * i)));
        mission[i][j] = (value).toInt();
        
      }
    }

    int estimatedDistance = 0;
    unsigned long estimatedTime =0;
    
    
    for (int stepNum = 0; stepNum < steps; stepNum++) {        
         estimatedDistance =+ mission[stepNum][3];
         estimatedTime =+ (mission[stepNum][3]/mission[stepNum][2]) ;
      }

      

      Serial.println("Mission has started");
      Serial.println("Estimated time: ");
      Serial.print(estimatedTime); 
      Serial.println("  seconds");  
      Serial.println("distance  ");      
      Serial.println(estimatedDistance);  
      Serial.print("----- ");

      

  
    for (int stepNum = 0; stepNum < steps; stepNum++) { //rows
  
      int j = 1;
      stepDistance = 0;
      car.setAngle(mission[stepNum][j]);  //stepHeading;
      car.setSpeed(mission[stepNum][j + 1]);
  
      while (stepDistance <= mission[stepNum][j + 2]) { //currentDistance< stepDistance
        stepDistance = + getMedianDistance();
        missionDistance =+ stepDistance;
      }
        delay(50);
      Serial.print("step ");
      Serial.print(stepNum);
      Serial.println(" completed ");
      Serial.print("Measured Distance ");
      Serial.println(stepDistance);
  
      delay(200);
    }
  
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
  
    
  double estimatedDistance(int missionArray[7][4]) {  
    
    long missionTotalDistance = 0;
    int arraySize = steps;
    
    for (int stepNum = 0; stepNum < steps; stepNum++) {        
         missionTotalDistance =+ missionArray[stepNum][3];
      }
    return missionTotalDistance;
  }

  double estimatedTime(int missionArray[7][4]) {  
    
    long missionTotalDistance = 0;
    unsigned long estimatedTime =0;
    
    int arraySize = steps;
    
    for (int stepNum = 0; stepNum < steps; stepNum++) {        
        missionTotalDistance =+ missionArray[stepNum][3];
        estimatedTime =+ missionArray[stepNum][3]/missionArray[stepNum][2] ;
      }
      
    return estimatedTime;
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
  
  void startupMove() {
  
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
  
