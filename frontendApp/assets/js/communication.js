const mqtt = require('mqtt')
window.mqtt = mqtt
let client = null
var canvas;
var ctx;
var subscribed = false;
var cruiseControl = false;

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
	connectUrl: "mqtt://aerostun.dev:1883",
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
// cameraBtn.addEventListener('click', function () { clacked(cameraBtn); }, false)


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
			  	addTextToOutput('Rover powered up!');
				// connectBtn.innerText = 'Connected';
				document.getElementById("connectbutton").classList.remove('disconnected');
				document.getElementById("connectbutton").classList.add('connected');
				document.getElementById("connectbutton").style.setProperty('--connection-btn-color', '#18ff00', 'important');
			  	document.getElementById("nasaStream").style.setProperty('visibility', 'hidden', 'important')
			  	document.getElementById("nasaStream").style.setProperty('display', 'none', 'important')
			    document.getElementById("roverStream").style.setProperty('display', 'flex', 'important')
				document.getElementById("roverStream").style.setProperty('visibility', 'visible', 'important')
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

				  const width = 320;
				  const height = 240;

				  const imageData = ctx.getImageData(0, 0, width, height);
				  const data = message;
				  for (var x = 0; x < width; x++) {
						for (var y = 0; y < height; y++) {
							var i = (x + y * width) * 3;
							var r = message[i + 0];
							var g = message[i + 1];
							var b = message[i + 2];

							ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
							ctx.fillRect(x, y, 1, 1);
						}
					} 

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
		  
		  addTextToOutput('Rover turned off!');
		  document.getElementById("connectbutton").classList.add('disconnected');
		  document.getElementById("connectbutton").classList.remove('connected');
		  document.getElementById("connectbutton").style.setProperty('--connection-btn-color', '#ff0000', 'important');
		  document.getElementById("nasaStream").style.setProperty('visibility', 'visible', 'important');
		  document.getElementById("roverStream").style.setProperty('visibility', 'hidden', 'important');
		  document.getElementById("nasaStream").style.setProperty('display', 'flex', 'important')
		  document.getElementById("roverStream").style.setProperty('display', 'none', 'important')
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
				addTextToOutput('Satellite error!');
			} else {
				console.log('Subscribed: ', res)
				addTextToOutput('<span style="color: #f7e062">Mars Orbiter</span> connected.');
			}
		})
		subscribed = true;
		document.getElementById("satellitebutton").classList.add('connected');
		document.getElementById("satellitebutton").style.setProperty('--satellite-btn-color', '#18ff00', 'important');
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
		  addTextToOutput('Satellite error!');
      } else {
		  console.log('Unsubscribed: ', topic.value)
		  addTextToOutput('Satellite disconnected');
      }
    })
	  subscribed = false;
	  document.getElementById("satellitebutton").classList.remove('connected');
	  document.getElementById("satellitebutton").style.removeProperty('--satellite-btn-color');
  }
}

