const { Client } = require('pg');
const Store = require('electron-store');
let config = require('electron-node-config');
const store = new Store({
  configName: 'user-store'
});

var clientConfig = {};

document.addEventListener("DOMContentLoaded", function() { initializeUser()}, false);

function validateDBSettings() {
	initializeSettings();
	const client = new Client(clientConfig);
	client.connect()
	client
  		.query('SELECT NOW()')
  		.then(result => {
			return true;
		})
  		.catch(e => {
			console.error(e.stack);
			systemToast('dbError');
			return false;
		})
  		.then(() => client.end());
}

function initializeSettings() {
	var localDbSettings = store.get('localDbSettings');
	if (localDbSettings.local) {
		clientConfig = {
    		user: localDbSettings.user,
    		host: localDbSettings.host,
    		database: localDbSettings.database,
    		password: localDbSettings.password,
    		port: localDbSettings.port
  		};
	} else {
		console.log('DB settings missing ...');
		systemToast('Database settings missing.<br />Please check Settings page.');
	}
}

function initializeUser() {
	validateDBSettings();
	
	var loggedTime = store.get('loggedTimestamp');
	if (loggedTime != null) {
		console.log("Checking time diff ...")
		const currentDate = new Date();
		const currentTime = currentDate.getTime();
		var timeDiff = 	(currentTime - loggedTime)/60000;
		if (timeDiff > 720) {
			store.delete('loggedUserid');
			store.delete('loggedUsername');
			store.delete('loggedName');
			store.delete('loggedTimestamp');
			store.delete('currentPage');
		}	
	}
	
	var loggedUser = store.get('loggedName');
	var loginMenu = `<li><a class="dropdown-item" href="#" onclick="userModal('login')"
							style="text-decoration: none;"><i class="fas fa-sign-in-alt mini-icon" style="padding-right: 5px;"></i>Log In</a></li>
					<li><a class="dropdown-item" href="#" onclick="userModal('register')" 
						   style="text-decoration: none;"><i class="fas fa-user-plus mini-icon"></i>Register</a></li>`;
	
	var userMenu = `<li><a class="dropdown-item" href="#" onclick=""
							style="text-decoration: none;"><i class="fas fa-smile mini-icon" style="padding-right: 5px;"></i>Hello, ` + loggedUser + `</a></li>
					<li><a class="dropdown-item" href="#" onclick="loadMissionList()" 
						   style="text-decoration: none;"><i class="fas fa-tasks mini-icon"></i>My missions</a></li>
					<li><a class="dropdown-item" href="#" onclick="logout()" 
						   style="text-decoration: none;"><i class="fas fa-sign-out-alt mini-icon"></i>Logout</a></li>`;
	
	var userMenuContainer = document.getElementById('user-menu');
	
	if (loggedUser == null) {
		console.log("No logged in user")
		userMenuContainer.innerHTML = loginMenu;
	} else {
		console.log(loggedUser)
		userMenuContainer.innerHTML = userMenu;
		var path = window.location.pathname;
		var page = path.split("/").pop();
		store.set('currentPage', page);
	}
}

