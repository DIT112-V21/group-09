const { app, BrowserWindow, globalShortcut } = require('electron')
const Store = require('electron-store');
let config = require('electron-node-config');

const store = new Store({
  configName: 'user-store',
  defaults: {
  }
});

const path = require('path')
require('@electron/remote/main').initialize()

function createWindow () {
	const mainWindow = new BrowserWindow({
		width: 1280,
		height: 960,
		icon: path.join(__dirname, 'assets/images/favicon.ico'),
    	webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			enableRemoteModule: true,
      		preload: path.join(__dirname, 'preload.js')
    	}
  	})
	
	mainWindow.menuBarVisible = false
	
	if (store.has('loggedTime')) {
		const currentDate = new Date();
		const currentTime = currentDate.getTime();
		var timeDiff = 	(currentTime - loggedTime)/60000;
		if (timeDiff < 5 && store.has('currentPage')) {
			var page = store.get('currentPage');
			mainWindow.loadFile(page);
		} else {
			mainWindow.loadFile('index.html');
		}
	} else {
		mainWindow.loadFile('index.html');
	}
	
	initializeSettings(); // Initialize database settings;
	/* Global shortcut for F5 to reload window */
	globalShortcut.register('f5', function() {
		mainWindow.reload()
	})
	
	globalShortcut.register('CommandOrControl+R', function() {
		mainWindow.reload()
	})	
}


app.whenReady().then(() => {
	createWindow()

	app.on('activate', () => {
		if (mainWindow.getAllWindows().length === 0) {
			createWindow()
    	}
	})
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('will-quit', () => {
	// Unregister a shortcut.
	globalShortcut.unregister('CommandOrControl+X')

	// Unregister all shortcuts.
	globalShortcut.unregisterAll()
})

function initializeSettings() {
	let dbConfig = config.get('database.dbConfig');
	let mqttConfig = config.get('mqtt.brokerConfig');
	
	if (store.has('missionContent')) {
		store.delete('missionContent');
	}
	
	if (!store.has('localDbSettings')) {
		localDbSettings = {
    		"host": dbConfig.host,
			"port": dbConfig.port,
			"user": dbConfig.dbUser,
    		"password": dbConfig.dbPassword,
			"database": dbConfig.dbName,
			"local": true
  		};
		
		store.set('localDbSettings', localDbSettings);
		console.log('Local DB settings set ...');
	} else if (dbConfig == null || dbConfig == undefined) {
		console.log('DB settings missing ...');
		systemToast('Database default settings missing.<br />Please check Settings page.');
	}
	
	if (!store.has('localMqttSettings')) {
		localMqttSettings = {
			"connectUrl": mqttConfig.connectUrl,
			"host": mqttConfig.host,
			"port": mqttConfig.port,
			"username": mqttConfig.username,
  			"password": mqttConfig.password,
			"clientId": mqttConfig.clientId
  		};
		
		store.set('localMqttSettings', localMqttSettings);
		console.log('Local MQTT settings set ...');
		
	} else if (mqttConfig == null || mqttConfig == undefined) {
		console.log('MQTT settings missing ...');
		systemToast('MQTT default settings missing.<br />Please check Settings page.');
	}
}