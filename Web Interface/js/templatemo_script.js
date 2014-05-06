/* Credit: http://www.templatemo.com */

var menuDisabled = false;
var findDataDisabled = false;
var lastSearch = null;
var groupInfo;

// Coordinate values that correspond with the sides of the map
var mapTop = 47.336496;
var mapBottom = 36.331445;
var mapLeft = 92.977295;
var mapRight = 118.630371;
var mapHeight = Math.abs(mapTop - mapBottom);
var mapWidth = Math.abs(mapLeft - mapRight);

jQuery(function($) {
    
    $(window).load(function() { // makes sure the whole site is loaded
            $('#status').fadeOut(); // will first fade out the loading animation
            $('#preloader').delay(350).fadeOut('slow'); // will fade out the white DIV that covers the website.
            $('#main-wrapper').delay(350).css({'overflow':'visible'});
    });
    
    $(document).ready( function() {

		// Start by showing the login, load map and populate lists in the background
		overlay();
		window.addEventListener("load", loadMap(), false);
		populateDropDowns();
        
    // backstretch for background image
    var defaultImgSrc = $('img.main-img').attr('src');
    $.backstretch(defaultImgSrc, {speed: 500});
	
	// for responsive-menu
	$("#m-btn").click(function(){
		$("#responsive").toggle();
	});
	
    // copy menu list to responsive menu
    var mainMenuList = $('#menu-list').html();
    $('#responsive').html(mainMenuList);
	
	//for image slide on menu item click(normal) and responsive
	$("#menu-list a, #responsive a").on('click',function(e){
            e.preventDefault();
            if (menuDisabled == false) // check the menu has disabled?
            {
                menuDisabled = true; // disable to menu
                
                var name = $(this).attr('href');
                $('#menu-list li').removeClass('active');
                $('#responsive li').removeClass('active');

                //  set active to both menu
                var menuClass = $(this).parent('li').attr('class');
                $('.'+menuClass).addClass('active');
                $('#search-list li').removeClass('active');

                // hide responsive menu
                $("#responsive").hide();
                
                // get image url and assign to backstretch for background
                var imgSrc = $("img"+name+"-img").attr('src');
                $.backstretch(imgSrc, {speed: 500}); //backstretch for background fade in/out
                
                // content slide in/out
                $("section.active").animate({left:$("section.active").outerWidth()}, 400,function(){
                    $(this).removeClass("active");
                    $(this).hide();
                    $(name+"-text").show();
                    $(name+"-text").animate({left:'0px'},400,function(){
                        $(this).addClass("active");
                        $.backstretch("resize"); // resize the background image
                        menuDisabled = false; // enable the menu
                    });
                });
                
            }
            return;
	});
	
	// Slides the bottom search area into view when a search option is clicked
	$("#search-list a").on('click',function(e){
            e.preventDefault();
            if (findDataDisabled == false) // check the menu has disabled?
            {
                findDataDisabled = true; // disable menu
                
                var name = $(this).attr('href');
                $('#search-list li').removeClass('active');

                //  set active to both menu
                var menuClass = $(this).parent('li').attr('class');
                $('.'+menuClass).addClass('active');
                var lastItem = $(name+"-text").siblings('active');
				
                // content slide in/out
				if (lastSearch == null)
					lastSearch = $(name+"-text");
                lastSearch.animate({left:($("section.active").outerWidth()) + 250}, 400,function(){
                    $(this).removeClass("active");
                    $(this).hide();
					$(name+"-text").show();
					lastSearch = $(name+"-text");
                    $(name+"-text").animate({left:'0px'},400,function(){
                        $(this).addClass("active");
                        findDataDisabled = false; // enable the menu
                    });
                });
                
            }
            return;
	});
        
    });

});

