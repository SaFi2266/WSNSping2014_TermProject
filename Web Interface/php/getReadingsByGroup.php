<?php

// Assign the get parameter to a variable
$groupId = $_REQUEST["id"];

// Connect to the mySQL database
$db = new mysqli("localhost", "snadmin", "snadmin*", "sensornetworks");

// Check that connection to the database was successfully established
if ($db->connect_error)
	die("Error connecting to the database");

// Get all tuples corresponding to motes in the given group
$selectString = "SELECT d.* " .
"FROM sensornetworks.sp14_elliotd_datalog d, sensornetworks.sp14_elliotd_motes m " .
"WHERE m.group = $groupId AND m.id = d.moteId";
$result = $db->query($selectString);

// Print out the HTML formatted table
echo "<table border='1'>
<tr>
<th>Mote Id</th>
<th>Temperature</th>
<th>Humidity</th>
<th>Latitude</th>
<th>Longitude</th>
<th>Reading Time</th>
<th>Upload Time</th>
</tr>";

while($row = mysqli_fetch_array($result)) {
  echo "<tr>";
  echo "<td>" . $row['moteId'] . "</td>";
  echo "<td>" . number_format($row['temperature'], 2) . "</td>";
  echo "<td>" . number_format($row['humidity'], 2) . "</td>";
  echo "<td>" . $row['latitude'] . "</td>";
  echo "<td>" . $row['longitude'] . "</td>";
  echo "<td>" . $row['readingTime'] . "</td>";
  echo "<td>" . $row['uploadTime'] . "</td>";
  echo "</tr>";
}
echo "</table>";

?>
