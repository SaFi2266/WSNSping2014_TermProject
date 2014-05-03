import java.net.URLEncoder;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.rapplogic.xbee.api.ApiId;
import com.rapplogic.xbee.api.XBee;
import com.rapplogic.xbee.api.XBeeAddress64;
import com.rapplogic.xbee.api.XBeeException;
import com.rapplogic.xbee.api.XBeeResponse;
import com.rapplogic.xbee.api.zigbee.ZNetRxResponse;
import com.rapplogic.xbee.api.zigbee.ZNetTxRequest;
import com.rapplogic.xbee.api.zigbee.ZNetTxStatusResponse;

import org.apache.http.client.fluent.Request;

/**
 * Needs to be written
 * @author Elliot Dean
 */
public class Gateway {

	/** The XBee object used to communicate with the network */
	XBee xbee; 
	
	/** A list of mote objects representing all motes in the wireless network*/
	ArrayList<Mote> moteList;
	
	/** 
	 * Arrays containing the latitude (0) and longitude (1) of both the home
	 * location of the network (where the gateway is able to access the
	 * Internet and motes/robots are able to recharge if needed) and the next
	 * destination that the network should travel to to take the next readings.
	 */
	double[] homeCoordinates={40.871286, 111.259918}, destCoordinates={0, 0};
	
	/** The latitude and longitude difference between each mote */
	double latSpread = 0.003, longSpread = 0.0;
	
	/** How long the network should take readings before returning home */
	int tripDuration;
	
	/** The unique identifier of the group */
	int groupId = 1; 
	
	SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
	
	/** 
	 * The amount of time that each mote should wait between taking and
	 * transmitting readings.
	 */
	int readingDelay;
	
	/**
	 * This method will create the gateway object, open the connection to the
	 * XBee radio, and then begin the main program loop that will run
	 * continuously.
	 * 
	 * @throws XBeeException 
	 */
	public static void main(String[] args) {
		
		// Create the gateway and connect to the XBee
		Gateway gateway = new Gateway();
		try {
			gateway.xbee.open("COM0", 9600);
		} catch (XBeeException e) {
			System.out.println("Error connecting to XBee");
			System.exit(1);
		} // try/catch - connect to XBee
		
		// Add motes to the network
		XBeeAddress64[] moteAddrs = 
			{new XBeeAddress64("12 23 34 45 56 67 78 89")};
		gateway.addMotes(moteAddrs);
		
		// Start the main program loop
		gateway.run();
		
	} // main
	
	/**
	 * Creates a Gateway object.
	 */
	public Gateway() {
		xbee = new XBee();
	} // Gateway
	
	/**
	 * Needs to be written
	 */
	private void run() {
		
		while (true) {
			
			getInstructions();
			sendReadingParameters();
			goToDestination(this.destCoordinates);
			listenForReadings();
			goToDestination(this.homeCoordinates);
			uploadData();
			
		} // while - main program loop
		
	} // run
	
	/**
	 * This method gets the current destination coordinates, trip duration, and
	 * reading delay from the database and sets the local variables based on
	 * the values that are returned.
	 */
	private void getInstructions() {
		
		try {
			String httpResponse = Request.Get(
					"http://sensornetworks.engr.uga.edu/sp14/elliotd/php/"
					+ "getGroupInstructions.php?groupId=" + this.groupId)
					.execute().returnContent().asString();
			
			JsonObject j = new JsonParser().parse(httpResponse)
					.getAsJsonArray().get(0).getAsJsonObject();
			
			this.destCoordinates[0] = j.get("latitude").getAsDouble();
			this.destCoordinates[1] = j.get("longitude").getAsDouble();
			this.tripDuration = j.get("tripDuration").getAsInt();
			this.readingDelay = j.get("readingDelay").getAsInt();
			
		} catch (Exception e) {
			System.out.println(e.getLocalizedMessage());
		} // try-catch
		
	} // getInstructions
	