// Loads the map and handles the creation and movement of the markers.
// Note: Most of the code in this section was adapted from source code found
// here-> http://rectangleworld.com/blog/archives/129
function loadMap() {
	
	var canvas = document.getElementById("mapCanvas");
	var context = canvas.getContext("2d");
	
	var numShapes;
	var shapes;
	var dragIndex;
	var dragging;
	var mouseX;
	var mouseY;
	var dragHoldX;
	var dragHoldY;
	var timer;
	var targetX;
	var targetY;
	var easeAmount;
	
	// Load map image
	var img = new Image();
	img.onload = function() {
		context.drawImage(img, 0, 0);
		mapInit();
	}
	img.src = "images/map.png";
	img.alt = "Desert Map";
	img.width = "500";
	
	function mapInit() {
		
		// Get the list of groups as a JSON object and set the number of shapes
		var xmlhttp=new XMLHttpRequest();
		xmlhttp.onreadystatechange=function() {
			// To be called when the request is complete
			if (xmlhttp.readyState==4 && xmlhttp.status==200) {
				groupInfo = JSON.parse(xmlhttp.responseText);
				numShapes = groupInfo.length;
				easeAmount = 0.45;
				shapes = [];
				makeShapes();
				drawShapes();
				canvas.addEventListener("mousedown", mouseDownListener, false);
			}
		}
	
		xmlhttp.open("GET", "php/getGroupInfo.php", true);
		xmlhttp.send();
	}
	
	function makeShapes() {
		
		// Adds a map marker for each group in the system and sets its coordinates
		var i;			
		for (i = 0; i < numShapes; i++) {
			tempShape = new mapMarker(
				Math.abs(groupInfo[i].longitude - mapLeft)/mapWidth * canvas.width,
				Math.abs(groupInfo[i].latitude - mapTop)/mapHeight * canvas.height,
				i);	
			shapes.push(tempShape);
		}
		
	}
	
	function mouseDownListener(evt) {
		var i;
		
		//getting mouse position correctly 
		var bRect = canvas.getBoundingClientRect();
		mouseX = (evt.clientX - bRect.left)*(canvas.width/bRect.width);
		mouseY = (evt.clientY - bRect.top)*(canvas.height/bRect.height);
				
		/*
		Below, we find if a shape was clicked. Since a "hit" on a square or a circle has to be measured differently, the
		hit test is done using the hitTest() function associated to the type of particle. This function is an instance method
		for both the SimpleDiskParticle and SimpleSqureParticle classes we have defined with the external JavaScript sources.		
		*/
		for (i=0; i < numShapes; i++) {
			if (shapes[i].hitTest(mouseX, mouseY)) {	
				updateMapForm(shapes[i], canvas); // Update Form
				dragging = true;
				//the following variable will be reset if this loop repeats with another successful hit:
				dragIndex = i;
			}
		}
		
		if (dragging) {
			window.addEventListener("mousemove", mouseMoveListener, false);
			
			//place currently dragged shape on top
			shapes.push(shapes.splice(dragIndex,1)[0]);
			
			//shapeto drag is now last one in array
			dragHoldX = mouseX - shapes[numShapes-1].x;
			dragHoldY = mouseY - shapes[numShapes-1].y;
			
			//The "target" position is where the object should be if it were to move there instantaneously. But we will
			//set up the code so that this target position is approached gradually, producing a smooth motion.
			targetX = mouseX - dragHoldX;
			targetY = mouseY - dragHoldY;
			
			//start timer
			timer = setInterval(onTimerTick, 1000/30);
		}
		canvas.removeEventListener("mousedown", mouseDownListener, false);
		window.addEventListener("mouseup", mouseUpListener, false);
		
		//code below prevents the mouse down from having an effect on the main browser window:
		if (evt.preventDefault) {
			evt.preventDefault();
		} //standard
		else if (evt.returnValue) {
			evt.returnValue = false;
		} //older IE
		return false;
	}
	
	function onTimerTick() {
		//because of reordering, the dragging shape is the last one in the array.
		shapes[numShapes-1].x = shapes[numShapes-1].x + easeAmount*(targetX - shapes[numShapes-1].x);
		shapes[numShapes-1].y = shapes[numShapes-1].y + easeAmount*(targetY - shapes[numShapes-1].y);
		
		//stop the timer when the target position is reached (close enough)
		if ((!dragging)&&(Math.abs(shapes[numShapes-1].x - targetX) < 0.1) && (Math.abs(shapes[numShapes-1].y - targetY) < 0.1)) {
			shapes[numShapes-1].x = targetX;
			shapes[numShapes-1].y = targetY;
			//stop timer:
			clearInterval(timer);
		}
		drawScreen();
	}
	
	function mouseUpListener(evt) {
		canvas.addEventListener("mousedown", mouseDownListener, false);
		window.removeEventListener("mouseup", mouseUpListener, false);
		if (dragging) {
			dragging = false;
			window.removeEventListener("mousemove", mouseMoveListener, false);
		}
	}

	function mouseMoveListener(evt) {
		var posX;
		var posY;
		var shapeRad = shapes[numShapes-1].radius;
		var minX = shapeRad;
		var maxX = canvas.width - shapeRad;
		var minY = shapeRad;
		var maxY = canvas.height - shapeRad;
		
		//getting mouse position correctly 
		var bRect = canvas.getBoundingClientRect();
		mouseX = (evt.clientX - bRect.left)*(canvas.width/bRect.width);
		mouseY = (evt.clientY - bRect.top)*(canvas.height/bRect.height);
		
		//clamp position to prevent object from dragging outside of canvas
		posX = mouseX - dragHoldX;
		posX = (posX < minX) ? minX : ((posX > maxX) ? maxX : posX);
		posY = mouseY - dragHoldY;
		posY = (posY < minY) ? minY : ((posY > maxY) ? maxY : posY);
		
		targetX = posX;
		targetY = posY;
		updateMapForm(shapes[numShapes-1], canvas); // Update form
	}
		
	function drawShapes() {
		var i;
		for (i=0; i < numShapes; i++) {
			shapes[i].drawToContext(context);
		}
	}
	
	function drawScreen() {
		// Draw the map and markers to the canvas
		context.drawImage(img, 0, 0);
		drawShapes();
	}

}

