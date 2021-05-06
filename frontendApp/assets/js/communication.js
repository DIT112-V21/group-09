const mqtt = require('mqtt')
window.mqtt = mqtt
let client = null
var canvas;
var ctx;
var subscribed = false;
var cruiseControl = false;
const receivingChannel = "marsOrbiter/#";
const sendingChannel = "smartRover/";

const options = {
	keepalive: 30,
	protocolId: 'MQTT',
	protocolVersion: 4,
	clean: true,
	reconnectPeriod: 1000,
	connectTimeout: 30 * 1000,
	will: {
		topic: 'WillMsg',
		payload: 'Connection Closed abnormally..!',
		qos: 0,
		retain: false
	},
	rejectUnauthorized: false,
	connectUrl: "mqtt://localhost:1883",
	username: "user",
  	password: "password",
	clientId: "clientId_Hes24TQfz",
}

const connectBtn = document.getElementById('connectBtn')
const satelliteBtn = document.getElementById('satelliteBtn')
const upBtn = document.getElementById('upBtn')
const downBtn = document.getElementById('downBtn')
const leftBtn = document.getElementById('leftBtn')
const rightBtn = document.getElementById('rightBtn')
const stopBtn = document.getElementById('stopBtn')
const cruiseBtn = document.getElementById('cruiseBtn')
const cameraBtn = document.getElementById('cameraBtn')

connectBtn.addEventListener('click', onConnect)
satelliteBtn.addEventListener('click', onSub)
upBtn.addEventListener('click', function(){ manualControl(upBtn); }, false)
downBtn.addEventListener('click', function(){ manualControl(downBtn); }, false)
leftBtn.addEventListener('click', function(){ manualControl(leftBtn); }, false)
rightBtn.addEventListener('click', function(){ manualControl(rightBtn); }, false)
stopBtn.addEventListener('click', function(){ manualControl(stopBtn); }, false)
cruiseBtn.addEventListener('click', function () { manualControl(cruiseBtn); }, false)
cameraBtn.addEventListener('click', function () { takePhoto(this); }, false)


