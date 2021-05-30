const mqtt = require('mqtt')
let mqttConfig = store.get('localMqttSettings');
const QrScanner = require('./assets/js/qr-scanner.umd.min.js');
QrScanner.WORKER_PATH = './assets/js/qr-scanner-worker.min.js';

window.mqtt = mqtt
let client = null
var canvas;
var ctx;
var subscribed = false;
var cruiseControl = false;
const receivingChannel = "marsOrbiter/#";
const sendingChannel = "smartRover/";
var frameCount = 0;
var currentThrottle = 0;
var currentTurnAngle = 0;

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
	connectUrl: mqttConfig.connectUrl,
	username: mqttConfig.username,
  	password: mqttConfig.password,
	clientId: mqttConfig.clientId
}

const powerBtn = document.getElementById('powerBtn')
const streamBtn = document.getElementById('streamBtn')
const sendBtn = document.getElementById('sendBtn')

powerBtn.addEventListener('click', function(){ onConnect() }, false)
streamBtn.addEventListener('click', function(){ onSub() }, false)
sendBtn.addEventListener('click', function(){ sendMission() }, false)

function onConnect() {
  // const { host, port, clientId, username, password } = connection
	if (client == null || !client.connected) {
		console.log('connecting mqtt client');
		client = mqtt.connect(options.connectUrl, options)
		client.on('error', (err) => {
			console.error('Connection error: ', err);
			client.end()
		})
		client.on('reconnect', () => {
			console.log('Reconnecting...')
		})
		client.on('connect', () => {
			console.log('Client connected:' + options.clientId)
			addTextToSerial('Rover powered up!');
			
			updateTimestamp();
			document.getElementById("powerbutton").classList.remove('disconnected');
			document.getElementById("powerbutton").classList.add('connected');
			document.getElementById("powerbutton").style.setProperty('--power-btn-color', '#18ff00', 'important');
			document.getElementById("nasaStream").style.setProperty('display', 'none', 'important')
			document.getElementById("roverStream").style.setProperty('display', 'flex', 'important')
			document.getElementById("streamButton").style.setProperty('color', 'red', 'important');
	  	})
		client.on('message', (topic, message) => {
			if (topic.includes("mission/status")) {
				addTextToSerial(message);
			} else if (topic.includes("mission/step")) {
				addTextToSerial(message);
			} else if (topic.includes("rover/ready")) {
				sendMission();
				document.getElementById("sendbutton").style.setProperty('color', 'orange', 'important');
			} else if (topic.includes("camera")) {
				console.log("Camera")
				canvas = document.getElementById('missionStream');
				ctx = canvas.getContext('2d');
				 
				const width = 640;
				const height = 480;
				const arrayBuffer = new ArrayBuffer(width * height * 4);
				const pixels = new Uint8ClampedArray(arrayBuffer);
				var n = 0;	
				  
				for (var i = 0; i < message.length; i += 3) {
					pixels[n] = message[i];
					pixels[n + 1] = message[i + 1];
					pixels[n + 2] = message[i + 2];
					pixels[n + 3] = 255;
					n += 4;
				}
				const imageData = new ImageData(pixels, width, height);
				ctx.putImageData(imageData, 0, 0);
				  
				frameCount++;
				  
				if (frameCount > 20) {
					var scanData = canvas.toDataURL('image/bmp');
					QrScanner.scanImage(scanData)
						.then(result => {
							var qrMessage = "Found target area: " + result;
						  	addTextToSerial(qrMessage);
						  
						    endMission();
						  
						 })
						 .catch(error => console.log(error || 'No QR code found.'));
					frameCount = 0;
				}
				  
			} else {
				const msg = `${message.toString()}\nOn topic: ${topic}`
				addTextToSerial(msg);
			}
		})
		
		return client.connected = true;
		  
	  } else if (client.connected) {
		onUnsub();
		client.end()
		client.on('close', () => {
			console.log(options.clientId + ' disconnected')
    	})
		addTextToSerial('Rover turned off!');
		document.getElementById("powerbutton").classList.add('disconnected');
		document.getElementById("powerbutton").classList.remove('connected');
		document.getElementById("powerbutton").style.setProperty('--power-btn-color', '#ff0000', 'important');
		document.getElementById("nasaStream").style.setProperty('display', 'flex', 'important')
		document.getElementById("roverStream").style.setProperty('display', 'none', 'important')
		document.getElementById("streamButton").style.setProperty('color', '#3A474D', 'important');
		return client.connected = false;
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
		saveModal("Rover power", desc, noBtnLabel = 'Close', false)
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
			document.getElementById("streamButton").classList.add('connected');
			document.getElementById("streamButton").classList.remove('disconnected');
			document.getElementById("streamButton").style.setProperty('color', '#18ff00', 'important');
			updateTimestamp();
			
			return subscribed;
		} else {
			onUnsub();
			return subscribed;
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
	  document.getElementById("streamButton").classList.remove('connected');
	  document.getElementById("streamButton").classList.add('disconnected');
	  document.getElementById("streamButton").style.setProperty('color', '#3A474D', 'important');
  }
}


