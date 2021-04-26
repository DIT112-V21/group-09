const mqtt = require('mqtt')
window.mqtt = mqtt
let client = null

var r = 0;
var capturecount = 1;
var ln = 0;
var flag = 0;
var xres = 0;
var yres = 0;
var canvas;
var ctx;
var imgData;

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
	defaultTopic: "/smartRover/#"
	
}

const connectBtn = document.getElementById('connectBtn')
const disconnectBtn = document.getElementById('disconnectBtn')
const subBtn = document.getElementById('subBtn')
const unsubBtn = document.getElementById('unsubBtn')
const sendBtn = document.getElementById('sendBtn')

connectBtn.addEventListener('click', onConnect)
disconnectBtn.addEventListener('click', onDisconnect)
subBtn.addEventListener('click', onSub)
unsubBtn.addEventListener('click', onUnsub)
sendBtn.addEventListener('click', onSend)

function onConnect () {
  // const { host, port, clientId, username, password } = connection
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
	  connectBtn.innerText = 'Connected'
  })
  client.on('message', (topic, message) => {
	  if (topic.includes("camera")) {
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
		const msg = document.createElement('div')
		msg.className = 'message-body'
		msg.innerText = `${message.toString()}\nOn topic: ${topic}`
		document.getElementById('article').appendChild(msg)
  	  }
  })
}

function onDisconnect () {
  if (client.connected) {
    client.end()
    client.on('close', () => {
      connectBtn.innerText = 'Connect'
      console.log(options.clientId + ' disconnected')
    })
  }
}

function onSub () {
  if (client.connected) {
    const { topic, qos } = subscriber
    client.subscribe(topic.value, { qos: parseInt(qos.value, 10) }, (error, res) => {
       if (error) {
         console.error('Subscribe error: ', error)
       } else {
         console.log('Subscribed: ', res)
       }
    })
  }
}

function onUnsub () {
  if (client.connected) {
    const { topic } = subscriber
    client.unsubscribe(topic.value, error => {
      if (error) {
        console.error('Unsubscribe error: ', error)
      } else {
        console.log('Unsubscribed: ', topic.value)
      }
    })
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