function onConnect () {
  // const { host, port, clientId, username, password } = connection
	if (client == null || !client.connected) {
		console.log('connecting mqtt client')
		  client = mqtt.connect(options.connectUrl, options)
		  client.on('error', (err) => {
			console.error('Connection error: ', err)
			client.end()
		  })
		  client.on('reconnect', () => {
			console.log('Reconnecting...')
		  })
		  client.on('connect', () => {
				console.log('Client connected:' + options.clientId)
			  	addTextToSerial('Rover powered up!');
				// connectBtn.innerText = 'Connected';
				document.getElementById("connectbutton").classList.remove('disconnected');
				document.getElementById("connectbutton").classList.add('connected');
				document.getElementById("connectbutton").style.setProperty('--connection-btn-color', '#18ff00', 'important');
			  	document.getElementById("nasaStream").style.setProperty('visibility', 'hidden', 'important')
			  	document.getElementById("nasaStream").style.setProperty('display', 'none', 'important')
			    document.getElementById("roverStream").style.setProperty('display', 'flex', 'important')
				document.getElementById("roverStream").style.setProperty('visibility', 'visible', 'important')
			  	document.getElementById("satelliteButton").style.setProperty('color', 'red', 'important');
			  	document.getElementById("cruiseButton").style.setProperty('color', 'red', 'important');
		  })
		client.on('message', (topic, message) => {
			  if (topic.includes("telemetry/heading")) {
				  var data = parseFloat(message)
				  document.getElementById("heading").innerHTML = data;
			  } else if (topic.includes("telemetry/throttle")) {
				  var data = parseInt(message)
				  document.getElementById("throttle").innerHTML = data;
			  } else if (topic.includes("telemetry/speed")) {
				  var data = parseFloat(message).toFixed(3)
				  document.getElementById("speed").innerHTML = data;
			  } else if (topic.includes("telemetry/turnAngle")) {
				  var data = parseInt(message)
				  document.getElementById("angle").innerHTML = data;
			  } else if (topic.includes("telemetry/totalDistance")) {
				  var data = parseInt(message)
				  document.getElementById("distance").innerHTML = data;
			  }
			  else if (topic.includes("camera")) {
				  console.log("Camera")
				  canvas = document.getElementById('cameraCanvas');
				  ctx = canvas.getContext('2d');
				  
				  const width = 640;
				  const height = 480;
				  
				  const arrayBuffer = new ArrayBuffer(width * height * 4);
				  const pixels = new Uint8ClampedArray(arrayBuffer);
				  var n = 0;	
				  
				  for (var i = 0; i < message.length; i += 3)
					{
						n += 4;
						pixels[n] = message[i];
						pixels[n + 1] = message[i + 1];
						pixels[n + 2] = message[i + 2];
						pixels[n + 3] = 255;

					}
				  
				  const imageData = new ImageData(pixels, width, height);
				  ctx.putImageData(imageData, 0, 0);
				  
			  } else {
				const msg = `${message.toString()}\nOn topic: ${topic}`
			  
				  document.getElementById("terminalReslutsCont").innerHTML += "<p style=\"color: #a8f18f;\">" + msg + "</p>";
				  scrollOutput();
			  }
		  })
		  
	  } else if (client.connected) {
		  onUnsub();
		  client.end()
		  client.on('close', () => {
			  console.log(options.clientId + ' disconnected')
    		})
		  
		  addTextToSerial('Rover turned off!');
		  document.getElementById("connectbutton").classList.add('disconnected');
		  document.getElementById("connectbutton").classList.remove('connected');
		  document.getElementById("connectbutton").style.setProperty('--connection-btn-color', '#ff0000', 'important');
		  document.getElementById("nasaStream").style.setProperty('visibility', 'visible', 'important');
		  document.getElementById("roverStream").style.setProperty('visibility', 'hidden', 'important');
		  document.getElementById("nasaStream").style.setProperty('display', 'flex', 'important')
		  document.getElementById("roverStream").style.setProperty('display', 'none', 'important')
		  document.getElementById("satelliteButton").style.setProperty('color', '#3A474D', 'important');
		  document.getElementById("cruiseButton").style.setProperty('color', '#3A474D', 'important');
	  }
}

function onDisconnect () {
  if (client.connected) {
	  client.end()
	  
	  client.on('close', () => {
		  client.connected = false;
		  console.log(options.clientId + ' disconnected')
    })
  }
}

function onSub () {
	if ((client == null || !client.connected || client.connected == false)) {
		var desc = "The SmartRover is not powered up!<br />Please turn on Rover by pressing Power button."
		showModal("Rover power", desc, yesBtnLabel = 'Yes', noBtnLabel = 'Close', false)
	} else {
		if (client.connected && subscribed == false) {
		const { topic, qos } = subscriber;
		client.subscribe(topic.value, { qos: parseInt(qos.value, 10) }, (error, res) => {
			if (error) {
				console.error('Subscribe error: ', error)
				addTextToSerial('Satellite error!');
			} else {
				console.log('Subscribed: ', res)
				addTextToSerial('<span style="color: #f7e062">Mars Orbiter</span> connected.');
			}
		})
		subscribed = true;
		document.getElementById("satelliteButton").classList.add('connected');
		document.getElementById("satelliteButton").classList.remove('disconnected');
		document.getElementById("satelliteButton").style.setProperty('color', '#18ff00', 'important');
		} else {
			onUnsub();
		}
	}
}

function onUnsub () {
  if (client.connected && subscribed == true) {
    const { topic } = subscriber
    client.unsubscribe(topic.value, error => {
      if (error) {
		  console.error('Unsubscribe error: ', error)
		  addTextToSerial('Satellite error!');
      } else {
		  console.log('Unsubscribed: ', topic.value)
		  addTextToSerial('Satellite disconnected');
      }
    })
	  subscribed = false;
	  document.getElementById("satelliteButton").classList.remove('connected');
	  document.getElementById("satelliteButton").classList.add('disconnected');
	  document.getElementById("satelliteButton").style.setProperty('color', '#3A474D', 'important');
  }
}