function overlay() {
	// Shows the login overlay and hides the create user overlay
	document.getElementById("newUser").style.visibility = "hidden";
	document.getElementById("overlay").style.visibility = "visible";
}

function hideOverlay() {
	// Hides the login overlay
	document.getElementById("overlay").style.visibility = "hidden";
}

function login() {

	// Get the values that the user entered
	oName = document.getElementById("oName").value;
	oPW = document.getElementById("oPW").value;
	
	var xmlhttp=new XMLHttpRequest();
	xmlhttp.onreadystatechange=function() {
		// To be called when the request is complete
		if (xmlhttp.readyState==4 && xmlhttp.status==200) {
			var success = xmlhttp.responseText;
			
			// Close the login if passed, retry otherwise
			if (success == '1')
				hideOverlay();
			else {
				document.getElementById("overlayHead").innerHTML = 'Try Again!!!';
				document.getElementById("oPW").value = '';
			} 
		}
	}
	
	xmlhttp.open("GET", "php/login.php?name=" + oName + "&pw=" + oPW, true);
	xmlhttp.send();
	
}

function newUser() {
	// Shows the create user overlay and hides the login overlay
	document.getElementById("overlay").style.visibility = "hidden";
	document.getElementById("newUser").style.visibility = "visible";
	return false;
}

function signUp() {

	// Clears old messages
	document.getElementById("signUpSuccess").innerHTML = '';
	document.getElementById("signUpError").innerHTML = '';

	// Get the values that the user entered
	name = document.getElementById("newName").value;
	pw = document.getElementById("newPW").value;
	pw2 = document.getElementById("newPW2").value;
	authCode = document.getElementById("authCode").value;
	
	// Make sure a user name was entered
	if (name == '') {
		document.getElementById("signUpError").innerHTML = 'Error: You must enter a user name!';
		return;
	}
	
	// Make sure a password was entered
	if (pw == '') {
		document.getElementById("signUpError").innerHTML = 'Error: You must enter a password!';
		return;
	}
	
	// Make sure passwords match
	if (pw !== pw2) {
		document.getElementById("newPW2").value = '';
		document.getElementById("signUpError").innerHTML = 'Error: Passwords must match!';
		return;
	}
	
	// Make sure authorization code is correct
	if (authCode !== 'code') {
		document.getElementById("authCode").value = '';
		document.getElementById("signUpError").innerHTML = 'Error: Incorrect Authorization Code!';
		return;
	}
	
	// Insert the value into the database
	var xmlhttp=new XMLHttpRequest();
	xmlhttp.onreadystatechange=function() {
		// To be called when the request is complete
		if (xmlhttp.readyState==4 && xmlhttp.status==200) {
			var success = xmlhttp.responseText;
			
			// Alert success if valid, error otherwise
			if (success == '1') {
				document.getElementById("signUpSuccess").innerHTML = 'SUCCESS!!!';
				document.getElementById("newName").value = '';
				document.getElementById("newPW").value = '';
				document.getElementById("newPW2").value = '';
				document.getElementById("authCode").value = '';
			}
			else {
				document.getElementById("signUpError").innerHTML = 'Error creating user! Try another User Name';
			} 
		}
	}
	
	xmlhttp.open("GET", "php/addUser.php?name=" + name + "&pw=" + pw, true);
	xmlhttp.send();
	
}