// Script to show modal alert box
var modalWrap = null;
let type;
function userModal(type) {
	if (modalWrap !== null) {
		modalWrap.remove();
	}

	modalWrap = document.createElement('div');
	if (type == "login") {
		modalWrap.innerHTML = `
				<div class="modal fade" id="userModal" tabindex="-1" data-bs-keyboard="true">
					<div class="modal-dialog modal-dialog-centered">
						<div class="modal-content">
							<form class="needs-validation" novalidate>
								<div class="modal-header">
									<h5 class="modal-title">USER LOGIN</h5>
									<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
								</div>
								<div class="modal-body">
										<p>Please enter your login information.</p>
										<div class="input-group mb-3">
											<span class="input-group-text" id="basic-addon1">
												<i class="fas fa-user"></i>
											</span>
											<input id="loginUsername" type="text" class="form-control" placeholder="Enter your username" aria-label="Username" aria-describedby="basic-addon1" required />
										</div>
										<div class="input-group mb-3">
											<span class="input-group-text" id="basic-addon1">
												<i class="fas fa-key"></i>
											</span>
											<input id="loginPassword" type="password" class="form-control" placeholder="Enter your password" aria-label="Password" aria-describedby="basic-addon1" required />
										</div>
										<div id="formMessage" class="form-message"></div>

								</div>
								<div class="modal-footer d-flex justify-content-center">
									<button type="button" id="loginSubmitBtn" class="btn btn-primary me-4" onClick="validateForm('login')">&nbsp;&nbsp;Log In&nbsp;&nbsp;</button>
									<button type="button" id="modalNoBtn" class="btn btn-warning" data-bs-dismiss="modal" >Cancel</button>
								</div>
							</form>
						</div>
					</div>
				</div>`;
	} else if (type == "register") {
			   modalWrap.innerHTML = `
		<div class="modal fade" id="userModal" tabindex="-1" data-bs-keyboard="true">
			<div class="modal-dialog modal-dialog-centered">
				<div class="modal-content">
					<form class="needs-validation" novalidate>
						<div class="modal-header">
							<h5 class="modal-title">User Registration</h5>
							<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
						</div>
						<div class="modal-body">
							<p>Please enter your new account information.</p>
							<div class="input-group mb-3 position-relative">
								<span class="input-group-text" id="basic-addon1">
									<i class="fas fa-id-card"></i>
								</span>
								<input id="registerName" type="text" class="form-control" placeholder="Enter your name" aria-label="Fullname" aria-describedby="basic-addon1" required />
							</div>
							<div class="input-group mb-3 position-relative">
								<span class="input-group-text" id="basic-addon1">
									<i class="fas fa-envelope"></i>
								</span>
								<input id="registerEmail" type="email" class="form-control" placeholder="Enter your email address" aria-label="Email address" aria-describedby="basic-addon1" required />
							</div>

							<div class="input-group mb-3 position-relative">
								<span class="input-group-text" id="basic-addon1">
									<i class="fas fa-user-plus"></i>
								</span>
								<input id="registerUsername" type="text" class="form-control" placeholder="Enter your username" aria-label="Username" aria-describedby="basic-addon1" required />
							</div>

							<div class="input-group mb-3 position-relative">
								<span class="input-group-text" id="basic-addon1">
									<i class="fas fa-key"></i>
								</span>
								<input id="registerPassword" type="password" class="form-control" minlength=8 maxlength=25
									placeholder="Choose your password" aria-label="Password"aria-describedby="basic-addon1" required />
							</div>

							<div id="formMessage" class="form-message"></div>
						</div>
						<div class="modal-footer d-flex justify-content-center">
							<button id="registerBtn" type="button" class="btn btn-primary me-4" onClick="validateForm('register')">&nbsp;&nbsp;Register&nbsp;&nbsp;</button>
							<button type="button" class="btn btn-warning" data-bs-dismiss="modal">&nbsp;Cancel&nbsp;</button>
						</div>
					</form>
				</div>
			</div>
		</div>`;
		
	}
	
	document.body.append(modalWrap);

	var userModal = new bootstrap.Modal(modalWrap.querySelector('.modal'));
	userModal.show();
}

function registerUser() {
	
	let username = document.getElementById("registerUsername").value;
	let valid = true;
	const checkQuery = {
		name: 'username-duplicate-check',
		text: 'SELECT username FROM accounts'
	}
	
	const client = new Client(clientConfig);
	client.connect()
	client
  		.query(checkQuery)
  		.then(result => 
			 result.rows.forEach(row => {
				if (username == row.username) {
					document.getElementById("formMessage").innerHTML = "Username &ldquo;" + username + "&rdquo; already exists. Please try again.";
					document.getElementById("registerUsername").classList.add('custom-error');
					valid = false;
				} 
			}))
  		.catch(e => {
				console.error(e.stack);
				systemToast('dbError');
			})
  		.then(() => client.end());

		if (valid) {
			let name = document.getElementById("registerName").value;
			let email = document.getElementById("registerEmail").value;
			let password = document.getElementById("registerPassword").value;
			const registerQuery = {
				name: 'user-register',
				text: 'INSERT INTO accounts (name, username, password, email) VALUES ($1, $2, $3, $4)',
				values: [name, username, password, email]
			}
	
		const client = new Client(clientConfig);
		client.connect();
		client
  			.query(registerQuery)
  			.then(result => {
				hideModal("userModal");
				systemToast('registerSuccess');
			})
  			.catch(e => {
				console.error(e.stack);
				systemToast('dbError');
			})
  			.then(() => client.end())
		}
}

