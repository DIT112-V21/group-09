const { app, BrowserWindow, globalShortcut } = require('electron')
const Store = require('electron-store');

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
	
	var loggedTime = store.get('loggedTimestamp');
	if (loggedTime != null) {
		const currentDate = new Date();
		const currentTime = currentDate.getTime();
		var timeDiff = 	(currentTime - loggedTime)/60000;
		if (timeDiff < 5) {
			var page = store.get('currentPage');
			mainWindow.loadFile(page);
		} else {
			mainWindow.loadFile('index.html');
		}
	} else {
		mainWindow.loadFile('index.html');
	}
	
	/*
	
	mainWindow.loadFile('index.html')*/
	
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