function backToOverlay() {
	// Shows the login overlay and hides and clears the create user overlay
	document.getElementById("newUser").style.visibility = "hidden";
	document.getElementById("overlay").style.visibility = "visible";
	document.getElementById("signUpError").innerHTML = '';
	document.getElementById("signUpSuccess").innerHTML = '';
	document.getElementById("newName").value = '';
	document.getElementById("newPW").value = '';
	document.getElementById("newPW2").value = '';
	document.getElementById("authCode").value = '';
	return false;
}

function populateDropDowns() {
	// Calls functions to populate the search drop pown menus
	populateMoteDropDown();
	populateGroupDropDown();
}

function populateMoteDropDown() {
	
	// Gets the list of motes and puts them into the mote search drop down menu
	var xmlhttp=new XMLHttpRequest();
	xmlhttp.onreadystatechange=function() {
		// To be called when the request is complete
		if (xmlhttp.readyState==4 && xmlhttp.status==200) {
			var m = xmlhttp.responseText;
			motes = m.split(' ');
			var list = document.getElementById("moteList");
			for (var i = 0; i < motes.length-1; i++) {
				var option = document.createElement("option");
				option.text = "Mote " + motes[i];
				option.value = motes[i];
				list.add(option);
			}
		}
	}
	
	xmlhttp.open("GET", "php/getMoteIdList.php", true);
	xmlhttp.send();
	
}

function populateGroupDropDown() {

	// Gets the list of groups and puts them into the group search drop down menu
	var xmlhttp=new XMLHttpRequest();
	xmlhttp.onreadystatechange=function() {
		// To be called when the request is complete
		if (xmlhttp.readyState==4 && xmlhttp.status==200) {
			var m = xmlhttp.responseText;
			groups = m.split(' ');
			var list = document.getElementById("groupList");
			for (var i = 0; i < groups.length-1; i++) {
				var option = document.createElement("option");
				option.text = "Group " + groups[i];
				option.value = groups[i];
				list.add(option);
			}
		}
	}
	
	xmlhttp.open("GET", "php/getGroupIdList.php", true);
	xmlhttp.send();

}

function populateTimeQuery(option) {
	
	// If searching by time
	if (option==1) {
		document.getElementById("timeQuery").innerHTML = ""+
			"<b> Start Time: </b> <input type=\"time\" name=\"sTime\" id=\"sTime\" value=\"00:00:00\"> "+
			"<br><br> "+
			"<b>End Time:</b> <input type=\"time\" name=\"eTime\" id=\"eTime\" value=\"23:59:00\"> "+
			"<br><br> "+
			"<input type=\"submit\" name=\"submit\" value=\"Submit\"> ";
	}
	// if searching by date
	else {
		document.getElementById("timeQuery").innerHTML = ""+
			"<b>Start Date:</b> <input type=\"date\" name=\"sDate\" id=\"sDate\" value=\"2000-01-01\"> "+
			"<br><br> "+
			"<b>End Date:</b> <input type=\"date\" name=\"eDate\" id=\"eDate\" value=\"2020-12-31\"> "+
			"<br><br> "+
			"<input type=\"submit\" name=\"submit\" value=\"Submit\"> ";
	}
	
}

