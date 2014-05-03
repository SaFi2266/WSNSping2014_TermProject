#include <TinyGPS.h>
#include <SoftwareSerial.h>
#include <XBee.h>

/*
 * Needs to be written
 *
 * Author: Elliot Dean
 * Note: Some methods were adapted from other sketches found online. References and
 * links to original sketches may be found in the individual methods opening comments.
 */

// Software Serial pins
SoftwareSerial gps(2, 3);
SoftwareSerial xbeeSerial(4, 5);

// Sensor pins and variables
const int tempPin = A0;
const int humidityPin = A1;
long readingDelay = 10000;
long lastReadingTime = 0;
int tempReading = 0;
int humidityReading = 0;

// GPS positioning variables
TinyGPS tinyGPS;
long latitude, longitude;
unsigned long fixAge;
String destination;
boolean atDestination = false;
boolean isActive = false;

// Variables for XBee communication
XBee xbee = XBee();
uint8_t payload[] = {'X'}; // TODO: Decide on payload structure
XBeeAddress64 coordinator = XBeeAddress64(0x0, 0x0);
ZBRxResponse rx = ZBRxResponse();
ZBTxRequest tx = ZBTxRequest(coordinator, payload, sizeof(payload));
ZBTxStatusResponse txStatus = ZBTxStatusResponse();
  
/*
 * Needs to be written
 */
void setup() {

  // Set up console output for debugging
  Serial.begin(9600);
  
  // Set up the XBee radio
  xbeeSerial.begin(9600);
  xbee.setSerial(xbeeSerial);
  
  // Set up the GPS module
  gps.begin(57600);
  setGPSNmeaOutput();
  setGPSUpdateRate(1);
  setGPSBaudRate(1);
  gps.end();
  gps.begin(9600);

} // setup

/*
 * Needs to be written
 */
void loop() {
  
  // Check if the mote is at the correct location and moves to that location if not
  if (!atDestination)
    goToDestination();
    
  // Check for incoming messages from the coordinator
  checkMessages();
  
  // Takes readings and sends them to the coordinator only if the mote is active
  if (isActive && (millis() - lastReadingTime) >= readingDelay) {
    tempReading = getTempReading();
    humidityReading = getHumidityReading();
    sendReadings();
    lastReadingTime = millis();
  } // if - mote is active (should be taking/transmitting readings)
  
} // loop

/**
 * Needs to be written
 */
 void checkMessages() {
   
 } // checkMessages

/**
 * Needs to be written
 */
 void sendReadings() {
   
 } // sendReadings

/*
 * Needs to be written
 */
void goToDestination() {
  while (!atDestination) {
    if (destination.equals(getLocation()))
      atDestination = true;
    else {
      // This block of code would need to control the robot and be able to direct it
      // to the correct destination.
    } // else - update robot direction
  } // while - not at the destination
} // goToDestination

/**
 * This method returns the current location of the mote as a string in the form
 * "latitude, longitude" where latitude and longitude are the long values read from
 * GPS module. After this method is called the global value of the longitude and 
 * latitude variables are updated so the values can be used directly elsewhere without
 * having to parse the string returned by this method.
 */
String getLocation() {
  while (gps.available()) {
    
    // Get data from the GPS and parse the coordinates from it if it is valid
    int data = gps.read();
    if (tinyGPS.encode(data)) {
      tinyGPS.get_position(&latitude, &longitude, &fixAge);
      return latitude + ", " + longitude;
    } // if - valid sentence received from GPS
  
  } // while - there is data to be read from the gps
} // getLocation

/*
 * This method simply gets the current value of the analog pin that the temperature
 * sensor is attached to.
 */
int getTempReading() {
  return analogRead(tempPin);
} // getTemp

/*
 * This method simply gets the current value of the analog pin that the humidity
 * sensor is attached to.
 */
int getHumidityReading() {
  return analogRead(humidityPin);
} // getHumidity