function sendMission() {
	if ((client == null || !client.connected || client.connected == false)) {
    		var desc = "The <strong>SmartRover</strong> is not powered up!<br />Please turn on Rover by pressing Power button.<br />Also please connect to &quot;Mars Orbiter&quot; satellite for updates.<br /><br />Once everything is ready, click &quot;Send mession&quot; button." 
			saveModal("Rover power", desc, noBtnLabel = 'Close', false); 
	} else {
		if (!store.has('missionContent')) {
			var descNoContent = "Cannot load mission content. Please make sure your mission is properly setup either on the map or table. Once ready, click &quot;Execute mission&quot; to process and send mission content."
			saveModal("Mission setup", descNoContent, noBtnLabel = 'Close', false);
		} else {
			var missionContent = store.get('missionContent');
			var messageContent = "";
			var limit = ";"
			var missionSteps = missionContent.steps.length;
			
			for (var i = 0; i < missionSteps; i++) {
				var step = 	String(i) + limit +
							String(missionContent.steps[i].parameters.heading) + limit + 
							String(missionContent.steps[i].parameters.speed) + limit + 
							String(missionContent.steps[i].parameters.distance)
				if (i != (missionSteps-1)) {
					step += limit;
				}
				messageContent += step;
			}

			console.log(messageContent);

			client.publish( 'mission/content', messageContent, {
				qos: 2,
				retain: false
			})
			client.publish( 'mission/steps', String(missionSteps), {
				qos: 2,
				retain: false
			})
			addTextToSerial('Mission successfully sent!');
		}
	}
}

function endMission() {
	if ((client == null || !client.connected || client.connected == false)) {
    		var desc = "The <strong>SmartRover</strong> is not powered up!<br />Please turn on Rover by pressing Power button.<br />Also please connect to &quot;Mars Orbiter&quot; satellite for updates."
			saveModal("Rover power", desc, noBtnLabel = 'Close', false) 
	} else {
		client.publish( 'mission/qrcode', '1', {
				qos: 2,
				retain: false
		})
		var missionEndDesc = "Mission had completed. We have reached a target area and detected target code.<br /><br />Congratulations!";
		saveModal('Mission complete', missionEndDesc, 'Close');	
	}
}

function addTextToSerial(textToAdd) {
	var currentTime = showTime();
	document.getElementById("mission-serial-updates").innerHTML +=
		  "<p class='mission-status-output'>" + currentTime + " | " + textToAdd + "</p>";
	scrollOutput();
}

// Scroll to last update
let scrollOutput = function () {
	let outputResultsDiv = document.getElementById("mission-serial-updates");
	outputResultsDiv.scrollTop = outputResultsDiv.scrollHeight;
};

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
