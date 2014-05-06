#include <TinyGPS.h>
#include <SoftwareSerial.h>
#include <XBee.h>

/*
 * The SensorNetworkMote class is used to operate a mote with the Desert Condition
 * Monitoring system. It's main functions are to go to the location sent to it via
 * it's XBee network, using a LS20031 GPS module to determine its position, take 
 * readings at set intervals from a TMP36 temperature sensor and a HIH-4030 Humidity 
 * sensor, and send the readings to the XBee network coordinator until instructed to
 * return to a "home location" after the trip duration is finished.
 *
 * Author: Elliot Dean
 * Note: Some methods were adapted from other sketches found online. References and
 * links to original sketches may be found in the individual methods opening comments.
 */

// Software Serial pins
SoftwareSerial xbeeSerial(2, 3);
SoftwareSerial gps(4, 5);

// Sensor pins and variables
const int tempPin = A0;
const int humidityPin = A1;
long readingDelay = 10000;
long lastReadingTime = 0;
int tempReading = 0;
int humidityReading = 0;

// GPS positioning variables
TinyGPS tinyGPS;
int data;
long latitude, longitude, latDest, longDest;
unsigned long fixAge;
long acceptableRange = 10;

// Variables for XBee communication
XBee xbee = XBee();
uint8_t arrival[] = {'A'};
uint8_t readings[] = {'R', 0, 0, 0, 0};
XBeeAddress64 coordinator = XBeeAddress64(0x0, 0x0);
ZBRxResponse rx = ZBRxResponse();
ZBTxRequest txA = ZBTxRequest(coordinator, arrival, sizeof(arrival));
ZBTxRequest txR = ZBTxRequest(coordinator, readings, sizeof(readings));
ZBTxStatusResponse txStatus = ZBTxStatusResponse();
  
/*
 * This method sets up the serial port, XBee radio, and GPS module to be used in the
 * program.
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
 * The main program loop first gets the reading delay and destination needed for the
 * mote to take readings at the correct time and place. It then instructs the robot
 * that it is attached to to move in the correct direction until it reaches the
 * destination. Once at the destination it will take readings at the set interval
 * until it receives another set of coordinates. It will then go to the second set of
 * coordinates and wait for the coordinator to send out the reading parameters again,
 * starting the next trip and next iteration of the program loop.
 */
void loop() {  
  
  getReadingDelay();
  getDestination();
  goToDestination();
  takeReadings();
  goToDestination();
  
} // loop

/*
 * This method waits until a reading parameter message is received and then modifies
 * the value of the reading delay variable to the received values. The payload
 * structure of the reading parameter message is as follows:
 * 
 *	Byte 0: Message type identifier - 'P'
 *	Byte 1: Most significant byte of the reading delay
 *	Byte 2: Second most significant byte of the reading delay
 *	Byte 3: Third most significant byte of the reading delay
 *	Byte 4: Least significant byte of the reading delay
 */
void getReadingDelay() {
  
  // Keep checking until a reading parameter is received
  while (true) {
    
    xbee.readPacket();
    if (xbee.getResponse().isAvailable()) {
      if (xbee.getResponse().getApiId() == ZB_RX_RESPONSE) {
        
        // Parse the reading parameter message
        xbee.getResponse().getZBRxResponse(rx);
        if (rx.getData(0) == 'P') {
          readingDelay = (((rx.getData(1) << 24) & 0xFF000000) 
                        + ((rx.getData(2) << 16) & 0xFF0000)
                        + ((rx.getData(3) << 8) & 0xFF00)
                        + (rx.getData(4) & 0xFF));
          return;
        } // if - Reading delay message received
        
      } // if - Series 2 RX response
    } // if - packet received
    
  } // while - waiting for reading delay message
  
} // getReadingDelay

/*
 * This message waits until a destination message is received and then modifies
 * the value of the latitude and longitude destination variables to the received 
 * values. The payload structure of the reading parameter message is as follows:
 * 
 *	Byte 0: Message type identifier - 'D'
 *	Byte 1: Most significant byte of the latitude 
 *	Byte 2: Second most significant byte of the latitude
 *	Byte 3: Third most significant byte of the latitude
 *	Byte 4: Least significant byte of the latitude
 *	Byte 5: Most significant byte of the longitude
 *	Byte 6: Second most significant byte of the longitude
 *	Byte 7: Third most significant byte of the longitude
 *	Byte 8: Least significant byte of the longitude
 */
void getDestination() {
  
  // Keep checking until a destination message is received
  while (true) {
    
    xbee.readPacket();
    if (xbee.getResponse().isAvailable()) {
      if (xbee.getResponse().getApiId() == ZB_RX_RESPONSE) {
        
        // Parse the destination message
        xbee.getResponse().getZBRxResponse(rx);
        if (rx.getData(0) == 'D') {
          latDest = (((rx.getData(1) << 24) & 0xFF000000) 
                   + ((rx.getData(2) << 16) & 0xFF0000)
                   + ((rx.getData(3) << 8) & 0xFF00)
                   + (rx.getData(4) & 0xFF));
          longDest = (((rx.getData(5) << 24) & 0xFF000000) 
                    + ((rx.getData(6) << 16) & 0xFF0000)
                    + ((rx.getData(7) << 8) & 0xFF00)
                    + (rx.getData(8) & 0xFF));
        } // if - Destination message received
        
      } // if - Series 2 RX response
    } // if - packet received
    
  } // while - waiting for destination message
  
} // getDestination

