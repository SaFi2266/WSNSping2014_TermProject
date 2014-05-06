WSNTermProject - Desert Condition Monitoring
========================

For my project I will design a wireless sensor network that will take readings
from HIH-4030 humidity sensors and TMP36 temperature sensors attached to XBee 
series 2 radios and periodically send the readings to a gateway node which will
upload the readings to an off-site database when it has access to the internet. 
This system could potentially be used with mobile robots within hot, arid 
deserts to log environmental conditions within the desert. 

#####The required components that will be developed for this system will be:

Motes
	- The circuit used to connect the humidity and temperature sensors to the 
	Arduinos and XBee radios will need to be designed.
	- The motes will need to be set to take periodic readings from the sensors
	and send these readings to a coordinator to be handled.
	- The motes will need to be able to determine their position using a GPS
	module
	
Coordinator / Gateway
	- The coordinator will store all of the sensor readings received from the
	end devices until it is able to access to the gateway node.
	- The coordinator will be responsible for keeping track of which mote took
	each set of data and what time the data was received.
	- The gateway will have access to the internet and be responsible for 
	uploading all of the data collected from the nodes to the database through 
	the web interface. It will also receive instructions from the web interface.
	
Web interface
	- The web interface will receive sets of information from the gateway node
	and put the values into a database to be logged.
	- An interface for a user to view selective data from the database and to 
	have some control over the motes will also be developed. 
	
Database
	- The database will keep track of all of the readings that have been taken,
	the mote that took the reading, and the location and time that the values 
	were taken.
	
