<?php

// Assign the radio address to a variable or throw error if it wasn't supplied
if (isset($_REQUEST["radioAddress"]))
	$radioAddress = $_REQUEST["radioAddress"];
else
	die("Error: No radio address supplied");
	
// Assign the reading time to a variable or throw error if it wasn't supplied 
if (isset($_REQUEST["readingTime"]))
	$readingTime = $_REQUEST["readingTime"];
else
	die("Error: No reading time supplied");
	
// Assign the sensor readings to variables
$temperature = (($_REQUEST["temperature"]*500)/1023.0) - 50;
$humidity = (($_REQUEST["humidity"]*5/1023.0 - 0.958)/0.0307)/(1.0546 - 0.00216*$temperature);
$latitude = $_REQUEST["latitude"];
$longitude = $_REQUEST["longitude"];

// Connect to the mySQL database
$db = new mysqli("localhost", "snadmin", "snadmin*", "sensornetworks");

// Check that connection to the database was successfully established
if ($db->connect_error)
	die("Error connecting to the database");

if ($_REQUEST["password"] == 'tempPassword') {

	// Get the id of the mote with the given radio address from the database
	$selectString = "SELECT id FROM sensornetworks.sp14_elliotd_motes" .
		" WHERE radioAddress='$radioAddress';";	
	$res = $db->query($selectString) or die(mysqli_error($db));
	$row = $res->fetch_assoc();
	$moteId = $row['id'];
	
	// Insert the mote data into the database
	$insertString = "INSERT INTO sensornetworks.sp14_elliotd_datalog" .
		" (moteId, readingTime, temperature, humidity, latitude, longitude)" .
		" VALUES ($moteId, '$readingTime', $temperature, $humidity, " . 
		"$latitude, $longitude);";
	$db->query($insertString) or die(mysqli_error($db));
	
	echo 'Values successfully uploaded';

} // if - password is correct
else
	die("Error: invalid password");

?>
