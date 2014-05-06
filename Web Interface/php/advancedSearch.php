<?php

// Return nothing if no parameters were set
if (empty($_REQUEST)) die();

// Initialize clause string with trivial value
$whereClause = "1=1";

// Load get parameters into variables
$moteLow = $_REQUEST["moteLow"];
$moteHigh = $_REQUEST["moteHigh"];
$mote = $_REQUEST["mote"];
$groupLow = $_REQUEST["groupLow"];
$groupHigh = $_REQUEST["groupHigh"];
$group = $_REQUEST["group"];
$tempLow = $_REQUEST["tempLow"];
$tempHigh = $_REQUEST["tempHigh"];
$temp = $_REQUEST["temp"];
$humidityLow = $_REQUEST["humidityLow"];
$humidityHigh = $_REQUEST["humidityHigh"];
$humidity = $_REQUEST["humidity"];
$readTimeLow = $_REQUEST["readTimeLow"];
$readTimeHigh = $_REQUEST["readTimeHigh"];
$readTime = $_REQUEST["readTime"];
$uploadTimeLow = $_REQUEST["uploadTimeLow"];
$uploadTimeHigh = $_REQUEST["uploadTimeHigh"];
$uploadTime = $_REQUEST["uploadTime"];
$readDateLow = $_REQUEST["readDateLow"];
$readDateHigh = $_REQUEST["readDateHigh"];
$readDate = $_REQUEST["readDate"];
$uploadDateLow = $_REQUEST["uploadDateLow"];
$uploadDateHigh = $_REQUEST["uploadDateHigh"];
$uploadDate = $_REQUEST["uploadDate"];
$latitudeLow = $_REQUEST["latitudeLow"];
$latitudeHigh = $_REQUEST["latitudeHigh"];
$latitude = $_REQUEST["latitude"];
$longitudeLow = $_REQUEST["longitudeLow"];
$longitudeHigh = $_REQUEST["longitudeHigh"];
$longitude = $_REQUEST["longitude"];

// Add statements to the clause for each parameter given
if (isset($moteLow))
	$whereClause .= " AND d.moteId >= $moteLow";
if (isset($moteHigh))
	$whereClause .= " AND d.moteId <= $moteHigh";
if (isset($mote))
	$whereClause .= " AND d.moteId = $mote";
if (isset($groupLow))
	$whereClause .= " AND m.group >= $groupLow AND m.id = d.moteId";
if (isset($groupHigh))
	$whereClause .= " AND m.group <= $groupHigh AND m.id = d.moteId";
if (isset($group))
	$whereClause .= " AND m.group = $group AND m.id = d.moteId";
if (isset($tempLow))
	$whereClause .= " AND d.temperature >= $tempLow";
if (isset($tempHigh))
	$whereClause .= " AND d.temperature <= $tempHigh";
if (isset($temp))
	$whereClause .= " AND d.temperature = $temp";
if (isset($humidityLow))
	$whereClause .= " AND d.humidity >= $humidityLow";
if (isset($humidityHigh))
	$whereClause .= " AND d.humidity <= $humidityHigh";
if (isset($humidity))
	$whereClause .= " AND d.humidity = $humidity";
if (isset($readTimeLow))
	$whereClause .= " AND TIME(d.readingTime) >= $readTimeLow";
if (isset($readTimeHigh))
	$whereClause .= " AND TIME(d.readingTime) <= $readTimeHigh";
if (isset($readTime))
	$whereClause .= " AND TIME(d.readingTime) = $readTime";
if (isset($uploadTimeLow))
	$whereClause .= " AND TIME(d.uploadTime) >= $uploadTimeLow";
if (isset($uploadTimeHigh))
	$whereClause .= " AND TIME(d.uploadTime) <= $uploadTimeHigh";
if (isset($uploadTime))
	$whereClause .= " AND TIME(d.uploadTime) = $uploadTime";
if (isset($readDateLow))
	$whereClause .= " AND DATE(d.readingTime) >= $readDateLow";
if (isset($readDateHigh))
	$whereClause .= " AND DATE(d.readingTime) <= $readDateHigh";
if (isset($readDate))
	$whereClause .= " AND DATE(d.readingTime) = $readDate";
if (isset($uploadDateLow))
	$whereClause .= " AND DATE(d.uploadTime) >= $uploadDateLow";
if (isset($uploadDateHigh))
	$whereClause .= " AND DATE(d.uploadTime) <= $uploadDateHigh";
if (isset($uploadDate))
	$whereClause .= " AND DATE(d.uploadTime) = $uploadDate";
if (isset($latitudeLow))
	$whereClause .= " AND d.latitude >= $latitudeLow";
if (isset($latitudeHigh))
	$whereClause .= " AND d.latitude <= $latitudeHigh";
if (isset($latitude))
	$whereClause .= " AND d.latitude = $latitude";
if (isset($longitudeLow))
	$whereClause .= " AND d.longitude >= $longitudeLow";
if (isset($longitudeHigh))
	$whereClause .= " AND d.longitude <= $longitudeHigh";
if (isset($longitude))
	$whereClause .= " AND d.longitude = $longitude";

// Connect to the mySQL database
$db = new mysqli("localhost", "snadmin", "snadmin*", "sensornetworks");

// Check that connection to the database was successfully established
if ($db->connect_error)
	die("Error connecting to the database");

// Get the tuples that match all of the given conditions
$selectString = "SELECT DISTINCT d.* " .
"FROM sensornetworks.sp14_elliotd_datalog d, sensornetworks.sp14_elliotd_motes m " .
"WHERE $whereClause;";
$result = $db->query($selectString);

// Print the table head
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

// Print rows for each returned tuple
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
