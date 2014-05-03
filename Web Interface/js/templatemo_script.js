/* Credit: http://www.templatemo.com */

var menuDisabled = false;
var findDataDisabled = false;
var lastSearch = null;

jQuery(function($) {
    
    $(window).load(function() { // makes sure the whole site is loaded
            $('#status').fadeOut(); // will first fade out the loading animation
            $('#preloader').delay(350).fadeOut('slow'); // will fade out the white DIV that covers the website.
            $('#main-wrapper').delay(350).css({'overflow':'visible'});
    });
    
    $(document).ready( function() {

		//overlay();
		loadMap();
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
	
	//for image slide on menu item click(normal) for data search
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

function loadMap() {
	
	var c=document.getElementById("mapCanvas");
	var ctx=c.getContext("2d");
	var img = new Image();
	img.onload = function() {
		ctx.drawImage(img, 0, 0);
	}
	img.src = "images/map.png";
	img.alt = "Desert Map";
	img.width = "500";

}

function overlay() {
	document.getElementById("newUser").style.visibility = "hidden";
	document.getElementById("overlay").style.visibility = "visible";
}

function hideOverlay() {
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
	document.getElementById("overlay").style.visibility = "hidden";
	document.getElementById("newUser").style.visibility = "visible";
	return false;
}

function signUp() {

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
	populateMoteDropDown();
	populateGroupDropDown();
}

function populateMoteDropDown() {
	
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

}

function populateTimeQuery(option) {
	
	if (option==1) {
		document.getElementById("timeQuery").innerHTML = ""+
			"<b> Start Time: </b> <input type=\"time\" name=\"sTime\" id=\"sTime\" value=\"00:00:00\"> "+
			"<br><br> "+
			"<b>End Time:</b> <input type=\"time\" name=\"eTime\" id=\"eTime\" value=\"23:59:00\"> "+
			"<br><br> "+
			"<input type=\"submit\" name=\"submit\" value=\"Submit\"> ";
	}
	else {
		document.getElementById("timeQuery").innerHTML = ""+
			"<b>Start Date:</b> <input type=\"date\" name=\"sDate\" id=\"sDate\" value=\"2000-01-01\"> "+
			"<br><br> "+
			"<b>End Date:</b> <input type=\"date\" name=\"eDate\" id=\"eDate\" value=\"2020-12-31\"> "+
			"<br><br> "+
			"<input type=\"submit\" name=\"submit\" value=\"Submit\"> ";
	}
	
}

function moteSearch(id) {
	
	if (id=="") {
		document.getElementById("moteData").innerHTML="";
		return;
	}

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

}

function dateTimeSearch() {
	
	if (document.getElementById("tTime").checked)
		timeSearch();
	else if (document.getElementById("tDate").checked)
		dateSearch();
	
}

function timeSearch() {

	sTime = document.getElementById("sTime").value;
	eTime = document.getElementById("eTime").value;

	var xmlhttp=new XMLHttpRequest();
	xmlhttp.onreadystatechange=function() {
		// To be called when the request is complete
		if (xmlhttp.readyState==4 && xmlhttp.status==200) {
			document.getElementById("timeData").innerHTML = xmlhttp.responseText;
		}
	}
	
	if (document.getElementById("tReading").checked)
		xmlhttp.open("GET", "php/getReadingsByReadingTime.php?sTime=" + sTime + "&eTime=" + eTime, true);
	else
		xmlhttp.open("GET", "php/getReadingsByUploadTime.php?sTime=" + sTime + "&eTime=" + eTime, true);
	xmlhttp.send();

}

function dateSearch() {

	sDate = document.getElementById("sDate").value;
	eDate = document.getElementById("eDate").value;

	var xmlhttp=new XMLHttpRequest();
	xmlhttp.onreadystatechange=function() {
		// To be called when the request is complete
		if (xmlhttp.readyState==4 && xmlhttp.status==200) {
			document.getElementById("timeData").innerHTML = xmlhttp.responseText;
		}
	}
	
	if (document.getElementById("tReading").checked)
		xmlhttp.open("GET", "php/getReadingsByReadingDate.php?sDate=" + sDate + "&eDate=" + eDate, true);
	else
		xmlhttp.open("GET", "php/getReadingsByUploadDate.php?sDate=" + sDate + "&eDate=" + eDate, true);
	xmlhttp.send();

}

