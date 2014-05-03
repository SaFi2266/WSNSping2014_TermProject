<?php

// Assign the attempted username and password to variables
$groupId = $_REQUEST['groupId'];

// Connect to the mySQL database
$db = new mysqli("localhost", "snadmin", "snadmin*", "sensornetworks");

// Check that connection to the database was successfully established
if ($db->connect_error)
	die("Error connecting to the database");

// Determine if any pairs in the user table match, return 1 if so, 0 otherwise
$queryString = "SELECT longitude, latitude, tripDuration, readingDelay " . 
	"FROM sensornetworks.sp14_elliotd_groups WHERE groupId = '$groupId';";
$res = $db->query($queryString);

// Pack the table data into an array
$toReturn = array();
while($row = $res->fetch_assoc()) {
	$toReturn[] = $row;
} // while

// Return the JSON encoding of the array
echo json_encode($toReturn);

mysqli_close($con);
?>