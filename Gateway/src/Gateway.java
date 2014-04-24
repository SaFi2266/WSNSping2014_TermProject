import java.net.URLEncoder;

import com.rapplogic.xbee.api.ApiId;
import com.rapplogic.xbee.api.XBee;
import com.rapplogic.xbee.api.XBeeException;
import com.rapplogic.xbee.api.XBeeResponse;
import com.rapplogic.xbee.api.zigbee.ZNetRxResponse;

import org.apache.http.client.fluent.Request;

/**
 * Needs to be written
 * @author Elliot Dean
 */
public class Gateway {

	XBee xbee;
	
	/**
	 * This method will create the gateway object, open the connection to the
	 * XBee radio, and then begin the main program loop that will run
	 * continuously.
	 * 
	 * @throws XBeeException 
	 */
	public static void main(String[] args) throws XBeeException {
		
		// Create the gateway, connect to the XBee, and run the program loop
		Gateway gateway = new Gateway();
		gateway.xbee.open("COM0", 9600);
		gateway.run();
		
	} // main
	
	/**
	 * Creates a Gateway object.
	 */
	public Gateway() {
		xbee = new XBee();
	} // Gateway
	
	/**
	 * This method will continually check for packets received by the XBee.
	 * When a packet is detected, the sensor data, radio address of the data's
	 * origin, and the date and time of the sensor readings will be parsed from
	 * the packets data and sent to be added to the database via the web
	 * interface.
	 * 
	 * @throws XBeeException 
	 */
	private void run() throws XBeeException {
		
		while (true) {
			
			// Check for incoming packets
			XBeeResponse response = xbee.getResponse();
			
			if (response.getApiId() == ApiId.ZNET_RX_RESPONSE) {
				Object[] data = parseRxData((ZNetRxResponse)response);
				uploadData((String)data[0], (String)data[1], 
						(Double)data[2], (Double)data[3]);
			} // if - response is a series 2 RX response
			
		} // while - main program loop
		
	} // run
	
	/**
	 * This method will parse an incoming message in order to get the radio
	 * address of the mote that took the sensor readings, the date and time
	 * that the readings were taken, the reading from the temperature sensor,
	 * and the reading from the humidity sensor. The structure of the incoming
	 * packets is as follows:
	 * 
	 * TODO: Decide on packet structure
	 * 
	 * @param rx: the message to be parsed
	 * @return an Object array containing all of the separate pieces of data
	 */
	private Object[] parseRxData(ZNetRxResponse rx) {
		// TODO: Parse address, date/time, and sensor data from rx
		Object[] dataArray = new Object[23];
		return dataArray;
	} // parseRxData
	
	/**
	 * This method takes the necessary information that is required to upload
	 * an entry to the database, sends it over HTTP to the web interface, and
	 * prints out anything that is returned by the PHP script.
	 * 
	 * @param moteAddr: The radio address of the mote that took the readings
	 * @param readingTime: The date and time that the readings were taken
	 * @param temperature: The temperature reading
	 * @param humidity: The humidity reading
	 */
	private void uploadData(String moteAddr, String readingTime, 
			Double temperature, Double humidity) {
		
		try {
			String httpResponse = Request.Get(
					"http://sensornetworks.engr.uga.edu/sp14/elliotd/"
					+ "UploadData.php?password=tempPassword"
					+ "&radioAddress=" + URLEncoder.encode(moteAddr, "UTF-8")
					+ "&readingTime=" + URLEncoder.encode(readingTime, "UTF-8")
					+ "&temperature=" + temperature
					+ "&humidity=" + humidity)
					.execute().returnContent().asString();
			System.out.println(httpResponse);
		} catch (Exception e) {
			System.out.println("Error uploading data");
		} // try-catch
	
	} // uploadData
	
} // Gateway - class