function populateAdvQuery(option) {
	
	// Gets the query and option numbers
	var queryNo = Math.floor(option / 3);
	var optionNo = option % 3;
	var formId, inputType, inputId, pointValue, rangeLow, rangeHigh, queryString;
	
	// Gets form information and input types based on the query numbers
	switch (queryNo) {
		case 0:
			formId = "advMoteQuery";
			inputType = "number";
			inputId = "advMote";
			inputValue = "0";
			rangeLow = "0";
			rangeHigh = "100";
			break;
		case 1:
			formId = "advGroupQuery";
			inputType = "number";
			inputId = "advGroup";
			inputValue = "0";
			rangeLow = "0";
			rangeHigh = "10";
			break;
		case 2:
			formId = "advTempQuery";
			inputType = "text";
			inputId = "advTemp";
			inputValue = "70.00";
			rangeLow = "0.00";
			rangeHigh = "100.00";
			break;
		case 3:
			formId = "advHumidityQuery";
			inputType = "number";
			inputId = "advHumidity";
			inputValue = "10.00";
			rangeLow = "0.00";
			rangeHigh = "50.00";
			break;
		case 4:
			formId = "advReadTimeQuery";
			inputType = "time";
			inputId = "advReadTime";
			inputValue = "12:00";
			rangeLow = "00:00";
			rangeHigh = "23:59";
			break;
		case 5:
			formId = "advUploadTimeQuery";
			inputType = "time";
			inputId = "advUploadTime";
			inputValue = "12:00";
			rangeLow = "00:00";
			rangeHigh = "23:59";
			break;
		case 6:
			formId = "advReadDateQuery";
			inputType = "date";
			inputId = "advReadDate";
			inputValue = "2014-05-03";
			rangeLow = "2000-01-01";
			rangeHigh = "2020-12-31";
			break;
		case 7:
			formId = "advUploadDateQuery";
			inputType = "date";
			inputId = "advUploadDate";
			inputValue = "2014-05-03";
			rangeLow = "2000-01-01";
			rangeHigh = "2020-12-31";
			break;
		case 8:
			formId = "advLatitudeQuery";
			inputType = "text";
			inputId = "advLatitude";
			inputValue = "40.871286";
			rangeLow = "39";
			rangeHigh = "41";
			break;
		case 9:
			formId = "advLongitudeQuery";
			inputType = "text";
			inputId = "advLongitude";
			inputValue = "111.259918";
			rangeLow = "110";
			rangeHigh = "112";
			break;
	} // switch - queryNo
	
	// Populates the query based on the option chosen and the variables assigned above
	switch (optionNo) {
		case 0:
			queryString = "";
			break;
		case 1:
			queryString = "<b>Min: </b><input type=\"" + inputType
				+ "\" id=\"s" + inputId + "\" value=\"" + rangeLow
				+ "\"><br><b>Min: </b><input type=\"" + inputType
				+ "\" id=\"e" + inputId + "\" value=\"" + rangeHigh + "\"><br>";
			break;
		case 2:
			queryString = "<b>Value: </b><input type=\"" + inputType
				+ "\" id=\"" + inputId + "\" value=\"" + inputValue + "\"><br>";
			break;
	} // switch - optionNo
	
	document.getElementById(formId).innerHTML = queryString;
	
}

function moteSearch(id) {
	
	// If no mote is chosen, clear results
	if (id=="") {
		document.getElementById("moteData").innerHTML="";
		return;
	}

	// Get the result table and print it
	var xmlhttp=new XMLHttpRequest();
	xmlhttp.onreadystatechange=function() {
		// To be called when the request is complete
		if (xmlhttp.readyState==4 && xmlhttp.status==200) {
			document.getElementById("moteData").innerHTML=xmlhttp.responseText;
		}
	}
	
	xmlhttp.open("GET", "php/getReadingsByMote.php?id=" + id, true);
	xmlhttp.send();
	
}

function groupSearch(id) {

	// If no group is chosen, clear the results
	if (id=="") {
		document.getElementById("groupData").innerHTML="";
		return;
	}

	// Get the results and print them
	var xmlhttp=new XMLHttpRequest();
	xmlhttp.onreadystatechange=function() {
		// To be called when the request is complete
		if (xmlhttp.readyState==4 && xmlhttp.status==200) {
			document.getElementById("groupData").innerHTML=xmlhttp.responseText;
		}
	}
	
	xmlhttp.open("GET", "php/getReadingsByGroup.php?id=" + id, true);
	xmlhttp.send();

}

function dateTimeSearch() {
	
	// Choose which search to use based on which box is checked
	if (document.getElementById("tTime").checked)
		timeSearch();
	else if (document.getElementById("tDate").checked)
		dateSearch();
	
}

