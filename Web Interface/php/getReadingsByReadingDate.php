<?php

$sDate = $_REQUEST["sDate"];
$eDate = $_REQUEST["eDate"];

// Connect to the mySQL database
$db = new mysqli("localhost", "snadmin", "snadmin*", "sensornetworks");

// Check that connection to the database was successfully established
if ($db->connect_error)
	die("Error connecting to the database");

// Get all tuples that match the input range
$selectString = "SELECT temperature, humidity, readingTime, uploadTime " .
"FROM sensornetworks.sp14_elliotd_datalog " .
"WHERE DATE(readingTime) >= '$sDate' AND DATE(readingTime) <= '$eDate';";
$result = $db->query($selectString);

// Return the HTML formatted table with the selected data
echo "<table border='1'>
<tr>
<th>Temperature</th>
<th>Humidity</th>
<th>Reading Time</th>
<th>Upload Time</th>
</tr>";

while($row = mysqli_fetch_array($result)) {
  echo "<tr>";
  echo "<td>" . $row['temperature'] . "</td>";
  echo "<td>" . $row['humidity'] . "</td>";
  echo "<td>" . $row['readingTime'] . "</td>";
  echo "<td>" . $row['uploadTime'] . "</td>";
  echo "</tr>";
}
echo "</table>";

?>
