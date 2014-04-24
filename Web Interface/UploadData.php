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
$temperature = $_REQUEST["temperature"];
$humidity = $_REQUEST["humidity"];

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
	
	// Create the mote if it doesn't exist in the database
	if (empty($moteId)) {
		$moteString = "INSERT INTO sensornetworks.sp14_elliotd_motes" .
			"(radioAddress, description) " .
			"VALUES ('$radioAddress', 'Auto-Generated');";
		$db->query($moteString) or die(mysqli_error($db));
		$res = $db->query($selectString);
		$row = $res->fetch_assoc();
		$moteId = $row['id'];
	} // if - no moteId
	
	// Insert the mote data into the database
	$insertString = "INSERT INTO sensornetworks.sp14_elliotd_datalog" .
		" (moteId, readingTime, temperature, humidity)" .
		" VALUES ($moteId,'$readingTime',$temperature,$humidity);";
	$db->query($insertString) or die(mysqli_error($db));
	
	echo 'Values successfully uploaded';

} // if - password is correct
else
	die("Error: invalid password");

?>