function timeSearch() {

	// Get the values that the user entered
	sTime = document.getElementById("sTime").value;
	eTime = document.getElementById("eTime").value;

	// Get the results and print them
	var xmlhttp=new XMLHttpRequest();
	xmlhttp.onreadystatechange=function() {
		// To be called when the request is complete
		if (xmlhttp.readyState==4 && xmlhttp.status==200) {
			document.getElementById("timeData").innerHTML = xmlhttp.responseText;
		}
	}
	
	// Choose which URL to use based on which box is checked
	if (document.getElementById("tReading").checked)
		xmlhttp.open("GET", "php/getReadingsByReadingTime.php?sTime=" + sTime + "&eTime=" + eTime, true);
	else
		xmlhttp.open("GET", "php/getReadingsByUploadTime.php?sTime=" + sTime + "&eTime=" + eTime, true);
	xmlhttp.send();

}

function dateSearch() {

	// Get the values that the user entered
	sDate = document.getElementById("sDate").value;
	eDate = document.getElementById("eDate").value;

	// Get the results and print them
	var xmlhttp=new XMLHttpRequest();
	xmlhttp.onreadystatechange=function() {
		// To be called when the request is complete
		if (xmlhttp.readyState==4 && xmlhttp.status==200) {
			document.getElementById("timeData").innerHTML = xmlhttp.responseText;
		}
	}
	
	// Choose which URL to use based on which box is checked
	if (document.getElementById("tReading").checked)
		xmlhttp.open("GET", "php/getReadingsByReadingDate.php?sDate=" + sDate + "&eDate=" + eDate, true);
	else
		xmlhttp.open("GET", "php/getReadingsByUploadDate.php?sDate=" + sDate + "&eDate=" + eDate, true);
	xmlhttp.send();

}