	/**
	 * This message sends a reading parameter update message with the current
	 * value of the reading delay to all of the motes in the network. The
	 * structure of the message payload is as follows:
	 * 
	 * 		Byte 1: Message type identifier - 'P'
	 * 		Byte 2: Most significant byte of the reading delay
	 * 		Byte 3: The second most significant byte of the reading delay
	 * 		Byte 4: The third most significant byte of the reading delay
	 * 		Byte 5: Least significant byte of the reading delay
	 */
	private void sendReadingParameters() {
		
		for(Mote mote : this.moteList) {
			
			// Create the message payload
			int[] payload = new int[5];
			payload[0] = 'P'; // The message type identifier
			payload[1] = (this.readingDelay >> 24) & 0xFF;
			payload[2] = (this.readingDelay >> 16) & 0xFF;
			payload[3] = (this.readingDelay >> 8) & 0xFF;
			payload[4] = this.readingDelay & 0xFF;
			
			// Send the message to the mote, ensuring delivery
			ZNetTxRequest m = new ZNetTxRequest(mote.address, payload);
			while(true) {
				try {
					ZNetTxStatusResponse response = 
							(ZNetTxStatusResponse)this.xbee.
							sendSynchronous(m, 3000);
					if (response.isSuccess())
						break;
					else
						throw new XBeeException();
				} catch (XBeeException e) {
					continue; // Message failed, try again
				} // try-catch
			} // while - trying to send the message
			
		} // for each - mote in the network
		
	} // sendReadingParameters
	
	/**
	 * This method will send messages containing the remote coordinates of the
	 * next location that they should go to take readings. It will then wait
	 * and listen for arrival messages to make sure that all of the motes have
	 * reached the destination before continuing. The payload of the arrival
	 * message is a single byte containing the character 'A'.
	 */
	private void goToDestination(double[] destination) {
		
		// TODO: Tell all of the motes to go to the destination
		
		while (true) {
			
			boolean allArrived = true;
			for (Mote mote : this.moteList) {
				if (!mote.atDestination) {
					allArrived = false;
					break;
				} // if - the mote that has not yet arrived
			} // for - each mote in the network
			
			// Finished if all motes have reached the destination
			if (allArrived)
				return;
			
			// Otherwise, keep waiting for arrival messages
			try {
				
				// Wait for a packet to process
				XBeeResponse response = this.xbee.getResponse();
				if (response.getApiId() == ApiId.ZNET_RX_RESPONSE) {
					
					ZNetRxResponse rx = (ZNetRxResponse)response;
					if (rx.getData()[0] == 'A') {
						for (Mote mote : this.moteList) {
							if (mote.address == rx.getRemoteAddress64()) {
								mote.atDestination = true;
								break;
							} // if - correct mote found
						} // for - each mote in the network
					} // if - arrival message received
					
				} // if - RX Response
				
			} catch (XBeeException e) {
				System.out.println("Error getting arrival message!");
			} // try/catch - receive and process packet
			
		} // while - there are still motes that haven't arrived
		
	} // goToDestination
	
	/**
	 * This method listens for reading packets for the duration of the trip.
	 * For each packet received, the raw readings from the temperature and 
	 * humidity sensors are parsed and then added to the source mote's list of
	 * readings along with the current time.
	 */
	private void listenForReadings() {
		
		// Listen for readings until the elapsed time exceeds the trip duration
		long endTime = System.currentTimeMillis() + (this.tripDuration/60000);
		while (System.currentTimeMillis() <= endTime) {
		
			try {

				// Wait for a packet to process
				XBeeResponse response = this.xbee.getResponse(1000);
				if (response.getApiId() == ApiId.ZNET_RX_RESPONSE) {

					ZNetRxResponse rx = (ZNetRxResponse)response;
					if (rx.getData()[0] == 'R') {
						
						// Parse the reading values from the payload
						int temp = (rx.getData()[1] << 8) & 0xFF00
								+ rx.getData()[2] & 0xFF;
						int humidity = (rx.getData()[3] << 8) & 0xFF00
								+ rx.getData()[4] & 0xFF;
						
						// Add the reading to the mote
						for (Mote mote : this.moteList) {
							if (mote.address == rx.getRemoteAddress64()) {
								mote.readingLog.add(new Object[] {temp, 
										humidity, new Date()});
								break;
							} // if - Source mote found
						} // for - each mote in the network
						
					} // if - reading message received

				} // if - RX Response

			} catch (XBeeException e) {
				System.out.println("Error getting arrival message!");
			} // try/catch - receive and process packet
		
		} // while - not yet time to return
	} // listenForReadings

