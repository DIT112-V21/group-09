const Application = require('spectron').Application
const assert = require('assert')
const electronPath = require('electron') // Require Electron from the binaries included in node_modules.
const path = require('path')
const chaiAsPromised = require("chai-as-promised");
const chai = require("chai");

chai.should();
chai.use(chaiAsPromised);

describe("Application launch test", function () {
  this.timeout(10000)
	
	beforeEach(function () {
		
   		const appPath = path.join(__dirname, "../");
		
		this.app = new Application({
			path: electronPath,
			args: [appPath],
			env: {
				ELECTRON_ENABLE_LOGGING: true,
				ELECTRON_ENABLE_STACK_DUMPING: true,
				NODE_ENV: "development",
				PORT: 9515
			},
			chromeDriverArgs: ["--headless","--no-sandbox",
					   "--disable-dev-shm-usage",
					   "start-maximized",
					   "disable-infobars",
					   "--disable-extensions",
					   "--disable-gpu"
					  ],
			startTimeout: 20000,
			chromeDriverLogPath: '../chromedriverlog.txt'
  		});
		
		chaiAsPromised.transferPromiseness = this.app.transferPromiseness;
		return this.app.start();      
	});

 	afterEach(function () {
		if (this.app && this.app.isRunning()) {
			return this.app.stop();
		}
	});

	describe("Launch", function () {
		it('Shows an initial window', function () {
			return this.app.client.getWindowCount().then(function (count) {
				assert.equal(count, 1)
				// Please note that getWindowCount() will return 2 if `dev tools` are opened.
				// assert.equal(count, 2)
			})
		})

		it('Displays a title', function () {
			return this.app.client.browserWindow.getTitle().then(function (title) {
				assert.equal(title, 'SmartRover - Home')
			})
		});
	});
});