function advancedSearch() {
	
	var httpParams = "";
	
	// Add parameters to the string based on which boxes are checked
	if (document.getElementById("moteRange").checked) {
		if (document.getElementById("sadvMote").value != "")
			httpParams += "&moteLow=" + document.getElementById("sadvMote").value;
		if (document.getElementById("eadvMote").value != "")
			httpParams += "&moteHigh=" + document.getElementById("eadvMote").value;
	}
	if (document.getElementById("motePoint").checked && document.getElementById("advMote").value != "")
		httpParams += "&mote=" + document.getElementById("advMote").value;
	
	if (document.getElementById("groupRange").checked) {
		if (document.getElementById("sadvGroup").value != "")
			httpParams += "&groupLow=" + document.getElementById("sadvGroup").value;
		if (document.getElementById("eadvGroup").value != "")
			httpParams += "&groupHigh=" + document.getElementById("eadvGroup").value;
	}
	if (document.getElementById("groupPoint").checked && document.getElementById("advGroup").value != "")
		httpParams += "&group=" + document.getElementById("advGroup").value;
	
	if (document.getElementById("tempRange").checked) {
		if (document.getElementById("sadvTemp").value != "")
			httpParams += "&tempLow=" + document.getElementById("sadvTemp").value;
		if (document.getElementById("eadvTemp").value != "")
			httpParams += "&tempHigh=" + document.getElementById("eadvTemp").value;
	}
	if (document.getElementById("tempPoint").checked && document.getElementById("advTemp").value != "")
		httpParams += "&temp=" + document.getElementById("advTemp").value;
	
	if (document.getElementById("humidityRange").checked) {
		if (document.getElementById("sadvHumidity").value != "")
			httpParams += "&humidityLow=" + document.getElementById("sadvHumidity").value;
		if (document.getElementById("eadvHumidity").value != "")
			httpParams += "&humidityHigh=" + document.getElementById("eadvHumidity").value;
	}
	if (document.getElementById("humidityPoint").checked && document.getElementById("advHumidity").value != "")
		httpParams += "&humidity=" + document.getElementById("advHumidity").value;
	
	if (document.getElementById("readTimeRange").checked) {
		if (document.getElementById("sadvReadTime").value != "")
			httpParams += "&readTimeLow=" + document.getElementById("sadvReadTime").value;
		if (document.getElementById("eadvReadTime").value != "")
			httpParams += "&readTimeHigh=" + document.getElementById("eadvReadTime").value;
	}
	if (document.getElementById("readTimePoint").checked && document.getElementById("advReadTime").value != "")
		httpParams += "&readTime=" + document.getElementById("advReadTime").value;
	
	if (document.getElementById("uploadTimeRange").checked) {
		if (document.getElementById("sadvUploadTime").value != "")
			httpParams += "&uploadTimeLow=" + document.getElementById("sadvUploadTime").value;
		if (document.getElementById("eadvUploadTime").value != "")
			httpParams += "&uploadTimeHigh=" + document.getElementById("eadvUploadTime").value;
	}
	if (document.getElementById("uploadTimePoint").checked && document.getElementById("advUploadTime").value != "")
		httpParams += "&uploadTime=" + document.getElementById("advUploadTime").value;
	
	if (document.getElementById("readDateRange").checked) {
		if (document.getElementById("sadvReadDate").value != "")
			httpParams += "&readDateLow=" + document.getElementById("sadvReadDate").value;
		if (document.getElementById("eadvReadDate").value != "")
			httpParams += "&readDateHigh=" + document.getElementById("eadvReadDate").value;
	}
	if (document.getElementById("readDatePoint").checked && document.getElementById("advReadDate").value != "")
		httpParams += "&readDate=" + document.getElementById("advReadDate").value;
	
	if (document.getElementById("uploadDateRange").checked) {
		if (document.getElementById("sadvUploadDate").value != "")
			httpParams += "&uploadDateLow=" + document.getElementById("sadvUploadDate").value;
		if (document.getElementById("eadvUploadDate").value != "")
			httpParams += "&uploadDateHigh=" + document.getElementById("eadvUploadDate").value;
	}
	if (document.getElementById("uploadDatePoint").checked && document.getElementById("advUploadDate").value != "")
		httpParams += "&uploadDate=" + document.getElementById("advUploadDate").value;
	
	if (document.getElementById("latitudeRange").checked) {
		if (document.getElementById("sadvLatitude").value != "")
			httpParams += "&latitudeLow=" + document.getElementById("sadvLatitude").value;
		if (document.getElementById("eadvLatitude").value != "")
			httpParams += "&latitudeHigh=" + document.getElementById("eadvLatitude").value;
	}
	if (document.getElementById("latitudePoint").checked && document.getElementById("advLatitude").value != "")
		httpParams += "&latitude=" + document.getElementById("advLatitude").value;
	
	if (document.getElementById("longitudeRange").checked) {
		if (document.getElementById("sadvLongitude").value != "")
			httpParams += "&longitudeLow=" + document.getElementById("sadvLongitude").value;
		if (document.getElementById("eadvLongitude").value != "")
			httpParams += "&longitudeHigh=" + document.getElementById("eadvLongitude").value;
	}
	if (document.getElementById("longitudePoint").checked && document.getElementById("advLongitude").value != "")
		httpParams += "&longitude=" + document.getElementById("advLongitude").value;
		
	// Get the results and print them
	var xmlhttp=new XMLHttpRequest();
	xmlhttp.onreadystatechange=function() {
		// To be called when the request is complete
		if (xmlhttp.readyState==4 && xmlhttp.status==200) {
			document.getElementById("advancedData").innerHTML=xmlhttp.responseText;
		}
	}
	
	// Send the request with all of the conditions tagged on
	xmlhttp.open("GET", "php/advancedSearch.php?" + httpParams, true);
	xmlhttp.send()
	
}

function mapMarker(posX, posY, index) {
	// Attributes for the group markers
	this.x = posX;
	this.y = posY;
	this.index = index;
	this.color = "rgba(0,0,255,.65)";
	this.radius = 10;
}

mapMarker.prototype.drawToContext = function(theContext) {
    theContext.fillStyle = this.color;
    theContext.beginPath();
    theContext.arc(this.x, this.y, this.radius, 0, 2*Math.PI, false);
    theContext.closePath();
    theContext.fill();
}

mapMarker.prototype.hitTest = function(hitX,hitY) {
     var dx = this.x - hitX;
     var dy = this.y - hitY;
     return(dx*dx + dy*dy < this.radius*this.radius);
}

