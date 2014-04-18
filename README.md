WSNTermProject - Desert Condition Monitoring
========================

For my project I will design a wireless sensor network that will take readings
from HIH-4030 humidity sensors and TMP36 temperature sensors attached to XBee 
series 2 radios and periodically send the readings to a gateway node which will
upload the readings to an off-site database. This system could potentially be 
used with mobile robots within hot, arid deserts to log environmental 
conditions within the desert. The required components that will be developed in
order for this system to work will be:
========================

End Device
	- The circuit used to connect the humidity and temperature sensors to the 
	XBee radios will need to be defined.
	- The XBees will need to be set to take periodic readings from the sensors,
	send these readings to a router to be handled, and then sleep in order to
	save power when not in use.
	
Coordinator / Temporary Value Storage
	- The coordinator will store all of the sensor readings received from the
	end devices until it is able to access to the gateway node.
	- The coordinator will also likely be responsible for converting the analog
	data from the sensors to a more meaningful value and assigning a mote id 
	and time-stamp to each value.
	
Gateway Node
	- The gateway node will have access to the internet and be responsible for 
	taking in all of the data collected from the end devices over a period of
	time and uploading it to the database through the PHP web interface.
	
PHP interface
	- The PHP interface will receive sets of information from the gateway node
	and put the values into a database to be logged.
	- An interface for a user to view selective data from the database will 
	also be developed. 
	
Database
	- The database will keep track of all of the readings that have been taken,
	the mote that took the reading, and the time that the values were taken.
	