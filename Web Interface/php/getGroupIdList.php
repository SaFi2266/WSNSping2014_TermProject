<?php

// Connect to the mySQL database
$db = new mysqli("localhost", "snadmin", "snadmin*", "sensornetworks");

// Check that connection to the database was successfully established
if ($db->connect_error)
	die("Error connecting to the database");

// Get and print the list of all group id's
$selectString = "SELECT DISTINCT groupId FROM sensornetworks.sp14_elliotd_groups;";
$res = $db->query($selectString);
while ($row = $res->fetch_assoc())
	echo $row['groupId'] . ' ';

?>