/*
 * This method sends a command to an LS20031 GPS module which tells it to change the
 * baud rate that it is operating at. The serial connection to the GPS module must be
 * closed and then reset to the updated baud rate after this method is called. This
 * method takes an integer parameter between 0 and 4 indicating the following:
 *   0: 4800 baud
 *   1: 9600 baud
 *   2: 19200 baud
 *   3: 38400 baud
 *   4: 57600 baud
 *
 * ** Adapted from original sketch by Colby Sweet which can be found at:
 * http://sensornetworks.engr.uga.edu/w/images/7/7b/Gps_ls20031.ino **
 */
void setGPSBaudRate(int baudRate) { 
  
  // Choose on baud rate based on int parameter
  String command; // Initialize command string
  switch (baudRate)
  {
  case 0: // 4800
    command = "$PMTK251,4800*14\r\n"; 
    break;
  case 1: // 9600
    command = "$PMTK251,9600*17\r\n"; 
    break;
  case 2: // 19200
    command = "$PMTK251,19200*22\r\n"; 
    break;
  case 3: // 38400
    command = "$PMTK251,38400*27\r\n"; 
    break;
  case 4: // 57600
    command = "$PMTK251,57600*2C\r\n"; 
    break;
  } // switch
  gps.print(command); // Send command to GPS
  
} // setGPSBaudRate

/*
 * This method alters the rate at which the LS20031 GPS module acquires new location
 * data (1 Hz, 2 Hz, 4 Hz, 5 Hz, or 10 Hz).
 *
 * ** Function not tested significantly, but does not work with a 9600 baud rate. 
 * This is likely because of GPS bandwidth limitations. **
 * 
 * ** Adapted from original sketch by Colby Sweet which can be found at:
 * http://sensornetworks.engr.uga.edu/w/images/7/7b/Gps_ls20031.ino **
 */
void setGPSUpdateRate(int rate) { 
  
  // Choose update rate based on command sent to GPS
  // With $PMTK220, you pass in the time between updates
  // in milliseconds (200 ms --> 1 / 0.2 = 5 Hz)
  String command; // Initialize command string
  switch (rate)
  {
  case 1: // 1 Hz
    command = "$PMTK220,1000*1F\r\n"; 
    break;
  case 2: // 2 Hz
    command = "$PMTK220,500*2B\r\n"; 
    break;
  case 4: // 4 Hz
    command = "$PMTK220,250*29\r\n"; 
    break;
  case 5: // 5 Hz
    command = "$PMTK220,200*2C\r\n"; 
    break;
  case 10: // 10 Hz
    command = "$PMTK220,100*2F\r\n"; 
    break;
  } // switch
  gps.print(command); // Send command to GPS
  
} // setGPSUpdateRate

/*
 * This method commands the LS20031 GPS module to change the types of data that it
 * outputs. The format of the command can be seen at the bottom of page 5 of the PMTK
 * Protocol Reference and are as follows:
 * 
 * 0 - Disabled or not supported sentence
 * 1 - Output once every position fix
 * 2 - Output once every two position fixes
 * 3, 4, 5 similiar
 * 
 * After PMTK314, first number is for GLL
 * 0 - GLL, 1 - RMC, 2 - VTG, 3 - GGA, 4 - GSA, 5 - GSV,
 * 6 - GRS, 7 - GST, 13 - MALM, 14 - MEPH, 15 - MDGP, 16 - MDBG
 * ** Others not labeled in datasheet **
 *
 * 
 * ** Adapted from original sketch by Colby Sweet which can be found at:
 * http://sensornetworks.engr.uga.edu/w/images/7/7b/Gps_ls20031.ino **
 */
void setGPSNmeaOutput() 
{
  // Command to turn off all but GLL and GGA
  String command = "$PMTK314,1,0,0,1,0,0,0,1,1,1,1,1,0,1,1,1,1*29\r\n";
  gps.print(command); // Send command to GPS
  
} // setGPSNmeaOutput
