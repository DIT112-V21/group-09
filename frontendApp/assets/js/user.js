const { Client } = require('pg');
const Store = require('electron-store');
const fs = require('fs');

const store = new Store({
  configName: 'user-store'
});

const jsonString = fs.readFileSync("./config/dbConfig.json");
	db = JSON.parse(jsonString);
	
client = new Client({
    	user: db.dbUser,
    	host: db.host,
    	database: db.dbName,
    	password: db.dbPassword,
    	port: db.port
  	});
client.connect();

document.addEventListener("DOMContentLoaded", function() { initializeUser()}, false);

function initializeUser() {

	var loggedUser = store.get('loggedName');

	var loginMenu = `<li><a class="dropdown-item" href="#" onclick="userModal('login')"
							style="text-decoration: none;"><i class="fas fa-sign-in-alt mini-icon" style="padding-right: 5px;"></i>Log In</a></li>
					<li><a class="dropdown-item" href="#" onclick="userModal('register')" 
						   style="text-decoration: none;"><i class="fas fa-user-plus mini-icon"></i>Register</a></li>`;
	
	var userMenu = `<li><a class="dropdown-item" href="#" onclick=""
							style="text-decoration: none;"><i class="fas fa-smile mini-icon" style="padding-right: 5px;"></i>Hello, ` + loggedUser + `</a></li>
					<li><a class="dropdown-item" href="#" onclick="" 
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
									<button type="button" id="loginSubmitBtn" class="btn btn-outline-success" onClick="validateForm('login')">Log In</button>
									<button type="button" id="modalNoBtn" class="btn btn-outline-danger" data-bs-dismiss="modal" >Cancel</button>
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
							<button id="registerBtn" type="button" class="btn btn-outline-success me-4" onClick="validateForm('register')"> Register </button>
							<button type="button" class="btn btn-outline-danger" data-bs-dismiss="modal"> Cancel </button>
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
	
	client.query(checkQuery, (err, res) => {
		console.log(err, res)
		res.rows.forEach(row => {
    		if (username == row.username) {
				document.getElementById("formMessage").innerHTML = "Username &ldquo;" + username + "&rdquo; already exists. Please try again.";
				document.getElementById("registerUsername").classList.add('custom-error');
				valid = false;
			} 
		});
		
		if (valid) {
			let name = document.getElementById("registerName").value;
			let email = document.getElementById("registerEmail").value;
			let password = document.getElementById("registerPassword").value;
			const query = {
				name: 'user-register',
				text: 'INSERT INTO accounts (name, username, password, email) VALUES ($1, $2, $3, $4)',
				values: [name, username, password, email]
			}
	
			client.query(query, (err, res) => {
				console.log(err, res)
			})
	
			hideModal("userModal");
			systemToast('registerSuccess');
		}
	})
}

function userLogin() {
	let username = document.getElementById("loginUsername").value;
	let password = document.getElementById("loginPassword").value;
	
	const query = {
		name: 'user-login',
		text: 'SELECT * FROM accounts WHERE username = $1 AND password = $2',
		values: [username, password]
	}
	
	client.query(query, (err, result) => {
		if (result.rowCount == 0) {
			document.getElementById("formMessage").innerHTML = "Invalid username or password! Please try again.";
		} else {
			store.set('loggedUserid', result.rows[0].id);
			store.set('loggedUsername', result.rows[0].username);
			store.set('loggedName', result.rows[0].name);
			
			hideModal('userModal');
			initializeUser();
			systemToast('loginSuccess');
		}
	})
}

function logout() {
	store.removeAll;
	store.delete('loggedUserid');
	store.delete('loggedUsername');
	store.delete('loggedName');
	
	initializeUser();
	systemToast('logoutSuccess');
	setTimeout(function(){ location.reload(); }, 2000);
}

function hideModal(modalId) {
	document.getElementById(modalId).classList.remove('show');
	document.querySelector(".modal-backdrop").classList.remove('show');
}

function connectPg() {
	const sql = `SELECT * from accounts`
	client.query(sql, (err, res) => {
		console.log(err, res)
	})
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

function systemToast(name) {
	let newToast = document.getElementById(name);//select id of toast
    let newNotification = new bootstrap.Toast(newToast);//inizialize it
    newNotification.show();//show it
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