function updateMapForm(groupMarker, canvas) {
	
	// Gets the location and information about the selected marker
	var name = groupInfo[groupMarker.index].groupId;
	var lon = parseFloat(Math.abs(groupMarker.x * mapWidth / canvas.width + mapLeft)).toFixed(6);
	var lat = parseFloat(Math.abs(groupMarker.y * mapHeight / canvas.height - mapTop)).toFixed(6);
	var tripDays = Math.floor(groupInfo[groupMarker.index].tripDuration / 1440);
	var tripHours = Math.floor((groupInfo[groupMarker.index].tripDuration % 1440) / 60);
	var tripMins = (groupInfo[groupMarker.index].tripDuration % 1440) % 60;
	var delayHours = Math.floor(groupInfo[groupMarker.index].readingDelay / 3600000);
	var delayMins = Math.floor((groupInfo[groupMarker.index].readingDelay % 3600000) / 60000);
	var delaySeconds = Math.floor(((groupInfo[groupMarker.index].readingDelay % 3600000) % 60000) / 1000);
	
	// Updates the form with the retrieved information
	document.getElementById("mapForm").innerHTML =
		"<b><p id=\"mapSelectGroupId\">Group ID:&nbsp;" + name + "</p> " 
		+ "<p id=\"mapSelectLatitude\">Latitude:&nbsp;" + lat + "<p> "
		+ "<p id=\"mapSelectLongitude\">Longitude:&nbsp;" + lon + "<p></b>"
		+ "<br><b>Trip Duration:&nbsp;</b><br>"
		+ "<input type=\"number\" id=\"mapSelectTripDays\" min=\"1\" max=\"365\" value=\"" + tripDays + "\"> Days&nbsp;-&nbsp;" 
		+ "<input type=\"number\" id=\"mapSelectTripHours\" min=\"0\" max=\"23\" value=\"" + tripHours + "\"> Hours&nbsp;-&nbsp;" 
		+ "<input type=\"number\" id=\"mapSelectTripMins\" min=\"0\" max=\"59\" value=\"" + tripMins + "\"> Minutes"
		+ "<br><br><b>Reading Delay:&nbsp;</b><br>" 
		+ "<input type=\"number\" id=\"mapSelectDelayHours\" min=\"0\" max=\"24\" value=\"" + delayHours + "\"> Hours&nbsp;-&nbsp;"
		+ "<input type=\"number\" id=\"mapSelectDelayMins\" min=\"0\" max=\"59\" value=\"" + delayMins + "\"> Minutes&nbsp;-&nbsp;"
		+ "<input type=\"number\" id=\"mapSelectDelaySeconds\" min=\"0\" max=\"59\" value=\"" + delaySeconds + "\"> Seconds"
		+ "<br><br><input type=\"submit\" value=\"Submit\">";
	
}

function updateGroup() {
	
	// Get the current values from the location/parameter form
	var groupId = document.getElementById("mapSelectGroupId").innerHTML.slice(15);
	var latitude = document.getElementById("mapSelectLatitude").innerHTML.slice(15);
	var longitude = document.getElementById("mapSelectLongitude").innerHTML.slice(16);
	var duration = ((parseInt(document.getElementById("mapSelectTripDays").value) * 1440) 
		+ (parseInt(document.getElementById("mapSelectTripHours").value) * 60) 
		+ parseInt(document.getElementById("mapSelectTripMins").value));
	var delay = ((parseInt(document.getElementById("mapSelectDelayHours").value) * 3600000)
		+ (parseInt(document.getElementById("mapSelectDelayMins").value) * 60000)
		+ (parseInt(document.getElementById("mapSelectDelaySeconds").value) * 1000));
	
	// Send the update and print a message about the success of the operation
	var xmlhttp=new XMLHttpRequest();
	xmlhttp.onreadystatechange=function() {
		// To be called when the request is complete
		if (xmlhttp.readyState==4 && xmlhttp.status==200) {
			var m = xmlhttp.responseText;
			if (m == "0") {
				e = document.getElementById("updateGroupStatus");
				e.innerHTML = "Error uploading data!";
				e.style.color="red";
			}
			else {
				e = document.getElementById("updateGroupStatus")
				e.innerHTML = "Group Successfully updated!";
				e.style.color="green";
			}
		}
	}
	
	xmlhttp.open("GET", "php/updateGroupInfo.php?groupId=" + groupId + "&latitude=" 
		+ latitude + "&longitude=" + longitude + "&readingDelay=" + delay 
		+ "&tripDuration=" + duration, true);
	xmlhttp.send();
	
} 