function userLogin() {
	let username = document.getElementById("loginUsername").value;
	let password = document.getElementById("loginPassword").value;
	
	const loginQuery = {
		name: 'user-login',
		text: 'SELECT * FROM accounts WHERE username = $1 AND password = $2',
		values: [username, password]
	}
	
	const client = new Client(clientConfig);
	
	client.connect()
	client
	  .query(loginQuery)
	  .then(result => {
			if (result.rowCount == 0) {
				document.getElementById("formMessage").innerHTML = "Invalid username or password! Please try again.";
			} else {
				const currentDate = new Date();
				const timestamp = currentDate.getTime();
				store.set('loggedUserid', result.rows[0].id);
				store.set('loggedUsername', result.rows[0].username);
				store.set('loggedName', result.rows[0].name);
				store.set('loggedTimestamp', timestamp);
			
				hideModal('userModal');
				initializeUser();
				systemToast('loginSuccess');
			}
		})
	  .catch(e => {
				console.error(e.stack);
				systemToast('dbError');
			})
	  .then(() => client.end())
}

function logout() {
	store.removeAll;
	store.delete('loggedUserid');
	store.delete('loggedUsername');
	store.delete('loggedName');
	store.delete('loggedTimestamp');
	store.delete('currentPage');
	
	initializeUser();
	systemToast('logoutSuccess');
	setTimeout(function(){ location.reload(); }, 2000);
}

function hideModal(modalId) {
	document.getElementById(modalId).classList.remove('show');
	document.querySelector(".modal-backdrop").classList.remove('show');
}

function validateForm(name) {
	'use strict';
	
	console.log("Validating...")
	setCustomValidityMsg();

	// Fetch all the forms we want to apply custom Bootstrap validation styles to
	const forms = document.querySelectorAll('.needs-validation');

	// Loop over them and prevent submission
		Array.prototype.slice.call(forms).forEach((form) => {
			if (!form.checkValidity()) {
				event.preventDefault();
				event.stopPropagation();
				document.getElementById("formMessage").innerHTML = "Please fill-in all required fields.";
			} else if (name == 'login') {
				userLogin();
			} else if (name == 'register') {
				registerUser();
			}

			form.classList.add('was-validated');
		}, false);
}

function setCustomValidityMsg() {
	if (document.getElementById('registerEmail') !=null) {
		const email = document.getElementById("registerEmail");
		const username = document.getElementById("registerUsername");
		const password = document.getElementById("registerPassword");
	
		email.addEventListener("input", function (event) {
			if (email.validity.typeMismatch) {
				email.setCustomValidity("E-mail address needs to be a valid!");
				email.reportValidity();
			} else {
				email.setCustomValidity("");
			}
		});

		username.addEventListener("input", function (event) {
			if (username.validity.valueMissing) {
				username.setCustomValidity("Your username must be an unique!");
				username.reportValidity();
			} else {
				username.setCustomValidity("");
			}
		});

		password.addEventListener("input", function (event) {
			if (password.validity.tooShort || password.validity.tooLong ) {
				password.setCustomValidity("Password needs to be 8-25 characters!");
				password.reportValidity();
			} else {
				password.setCustomValidity("");
			}
		});
	}
}