	/**
	 * This method uploads every reading stored for each of the motes in the
	 * network. Each upload includes the raw temperature and humidity readings,
	 * the time and date of the reading, the address of the mote that took the
	 * reading, and the coordinate location that the readings were taken at. It
	 * then clears all of the stored readings for each mote since they are no
	 * longer needed locally.
	 */
	private void uploadData() {
		
		for (Mote mote : this.moteList) {
			
			String moteAddr = mote.address.toString();
			ArrayList<Object[]> readings = mote.readingLog;
			double latitude = this.destCoordinates[0] + mote.latOffset;
			double longitude = this.destCoordinates[1] = mote.longOffset;
			
			for (Object[] reading : readings) {
				
				int temperature = (Integer)reading[0];
				int humidity = (Integer)reading[1];
				String readingTime = df.format((Date)reading[2]);
				
				try {
					Request.Get(
							"http://sensornetworks.engr.uga.edu/sp14/elliotd/php/"
							+ "UploadData.php?password=tempPassword"
							+ "&radioAddress=" + URLEncoder.encode(moteAddr, "UTF-8")
							+ "&readingTime=" + URLEncoder.encode(readingTime, "UTF-8")
							+ "&temperature=" + temperature
							+ "&humidity=" + humidity 
							+ "&latitude=" + latitude
							+ "&longitude=" + longitude)
							.execute().returnContent().asString();
				} catch (Exception e) {
					System.out.println("Error uploading data!");
				} // try/catch - send the http request 
				
			} // for - each stored reading for the mote
		
			// Clear the mote's stored readings to prepare for next trip
			mote.readingLog.clear();
			
		} // for - each mote in the network
		
	} // uploadData

	/**
	 * This method builds the list of mote objects from an array of mote
	 * addresses and spreads each of them out evenly by the latitude and
	 * longitude spread values. This version of the method simply adds sets of
	 * motes at +/- the spread values but could be improved to spread the
	 * motes in more of a star or radial method.
	 * 
	 * @param moteAddrs: An array of mote addresses to be added
	 */
	private void addMotes(XBeeAddress64[] moteAddrs) {
		
		this.moteList.add(new Mote(moteAddrs[0], 0, 0));
		
		for (int i = 1; i < moteAddrs.length; i+=2) {
			
			this.moteList.add(new Mote(moteAddrs[i], 
					latSpread * (i - 1) / 2, longSpread * (i - 1) / 2));
			if (i + 1 < moteAddrs.length)
				this.moteList.add(new Mote(moteAddrs[i + 1],
						-latSpread * (i - 1) / 2, -longSpread * (i - 1) / 2));
			
		} // for - each set of two mote addresses
		
	} // addMotes
	
	/**
	 * This inner class represents a mote in the network. It includes the
	 * address of the XBee radio for the mote, a list to hold readings taken
	 * by the mote, a boolean that indicates if the mote is at its intended
	 * location, and offsets for the latitude and longitude that determine how
	 * far from the destination coordinates the mote should be when taking
	 * readings.
	 */
	private class Mote {
		
		XBeeAddress64 address;
		ArrayList<Object[]> readingLog = new ArrayList<Object[]>();
		boolean atDestination = false;
		double latOffset, longOffset;
		
		/**
		 * This method creates a Mote object with the given radio address,
		 * latitude offset, and longitude offset.
		 * 
		 * @param addr: The address of the radio of the mote
		 * @param latOffset: The motes difference in lat. from the destination
		 * @param longOffset: The motes difference in long. from the dest.
		 */
		public Mote(XBeeAddress64 addr, double latOffset, double longOffset) {
			this.address = addr;
			this.latOffset = latOffset;
			this.longOffset = longOffset;
		} // Mote
		
	} // Mote - inner class
	
} // Gateway - class