function manualControl(elmnt) {
	if ((client == null || !client.connected || client.connected == false)) {
		var desc = "The <strong>SmartRover</strong> is not powered up!<br />Please turn on Rover by pressing Power button.<br />Also please connect to &quot;Mars Orbiter&quot; satellite for updates."
		showModal("Rover power", desc, yesBtnLabel = 'Yes', noBtnLabel = 'Close', false)
	} else if (client.connected) {

		var channel = sendingChannel + elmnt.getAttribute("topic");
		var command = elmnt.getAttribute("step");

		if (elmnt == cruiseBtn) {
			if (command == "1") {
				command = "0"
				elmnt.setAttribute("step", command);
				addTextToSerial("Cruise control - <span style='color: #ff9797'>OFF</span>");
				document.getElementById("cruiseButton").classList.remove('connected');
				document.getElementById("cruiseButton").classList.add('disconnected');
				document.getElementById("cruiseButton").style.setProperty('color', 'red', 'important');
			} else {
				command = "1"
				elmnt.setAttribute("step", command);
				addTextToSerial("Cruise control - <span style='color: #97ffa1'>ON</span>");
				document.getElementById("cruiseButton").classList.add('connected');
				document.getElementById("cruiseButton").classList.remove('disconnected');
				document.getElementById("cruiseButton").style.setProperty('color', '#18ff00', 'important');
			}
		} else {
			let commandType;
			switch (elmnt) {
				case upBtn:
				case downBtn:
					commandType = "Throttle: " + command;
					break;
				case leftBtn:
				case rightBtn:
					commandType = "Turn angle: " + command;
					break;
				case stopBtn:
					commandType = "Stop the Rover.";
				default:
					// Print nothing;
			}
			addTextToSerial(commandType);
		}
	  
		client.publish( channel, command, {
			qos: 0,
			retain: false
		 })
	} 
}

function terminalCommand(channels, commands) {
	if ((client == null || !client.connected || client.connected == false)) {
		var desc = "The <strong>SmartRover</strong> is not powered up!<br />Please turn on Rover by pressing Power button.<br />Also please connect to &quot;Mars Orbiter&quot; satellite for updates."
		showModal("Rover power", desc, yesBtnLabel = 'Yes', noBtnLabel = 'Close', false)
	} else if (client.connected) {

		var channel = sendingChannel + channels;
		var command = commands;

		console.log(channel, command);

		client.publish(channel, command, {
			qos: 0,
			retain: false
		})
	}
}