function loadMissionList() {
	var path = window.location.pathname;
	var page = path.split("/").pop();

	if (page == 'mission.html') {
	var userId = store.get('loggedUserid');
	
	const listQuery = {
		name: 'list-missions',
		text: 'SELECT id, date, source, steps FROM missions WHERE userid = $1',
		values: [userId]
	}
	
	const client = new Client(clientConfig);
	client.connect()
	client
	  .query(listQuery)
	  .then(result => {
			if (result.rowCount == 0) {
				saveModal('Load missions', 'You have no saved missions', 'OK');
			} else {
				//Create a HTML Table element.
				var table = document.createElement("table");
				table.id = 'missionListTable';
				table.classList = 'commandTable table table-hover'

				//Get the count of columns.
				var columnCount = 4;
				//Add the header row.
				var row = table.insertRow(-1);
				var headerTitles = [' ','Saved date','Plot type','Steps']
				var headerClasses = ['checkbox','date','type','steps']
				for (var i = 0; i < columnCount; i++) {
					var headerCell = document.createElement("th");
					headerCell.innerHTML = headerTitles[i];
					row.appendChild(headerCell);
				}

				//Add the data rows.
				for (var i = 0; i < result.rowCount; i++) {
					row = table.insertRow(-1);
						var checkCell = row.insertCell(-1);
						var dateCell = row.insertCell(-1);
						var typeCell = row.insertCell(-1);
						var stepsCell = row.insertCell(-1);
						// Checkbox
						var radio = document.createElement('input');
						radio.type = "radio";
						radio.name = "missionSelect"
						radio.class = "form-check-input";
						radio.source = result.rows[i].source;
						radio.value = result.rows[i].id;
						radio.id = result.rows[i].id;
						checkCell.appendChild(radio);
					
						// Date cell
						var date = result.rows[i].date.toISOString().split("T")[0];
						dateCell.innerHTML = date;
						
						// Mission type cell
						if (result.rows[i].source == 'map') {
							typeCell.innerHTML = 'Map';
						} else {
							typeCell.innerHTML = 'Table';
						}
					
						// Number of steps cell
						stepsCell.innerHTML = result.rows[i].steps;
				}

				modalWrap = document.createElement('div');
				modalWrap.innerHTML = `
					<div class="modal fade" id="missionLoadList" tabindex="-1" data-bs-keyboard="true">
						<div class="modal-dialog modal-dialog-centered">
							<div class="modal-content">
								<form class="needs-validation" novalidate>
									<div class="modal-header">
										<h5 class="modal-title">Load mission</h5>
										<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
									</div>
									<div class="modal-body">
										<p>Please select a mission to load</p>
										<div id="mission-table-list"></div>
										<div id="formMessage" class="form-message"></div>
									</div>
									<div class="modal-footer d-flex justify-content-center">
										<button id="loadMissionBtn" type="button" class="btn btn-primary me-4" onClick="processMission('load')">&nbsp;&nbsp;Load&nbsp;&nbsp;</button>
										<button id="loadMissionBtn" type="button" class="btn btn-warning me-4" onClick="processMission('delete')">&nbsp;&nbsp;Delete&nbsp;&nbsp;</button>
										<button type="button" class="btn btn-light" data-bs-dismiss="modal">&nbsp;&nbsp;Cancel&nbsp;&nbsp;</button>
									</div>
								</form>
							</div>
						</div>
					</div>`;
				
				document.body.append(modalWrap);
				var missionsModal = new bootstrap.Modal(modalWrap.querySelector('.modal'));
				var dvTable = document.getElementById("mission-table-list");
				dvTable.innerHTML = "";
				dvTable.appendChild(table);
				
				missionsModal.show();
				
				var $ = require('jquery');
				$('.commandTable tr').click(function (event) {
					if (event.target.type !== 'radio') {
						$(':radio', this).trigger('click');
					}
				});

				$("input[type='radio']").change(function (e) {
					e.stopPropagation();
					$('.commandTable tr').removeClass("highlight_row");        
					if ($(this).is(":checked")) {
						$(this).closest('tr').addClass("highlight_row");
					}     
				});

					}
				})
	  .catch(e => {
				console.error(e.stack);
				systemToast('dbError');
			})
	  .then(() => client.end())
	} else {
		saveModal('Load missions', 'Please load missions within<br />Mission control page.', 'OK');
	}
}

function systemToast(name) {
	var systemMessages = {
		'loginSuccess': 'Login successful!',
		'logoutSuccess': 'Successfully logged out!',
		'registerSuccess': 'User account<br />successfully created!',
		'dbSettingsSaveSuccess': 'Database settings<br />successfully saved.',
		'mqttSettingsSaveSuccess': 'MQTT Broker settings<br/>successfully saved.',
		'dbError': 'Database query error.<br />Please check connection settings.',
		'missionSaveSuccess': 'Mission successfully saved.',
		'missionLoadSuccess': 'Mission successfully loaded.',
		'missionDeleteSuccess': 'Mission deleted.',
		'missionLoadError': 'Error loading mission.<br>Please refresh the page and try again.'
	}
	
	document.getElementById('system-toast-body').innerHTML = systemMessages[name];
	let newToast = document.getElementById('system-toast');//select id of toast
    let newNotification = new bootstrap.Toast(newToast);//inizialize it
    newNotification.show();//show it
}

function updateTimestamp() {
	const currentDate = new Date();
	const timestamp = currentDate.getTime();
	store.set('loggedTimestamp', timestamp);
}

const saveModal = (title, description, closeBtnLabel) => {
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
          <div class="modal-footer bg-light d-flex justify-content-center">
        	<button id="modalNoBtn" type="button" class="btn btn-primary" data-bs-dismiss="modal">${closeBtnLabel}</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.append(modalWrap);

  var modal = new bootstrap.Modal(modalWrap.querySelector('.modal'));
  modal.show();
}