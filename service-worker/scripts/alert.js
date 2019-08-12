function CustomAlert(head,body,foot){

	//a reference to this alert obj
	let that = this;

	//function to create the html structure of the alert
	this.create_structure = function(){
		//check if the structe has been created already
		if(document.getElementById("dialogbox")) return;

		var dialogoverlay = document.createElement("div");
		var dialogbox = document.createElement("div");
		var dialoghead = document.createElement("div");
		var dialogbody = document.createElement("div");
		var dialogfoot = document.createElement("div");

		//set the id properties 
		dialogoverlay.setAttribute("id","dialogoverlay");
		dialogbox.setAttribute("id","dialogbox");
		dialoghead.setAttribute("id","dialoghead");
		dialogbody.setAttribute("id","dialogbody");
		dialogfoot.setAttribute("id","dialogfoot");

		//arrange elements into structure
		dialogbox.appendChild(dialoghead);
		dialogbox.appendChild(dialogbody);
		dialogbox.appendChild(dialogfoot);

		//append these structures into the document obj
		document.body.appendChild(dialogoverlay);
		document.body.appendChild(dialogbox);
		//console.log(document.body);
	}

	//initialise the dialog box style
	this.init_style = function() {
		//get the entire screen width and height
		var winHeight = window.innerHeight;
		var winWidth = window.innerWidth;

		/* The dialog overlay: this is the transparent background of the alert box.
		*  This overlay must occupy the entire width (which is 100% in the above css) and height of the screen;
		*  Also notice that in the html structure, the overlay element is separate from the alert box container
		*/

		//work with structure created
		var dialogbox = document.getElementById("dialogbox");
		dialogoverlay.style.display = "block";
		dialogoverlay.style.height = winHeight+"px";

		dialogbox.style.left = (winWidth/2) - (550 * 0.5) + "px";
		dialogbox.style.top = "100px";
		dialogbox.style.display = "block";

	};

	//render the alert box
	this.render = function(dialog) {
		
		/*var dialogoverlay = document.getElementById("dialogoverlay");
		*/
		//create the html structure
		this.create_structure();
		this.init_style();

		
		//set the content of the dialog box
		if(head)
			document.getElementById("dialoghead").innerHTML = head;
		else document.getElementById("dialoghead").innerHTML = "Acknowledge this Message";

		if(dialog)
			document.getElementById("dialogbody").innerHTML = dialog;
		else if(body) document.getElementById('dialogbody').innerHTML = body;

		if(foot) document.getElementById("dialogfoot").innerHTML = foot;
		else document.getElementById("dialogfoot").innerHTML = "<button onclick='Alert.ok()'>OK</button>";
	} //we are done with the renderer method

	//the OK button function
	this.ok = function() {
		document.getElementById("dialogbox").style.display = "none";
		document.getElementById("dialogoverlay").style.display = "none";
	}

	//accessors and mutators
	this.set_body = function(body) {
		if(body)
			document.getElementById('dialogbody').innerHTML = body;
	}
}