document.addEventListener('DOMContentLoaded', function() {
	document.getElementById('console').onsubmit = function(evt) {
		evt.preventDefault(); // Preventing the form from submitting
		checkWord();
	}

	document.getElementById('terminalTextInput').focus();

	var textInputValue = document.getElementById('terminalTextInput').value.trim();
	var textResultsValue = document.getElementById('terminalReslutsCont').innerHTML;

	var clearInput = function(){
		document.getElementById('terminalTextInput').value = "";
	}

	scrollOutput();

	var addTextToResults = function(textToAdd) {
		var currentTime = showTime();
		document.getElementById('terminalReslutsCont').innerHTML += "<p class='terminal-text'>" + currentTime + " | " + textToAdd + "</p>";
		scrollOutput();
	}

	var postHelpList = function() {
		// Array of all the help keywords
		var helpKeyWords = [
		"Manual override commands For SmartRover",
		"- Go forward: <strong>F10-100</strong>",
		"- Reverse: <strong>R10-100</strong>",
		"- Turn Left: <strong>T-10</strong> or <strong>T-90</strong>",
		"- Turn Right: <strong>T+10</strong> or <strong>T+90</strong>",
		"- To stop: <strong>Stop</strong>",
		"- Mission date or time: <strong>date</strong> or <strong>time</strong>"
    ].join('<br>');
    addTextToResults(helpKeyWords);
  }

	var getTimeAndDate = function(postTimeDay) {
		var timeAndDate = new Date();
		var timeHours = timeAndDate.getHours();
		var timeMinutes = timeAndDate.getMinutes();
		var dateDay = timeAndDate.getDate();
		console.log(dateDay);
		var dateMonth = timeAndDate.getMonth() + 1; // Because JS starts counting months from 0
		var dateYear = timeAndDate.getFullYear(); // Otherwise we'll get the count like 98,99,100,101...etc.

		if (timeHours < 10) { // if 1 number display 0 before it.
			timeHours = "0" + timeHours;
		}

		if (timeMinutes < 10){ // if 1 number display 0 before it.
		  timeMinutes = "0" + timeMinutes;
		}

		var currentTime = showTime();
		var currentDate = dateDay + "/" + dateMonth + "/" + dateYear;

		if (postTimeDay == "time"){
			currentTime = "Mission time | " + currentTime
			addTextToResults(currentTime);
		}

		if (postTimeDay == "date"){
		  addTextToResults(currentDate);
		}
	}

    // Having a specific text reply to specific strings
    var textReplies = function() {

		switch (textInputValueLowerCase) {
			// replies
			case "hack":
				clearInput();
				addTextToResults("Nice try!");
			break;

			case "i love you":
			case "love you":
			case "love":
				clearInput();
				addTextToResults("Aww! Love you too <3 ");
			break;

			case "hello":
			case "hi":
			case "hola":
			case "hey":
			case "hej":
			case "hey rover":
				clearInput();
				addTextToResults("Hello, I am SmartRover. Roaming around Mars ...");
			break;

			case "what the":
			case "wtf":
				clearInput();
				addTextToResults("F***.");
			break;

			case "time":
				clearInput();
				getTimeAndDate("time");
			break;

			case "clear":
				clearInput();
				document.getElementById('terminalReslutsCont').innerHTML = '';
			break;
			
			case "date":
				clearInput();
				getTimeAndDate("date");
			break;

			case "help":
			case "?":
				clearInput();
				postHelpList();
			break;
	  
			case "stop":
				clearInput();
				addTextToResults("Why stop when we are having so much fun?! Oh well, Rover must stop!");
			break;
			
			
			default:
				clearInput();
				addTextToResults("<p style='color: #ff9797;'>The command " + "<b>" + textInputValue + "</b>" + " was not found. Type <b>Help</b> to see all commands.</p>");
				
			break;
		}
	}

	// Main function to check the entered text and assign it to the correct function
	var checkWord = function() {
		//get the command text from the terminal
		textInputValue = document.getElementById('terminalTextInput').value.trim(); 
		//get the lower case of the string
		textInputValueLowerCase = textInputValue.toLowerCase(); 
	  
		// RegEx to recognize command patterns
		// Forward and reverse patterns
		const regex1 = /[fr]+[\d]{1}/g;
		const regex2 = /[fr]+[\d]{1}[\d]{1}/g;
		const regex3 = /[fr]+[\d]{1}[\d]{1}[\d]{1}/g;
		// Turn angle patterns
		const regex4 = /[t]+[+-]+\d/g;
		const regex5 = /[t]+[+-]+\d\d/g;
		const regex6 = /[t]+[+-]+\d\d\d/g;

		if (textInputValue != "") { //checking if text was entered
			addTextToResults("<p class='userEnteredText'>> " + textInputValue + "</p>");

			if (textInputValueLowerCase.match(regex1) || textInputValueLowerCase.match(regex2) || textInputValueLowerCase.match(regex3)) {
				channel = 'console/throttle';
				let command = "";

				if (textInputValueLowerCase.length > 4) {
					textReplies();
				} else {
					if (textInputValueLowerCase.length == 2) {
						command = textInputValueLowerCase.substr(1, 1)
					} else if (textInputValueLowerCase.length == 3) {
						command = textInputValueLowerCase.substr(1, 2)
					} else if (textInputValueLowerCase.length == 4) {
						command = textInputValueLowerCase.substr(1, 3)
					} 

					if (textInputValueLowerCase.substr(0, 1) == "f") {
						let commandType = "Forward throttle is: " + command;
						addTextToSerial(commandType);
					} else {
						let commandType = "Reverse throttle is: " + command;
						command = "-" + command;
						addTextToSerial(commandType);
					}
					clearInput();
					terminalCommand(channel, command);
				}
			} else if (textInputValueLowerCase.match(regex4) || textInputValueLowerCase.match(regex5) || textInputValueLowerCase.match(regex6)) {
				if (textInputValueLowerCase.length > 5) {
					textReplies();
				} else {
					let channel = 'console/turnAngle';
					let command = "";

					if (textInputValueLowerCase.length == 3) {
						command = textInputValueLowerCase.substr(2, 1)
					} else if (textInputValueLowerCase.length == 4) {
						command = textInputValueLowerCase.substr(2, 2)
					} else if (textInputValueLowerCase.length == 5) {
						command = textInputValueLowerCase.substr(2, 3)
					}

					if (textInputValueLowerCase.substr(1, 1) == "+") {
						command = "+" + command;
					} else {
						command = "-" + command;
					}

					let commandType = "Turn angle is: " + command;
					addTextToSerial(commandType);
					clearInput();
					terminalCommand(channel, command);
                }
			} else if (textInputValueLowerCase == "stop") {
				let channel = 'control/stop';
				let command = "0";
				addTextToSerial("Stop the Rover!");
				clearInput();
				terminalCommand(channel, command);
			} else {
				textReplies();
			}
		}
	};
});

