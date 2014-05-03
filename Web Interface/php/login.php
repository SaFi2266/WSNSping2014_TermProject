<?php

// Assign the attempted username and password to variables
$name = $_REQUEST['name'];
$pw = $_REQUEST['pw'];

// Connect to the mySQL database
$db = new mysqli("localhost", "snadmin", "snadmin*", "sensornetworks");

// Check that connection to the database was successfully established
if ($db->connect_error)
	die("Error connecting to the database");

// Determine if any pairs in the user table match, return 1 if so, 0 otherwise
$selectString = "SELECT EXISTS(SELECT * FROM sensornetworks.sp14_elliotd_users"
. " WHERE userName='$name' AND password=SHA1('$pw')) AS 'pass';";
$res = $db->query($selectString);
$row = $res->fetch_assoc();
echo $row['pass'];

mysqli_close($con);
?>