function manualControl (elmnt) {
	if ((client == null || !client.connected || client.connected == false)) {
		var desc = "The <strong>SmartRover</strong> is not powered up!<br />Please turn on Rover by pressing Power button.<br />Also please connect to &quot;Mars Orbiter&quot; satellite for updates."
		showModal("Rover power", desc, yesBtnLabel = 'Yes', noBtnLabel = 'Close', false)
	} else if (client.connected) {
	 var channel = null
	 var command = null
	  if (elmnt == upBtn) {
			channel = "/smartRover/control/throttle"
			command = "10"
			addTextToOutput("Throttle +10");
	  } else if (elmnt == downBtn) {
			channel = "/smartRover/control/throttle"
			command = "-10"
			addTextToOutput("Throttle -10");
	  } else if (elmnt == leftBtn) {
			channel = "/smartRover/control/turnAngle"
			command = "-10"
			addTextToOutput("Turn angle +10");
	  } else if (elmnt == rightBtn) {
			channel = "/smartRover/control/turnAngle"
			command = "10"
			addTextToOutput("Turn angle -10");
	  } else if (elmnt == stopBtn) {
			channel = "/smartRover/control/stop"
			command = "0"
			addTextToOutput("Staahp!");
	  } else if (elmnt == cruiseBtn) {
		  channel = "/smartRover/cruiseControl"
		  if (cruiseControl) {
			  cruiseControl = false;
			  command = "0"
			  addTextToOutput("Cruise control - <span style='color: #ff9797'>OFF</span>");
		  } else {
			  cruiseControl = true;
			  command = "1"
			  addTextToOutput("Cruise control - <span style='color: #97ffa1'>ON</span>");
		  }
	  } else if (elmnt == cruiseBtn) {

	  }
	  else {
		  console.log("Bad command or button");
	  }
	  
	  client.publish( channel, command, {
		  qos: 0,
		  retain: false
	  })
  } 
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('console').onsubmit = function(evt) {
    evt.preventDefault(); // Preventing the form from submitting
    checkWord(); // Do your magic and check the entered word/sentence
    //window.scrollTo(0,150);
  }

  // Get the focus to the text input to enter a word right away.
  document.getElementById('terminalTextInput').focus();

  // Getting the text from the input
  var textInputValue = document.getElementById('terminalTextInput').value.trim();

  //Getting the text from the results div
  var textResultsValue = document.getElementById('terminalReslutsCont').innerHTML;

  // Clear text input
  var clearInput = function(){
    document.getElementById('terminalTextInput').value = "";
  }

  // Scroll to the bottom of the results
  scrollOutput();

  // Add text to the results div
  var addTextToResults = function(textToAdd){
	  var currentTime = showTime();
	  document.getElementById('terminalReslutsCont').innerHTML += "<p>" + currentTime + " | " + textToAdd + "</p>";
	  scrollOutput();
  }

  // Getting the list of keywords for help & posting it to the screen
  var postHelpList = function(){
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

  // Getting the time and date and post it depending on what you request for
  var getTimeAndDate = function(postTimeDay){
    var timeAndDate = new Date();
    var timeHours = timeAndDate.getHours();
    var timeMinutes = timeAndDate.getMinutes();
    var dateDay = timeAndDate.getDate();
    console.log(dateDay);
    var dateMonth = timeAndDate.getMonth() + 1; // Because JS starts counting months from 0
    var dateYear = timeAndDate.getFullYear(); // Otherwise we'll get the count like 98,99,100,101...etc.

    if (timeHours < 10){ // if 1 number display 0 before it.
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

    switch(textInputValueLowerCase){
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
	  const regex1 = /[fr]+\d/g;
	  const regex2 = /[fr]+\d\d/g;
	  const regex3 = /[fr]+\d\d\d/g;
	  const regex4 = /[t]+[+-]+\d/g;
	  const regex5 = /[t]+[+-]+\d\d/g;
	  const regex6 = /[t]+[+-]+\d\d\d/g;

	  if (textInputValue != ""){ //checking if text was entered
		addTextToResults("<p class='userEnteredText'>> " + textInputValue + "</p>");
      if (textInputValueLowerCase.substr(0,5) == "open ") { //if the first 5 characters = open + space
		  openLinkInNewWindow('http://' + textInputValueLowerCase.substr(5));
		  addTextToResults("<i>The URL " + "<b>" + textInputValue.substr(5) + "</b>" + " should be opened now.</i>");
      } else if (textInputValueLowerCase.substr(0,8) == "youtube ") {
		  openLinkInNewWindow('https://www.youtube.com/results?search_query=' + textInputValueLowerCase.substr(8));
		  addTextToResults("<i>I've searched on YouTube for " + "<b>" + textInputValue.substr(8) + "</b>" + " it should be opened now.</i>");
      } else if (textInputValueLowerCase.substr(0,7) == "google ") {
		  openLinkInNewWindow('https://www.google.com/search?q=' + textInputValueLowerCase.substr(7));
		  addTextToResults("<i>I've searched on Google for " + "<b>" + textInputValue.substr(7) + "</b>" + " it should be opened now.</i>");
      } else if (textInputValueLowerCase.substr(0,5) == "wiki "){
		  openLinkInNewWindow('https://wikipedia.org/w/index.php?search=' + textInputValueLowerCase.substr(5));
		  addTextToResults("<i>I've searched on Wikipedia for " + "<b>" + textInputValue.substr(5) + "</b>" + " it should be opened now.</i>");
      } else if (textInputValue.match(regex1) || textInputValue.match(regex2) || textInputValue.match(regex3)) {
		  clearInput();
		  addTextToResults("Process forward/reverse commands here");
	  } else if (textInputValue.match(regex4) || textInputValue.match(regex5) || textInputValue.match(regex6)) {
		  clearInput();
		  addTextToResults("Process left/right commands here");
	  } else {
        textReplies();
      }
    }
  };

});

	
function addTextToOutput(textToAdd) {
	
	var currentTime = showTime();
	document.getElementById("output-updates").innerHTML +=
		  "<p class='status-output'>" + currentTime + " | " + textToAdd + "</p>";
	scrollOutput();
}

// Scroll to last update
let scrollOutput = function () {
	let outputResultsDiv = document.getElementById("output-updates");
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
    if (timeMinutes < 10){ // if 1 number display 0 before it.
      timeMinutes = "0" + timeMinutes;
    }
	if (timeSeconds < 10){ // if 1 number display 0 before it.
      timeSeconds = "0" + timeSeconds;
    }
    var currentTime = timeHours + ":" + timeMinutes + ":" + timeSeconds;
	
	return currentTime;
}