function takePhoto (elmnt) {
	if ((client == null || !client.connected || client.connected == false)) {
		var desc = "The SmartRover is not powered up!<br />Please turn on Rover by pressing Power button."
		showModal("Rover power", desc, yesBtnLabel = 'Yes', noBtnLabel = 'Close', false)
	} else {
		var canvas = document.getElementById("cameraCanvas");
		var snapshot = canvas.toDataURL("image/png");
  		elmnt.href = snapshot;
		addTextToSerial('<span style="color: #f7e062">Camera snapshot</span> created.');
	}
}

	
function addTextToSerial(textToAdd) {
	var currentTime = showTime();
	document.getElementById("serial-updates").innerHTML +=
		  "<p class='status-output'>" + currentTime + " | " + textToAdd + "</p>";
	scrollOutput();
}

// Scroll to last update
let scrollOutput = function () {
	let outputResultsDiv = document.getElementById("serial-updates");
	var terminalResultsDiv = document.getElementById('terminalReslutsCont');
	outputResultsDiv.scrollTop = outputResultsDiv.scrollHeight;
	terminalResultsDiv.scrollTop = terminalResultsDiv.scrollHeight;
};



// Script to show modal alert box
var modalWrap = null;
const showModal = (title, description, yesBtnLabel = 'Yes', noBtnLabel = 'Cancel') => {
  if (modalWrap !== null) {
    modalWrap.remove();
  }

  modalWrap = document.createElement('div');
  modalWrap.innerHTML = `
    <div class="modal fade" id="warningPower">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-warning">
            <h5 class="modal-title"><strong>${title}</strong></h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>${description}</p>
          </div>
          <div class="modal-footer bg-light">
            <button type="button" class="btn btn-warning" data-bs-dismiss="modal">${noBtnLabel}</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.append(modalWrap);

  var modal = new bootstrap.Modal(modalWrap.querySelector('.modal'));
  modal.show();
}

const showTime = () => {
	var timeAndDate = new Date();
	var timeHours = timeAndDate.getHours();
    var timeMinutes = timeAndDate.getMinutes();
	var timeSeconds = timeAndDate.getSeconds();

	if (timeHours < 10){ // if 1 number display 0 before it.
		timeHours = "0" + timeHours;
	}

	if (timeMinutes < 10) { // if 1 number display 0 before it.
      timeMinutes = "0" + timeMinutes;
    }

	if (timeSeconds < 10) { // if 1 number display 0 before it.
      timeSeconds = "0" + timeSeconds;
	}

    var currentTime = timeHours + ":" + timeMinutes + ":" + timeSeconds;
	return currentTime;
}
