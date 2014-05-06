<?php

// Connect to the mySQL database
$db = new mysqli("localhost", "snadmin", "snadmin*", "sensornetworks");

// Check that connection to the database was successfully established
if ($db->connect_error)
	die("Error connecting to the database");

// Get all tuples within the groups table
$queryString = "SELECT * FROM sensornetworks.sp14_elliotd_groups;";
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