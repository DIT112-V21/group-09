const mqtt = require('mqtt')
window.mqtt = mqtt
let client = null

/*var r = 0;
var capturecount = 1;
var ln = 0;
var flag = 0;
var xres = 0;
var yres = 0;
var canvas;
var ctx;
var imgData;*/

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
	username: "group09",
  	password: "smartrover",
	clientId: "clientId_Hes24TQfz",
}

const connectBtn = document.getElementById('connectBtn')
const satelliteBtn = document.getElementById('satelliteBtn')
var subscribed = false;

const unsubBtn = document.getElementById('unsubBtn')
const sendBtn = document.getElementById('sendBtn')

connectBtn.addEventListener('click', onConnect)
satelliteBtn.addEventListener('click', onSub)
// unsubBtn.addEventListener('click', onUnsub)
// sendBtn.addEventListener('click', onSend)

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
				  var data = parseInt(message)
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
				  ctx = canvas.getContext('2d', {alpha: false});

				  const width = 320;
				  const height = 240;

				  canvas.setAttribute('width', width);
				  canvas.setAttribute('height', height);

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
				// msg.className = 'message-body'
				// msg.innerText = 
				// document.getElementById('article').appendChild(msg)
				  
				  
				  document.getElementById("consoleContentResults").innerHTML += "<p style=\"color: #a8f18f;\">" + msg + "</p>";
				  
			  }
		  })
		  
	  } else if (client.connected) {
		  onUnsub();
		  client.end()
		  client.on('close', () => {
			  console.log(options.clientId + ' disconnected')
    		})
		  
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
		alert("Rover is not powered up!");
	} else {
		if (client.connected && subscribed == false) {
		const { topic, qos } = subscriber;
		client.subscribe(topic.value, { qos: parseInt(qos.value, 10) }, (error, res) => {
			if (error) {
				console.error('Subscribe error: ', error)
			} else {
				console.log('Subscribed: ', res)
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
      } else {
        console.log('Unsubscribed: ', topic.value)
      }
    })
	  subscribed = false;
	  document.getElementById("satellitebutton").classList.remove('connected');
	  document.getElementById("satellitebutton").style.removeProperty('--satellite-btn-color');
  }
}

function onSend () {
  if (client.connected) {
    const { topic, qos, payload } = publisher
    client.publish(topic.value, payload.value, {
      qos: parseInt(qos.value, 10),
      retain: false
    })
  }
}