/*
 * This method will direct the robot to move until the mote is within the acceptable
 * range (Note: the movement of the robot is unimplemented). Once the mote has reached
 * it's destination, it will send an arrival notification message to the coordinator
 * so that it knows it is ready to take readings. The payload of the arrival message is
 * a single byte containing the message type identifier - 'A'.
 */
void goToDestination() {
  
  // Keep adjusting position until within the acceptable range
  while (true) {
    
    // Check if within acceptable range
    getLocation();
    if ((latitude <= (latDest + acceptableRange)) && 
        (latitude >= (latDest - acceptableRange)) &&
        (longitude <= (longDest + acceptableRange)) &&
        (longitude >= (longDest - acceptableRange)))
      break;
    else {
      // This block of code would need to control the robot and be able to direct it
      // to the correct destination.
    } // else - update robot direction
  
  } // while - not at the destination
  
  // Notify the coordinator with an arrival message
  while (true) {
    
    // Send message and wait for ACK
    xbee.send(txA);
    if (xbee.readPacket(500)) {
      if (xbee.getResponse().getApiId() == ZB_TX_STATUS_RESPONSE) {
        
        // Finished if successful, try again if not
        xbee.getResponse().getZBTxStatusResponse(txStatus);
        if (txStatus.getDeliveryStatus() == SUCCESS) return;
        else continue;
        
      } // if - status response received
    } // if - packet received
    
  } // while - trying to send arrival message
    
} // goToDestination

/*
 * This method will take readings from the temperature and humidity sensors separated 
 * by the reading delay and send each set of readings to the coordinator. Between
 * readings it will check for destination messages from the coordinator which inducate
 * that the mote should stop taking readings and return home. The payload of the
 * reading message is as follows:
 * 		
 *	Byte 0: Message type identifier - 'R'
 *	Byte 1: Most significant byte of the temperature reading
 *	Byte 2: Least significant byte of the temperature reading
 *	Byte 3: Most significant byte of the humidity reading
 *	Byte 4: Least significant byte of the humidity reading
 */
void takeReadings() {
  
  // Keep taking and sending readings until new destination is received
  lastReadingTime = millis();
  while (true) {
    
    if ((millis() - lastReadingTime) >= readingDelay) {
      
      // Reset read time and get readings
      lastReadingTime = millis();
      tempReading = analogRead(tempPin);
      humidityReading = analogRead(humidityPin);
      
      // Pack readings into message
      readings[1] = (tempReading >> 8) & 0xFF;
      readings[2] = tempReading & 0xFF;
      readings[3] = (humidityReading >> 8) & 0xFF;
      readings[4] = humidityReading & 0xFF;
      
      // Send the message to the coordinator
      while (true) {
        
        // Send message and wait for ACK
        xbee.send(txR);        
        if (xbee.readPacket(500)) {
          if (xbee.getResponse().getApiId() == ZB_TX_STATUS_RESPONSE) {
        
            // Finished if successful, try again if not
            xbee.getResponse().getZBTxStatusResponse(txStatus);
            if (txStatus.getDeliveryStatus() == SUCCESS) return;
            else continue;
        
          } // if - status response received
        } // if - packet received
        
      } // while - trying to send reading message
    
    } // if - time to take readings
    
    // Check for a destination message, meaning it is time to return home
    xbee.readPacket();
    if (xbee.getResponse().isAvailable()) {
      if (xbee.getResponse().getApiId() == ZB_RX_RESPONSE) {
        
        // Parse the destination message
        xbee.getResponse().getZBRxResponse(rx);
        if (rx.getData(0) == 'D') {
          latDest = (((rx.getData(1) << 24) & 0xFF000000) 
                   + ((rx.getData(2) << 16) & 0xFF0000)
                   + ((rx.getData(3) << 8) & 0xFF00)
                   + (rx.getData(4) & 0xFF));
          longDest = (((rx.getData(5) << 24) & 0xFF000000) 
                    + ((rx.getData(6) << 16) & 0xFF0000)
                    + ((rx.getData(7) << 8) & 0xFF00)
                    + (rx.getData(8) & 0xFF));
        } // if - Destination message received
        
      } // if - Series 2 RX response
    } // if - packet received
    
  } // while - still taking readings
  
} // takeReadings

/*
 * This method gets the current latitude and longitude of the mote as long values read 
 * from the GPS module and converted to 1,000,000ths of a degree using the tinyGPS
 * library. After this method is called the global value of the longitude and latitude
 * variables are updated. NOTE: In order for this method to work, it must be called 
 * frequently enough to catch the GPS as it is available so it will not update the 
 * coordinate values if called too infrequently (100ms seems to be the longest delay 
 * between calls that will still allow it to work properly).
 */
void getLocation() {
  
  while (gps.available()) {
    
    // Get data from the GPS and parse the coordinates from it if it is valid
    data = gps.read();
    if (tinyGPS.encode(data)) {
      tinyGPS.get_position(&latitude, &longitude, &fixAge);
    } // if - valid sentence received from GPS
  
  } // while - there is data to be read from the gps

} // getLocation

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
