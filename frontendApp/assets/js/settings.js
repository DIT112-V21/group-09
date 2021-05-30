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
	var localMqttSettings = store.get('localMqttSettings');
	document.getElementById("mqtt-hostname").value = localMqttSettings.host;
	document.getElementById("mqtt-port").value = localMqttSettings.port;
	document.getElementById("mqtt-username").value = localMqttSettings.username;
	document.getElementById("mqtt-password").value = localMqttSettings.password;
	document.getElementById("mqtt-clientid").value = localMqttSettings.clientId;
}

function loadDbSettings() {
	var localDbSettings = store.get('localDbSettings');
	document.getElementById("db-hostname").value = localDbSettings.host;
	document.getElementById("db-port").value = localDbSettings.port;
	document.getElementById("db-username").value = localDbSettings.user;
	document.getElementById("db-password").value = localDbSettings.password;
	document.getElementById("db-name").value = localDbSettings.database;
}

function saveDbSettings() {
	updateTimestamp();
	const newDbSettings = {
    	"host": document.getElementById("db-hostname").value,
    	"port": parseInt(document.getElementById("db-port").value),
    	"user": document.getElementById("db-username").value,
		"password": document.getElementById("db-password").value, 
		"database": document.getElementById("db-name").value,
		"local": true
	}
	
	store.set('localDbSettings', newDbSettings);
	systemToast('dbSettingsSaveSuccess');
}

function saveMqttSettings() {
	updateTimestamp();
	var connectionUrl = "mqtt://" + document.getElementById("mqtt-hostname").value 
						+ ":" + document.getElementById("mqtt-port").value;
	
	var newMqttSettings = {
			"connectUrl": connectionUrl,
			"host": document.getElementById("mqtt-hostname").value,
			"port": parseInt(document.getElementById("mqtt-port").value),
			"username": document.getElementById("mqtt-username").value,
			"password": document.getElementById("mqtt-password").value,
			"clientId": document.getElementById("mqtt-clientid").value
  		};
	store.set('localMqttSettings', newMqttSettings);
	systemToast('mqttSettingsSaveSuccess');
}