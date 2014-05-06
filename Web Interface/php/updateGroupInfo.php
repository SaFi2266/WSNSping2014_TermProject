<?php

// Assign the get parameters to variables
$groupId = $_REQUEST['groupId'];
$latitude = $_REQUEST['latitude'];
$longitude = $_REQUEST['longitude'];
$tripDuration = $_REQUEST['tripDuration'];
$readingDelay = $_REQUEST['readingDelay'];

// Connect to the mySQL database
$db = new mysqli("localhost", "snadmin", "snadmin*", "sensornetworks");

// Check that connection to the database was successfully established
if ($db->connect_error)
	die("Error connecting to the database");

// Create and send the update, return 1 if successful, 0 otherwise
$updateString = "UPDATE sensornetworks.sp14_elliotd_groups " .
"SET latitude = $latitude, longitude = $longitude, " .
"readingDelay = $readingDelay, tripDuration = $tripDuration " .
"WHERE groupId = $groupId;";
$db->query($updateString) or die("0");
echo "1";

mysqli_close($con);
?>