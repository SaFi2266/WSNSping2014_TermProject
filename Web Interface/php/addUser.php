<?php

// Assign the attempted username and password to variables
$name = $_REQUEST['name'];
$pw = $_REQUEST['pw'];

// Connect to the mySQL database
$db = new mysqli("localhost", "snadmin", "snadmin*", "sensornetworks");

// Check that connection to the database was successfully established
if ($db->connect_error)
	die("Error connecting to the database");

// Try to create the new user, return 1 if successful, 0 otherwise
$insertString = "INSERT INTO sensornetworks.sp14_elliotd_users " .
"(userName, password) VALUES ('$name', SHA1('$pw'));";
$db->query($insertString) or die('0');
echo '1';

mysqli_close($con);
?>