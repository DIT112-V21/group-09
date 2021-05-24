const config = require('electron-node-config');

const mqttSaveBtn = document.getElementById('mqttSaveBtn')
const mqttReloadBtn = document.getElementById('mqttReloadBtn')
const dbSaveBtn = document.getElementById('dbSaveBtn')
const dbReloadBtn = document.getElementById('dbReloadBtn')

document.addEventListener("DOMContentLoaded", function() { loadMqttSettings(); }, false);
document.addEventListener("DOMContentLoaded", function() { loadDbSettings(); }, false);
mqttSaveBtn.addEventListener('click', function(){ saveMqttSettings(); }, false)
mqttReloadBtn.addEventListener('click', function(){ loadMqttSettings(); }, false)
dbSaveBtn.addEventListener('click', function(){ saveDbSettings(); }, false)
dbReloadBtn.addEventListener('click', function(){ loadDbSettings(); }, false)

function loadMqttSettings() {
	let mqttConfig = config.get('mqtt.brokerConfig');
	
	document.getElementById("mqtt-hostname").value = mqttConfig.host;
	document.getElementById("mqtt-port").value = mqttConfig.port;
	document.getElementById("mqtt-username").value = mqttConfig.username;
	document.getElementById("mqtt-password").value = mqttConfig.password;
	document.getElementById("mqtt-clientid").value = mqttConfig.clientId;
}

function loadDbSettings() {
	let fs = require('fs');
	var db = null;
	try {
		const jsonString = fs.readFileSync("./config/dbConfig.json");
		db = JSON.parse(jsonString);
		document.getElementById('settings-msg').style.display = "block";
		document.getElementById("settings-msg").innerHTML="<span class='text-success'>Settings successfully loaded.</span>";
		
		document.getElementById("db-hostname").value = db.host;
		document.getElementById("db-port").value = db.port;
		document.getElementById("db-username").value = db.dbUser;
		document.getElementById("db-password").value = db.dbPassword;
		document.getElementById("db-name").value = db.dbName;
		
	} catch (err) {
		document.getElementById('settings-msg').style.display = "block";
		document.getElementById("settings-msg").innerHTML="<span class='text-danger'>Error loading settings</span>";
		return;
	}

	setTimeout(function(){
				document.getElementById('settings-msg').style.display = "none";
			}, 5000);
}

function saveDbSettings() {
	let fs = require('fs');
	updateTimestamp();
	const newDbSettings = {
    	host: document.getElementById("db-hostname").value,
    	port: parseInt(document.getElementById("db-port").value),
    	dbUser: document.getElementById("db-username").value,
		dbPassword: document.getElementById("db-password").value, 
		dbName: document.getElementById("db-name").value
	}
	const jsonString = JSON.stringify(newDbSettings, null, 2)
	fs.writeFile("./config/dbConfig.json", jsonString, err => {
    	if (err) {
			document.getElementById('settings-msg').style.display = "block";
			document.getElementById("settings-msg").innerHTML="<span class='text-danger'>Error updating settings</span>";
		} else {
			/*document.getElementById('settings-msg').style.display = "block";
			document.getElementById("settings-msg").innerHTML="<span class='text-success'>Settings successfully saved.</span>";*/
			systemToast('dbSettingsSaveSuccess');
		}
		setTimeout(function(){
				document.getElementById('settings-msg').style.display = "none";
			}, 5000);
	})
}

function saveMqttSettings() {
	let fs = require('fs');
	updateTimestamp();
	var connectionUrl = "mqtt://" + document.getElementById("mqtt-hostname").value 
						+ ":" + document.getElementById("mqtt-port").value;
		
	const newMqttSettings = {
		"mqtt": {
			"_comment": "MQTT Broker connection settings here",
			"brokerConfig": {
				"connectUrl": connectionUrl,
				"host": document.getElementById("mqtt-hostname").value,
				"port": parseInt(document.getElementById("mqtt-port").value),
				"username": document.getElementById("mqtt-username").value,
				"password": document.getElementById("mqtt-password").value,
				"clientId": document.getElementById("mqtt-clientid").value
    		}
		}
	}

	const jsonString = JSON.stringify(newMqttSettings, null, 2)
	fs.writeFile("./config/default.json", jsonString, err => {
    	if (err) {
			document.getElementById('settings-msg').style.display = "block";
			document.getElementById("settings-msg").innerHTML="<span class='text-danger'>Error updating settings</span>";
		} else {
			/*document.getElementById('settings-msg').style.display = "block";
			document.getElementById("settings-msg").innerHTML="<span class='text-success'>Settings successfully saved.</span>";*/
			systemToast('mqttSettingsSaveSuccess');
		}
		setTimeout(function(){
				document.getElementById('settings-msg').style.display = "none";
			}, 5000);
	})
}