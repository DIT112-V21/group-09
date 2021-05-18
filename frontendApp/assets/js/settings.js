let config = require('electron-node-config');

const mqttSaveBtn = document.getElementById('mqttSaveBtn')
const mqttReloadBtn = document.getElementById('mqttReloadBtn')

document.addEventListener("DOMContentLoaded", function() { loadSettings(); }, false);
mqttSaveBtn.addEventListener('click', function(){ console.log("Saving..."); }, false)
mqttReloadBtn.addEventListener('click', function(){ loadSettings(); }, false)

function loadSettings() {
	let mqttConfig = config.get('mqtt.brokerConfig');
	
	document.getElementById("mqtt-hostname").value = mqttConfig.host;
	document.getElementById("mqtt-port").value = mqttConfig.port;
	document.getElementById("mqtt-username").value = mqttConfig.username;
	document.getElementById("mqtt-password").value = mqttConfig.password;
	document.getElementById("mqtt-clientid").value = mqttConfig.clientId;
	document.getElementById("mqtt-receive-topic").value = mqttConfig.receivingChannel;
	document.getElementById("mqtt-publish-topic").value = mqttConfig.sendingChannel;

}