var executeTableBtn = document.getElementById('executeTableBtn');
var executeTableDesc = "It is highly recommended to save your mission before executing it. There is a good chance of loosing your mission details due to communication errors or other unforeseen errors. Also it is useful to save if you would like to revise it and execute again. Any unsaved missions would be reset after mission completion.<br /><br /><strong>Are you sure to execute the mission now?</strong>";
executeTableBtn.addEventListener('click',function () { missionModal('Execute mission', executeTableDesc, 'Execute', 'Cancel', 'executeMissionTable()')}, false);

//commandsTable
function addRow() {
    var table = document.getElementById('commandTable');
    var rowCount = table.rows.length;
    var row = table.insertRow(rowCount);
    var stepNumberCell = row.insertCell(0);
	stepNumberCell.className = "number";
    stepNumberCell.innerHTML = rowCount ;

    var distanceCell = row.insertCell(1);
    var distance = document.createElement("input");
    distance.type = "number";
    distance.value = "0";
    distance.step = "100";
    distance.min = "0";
    distance.name = "txtbox[]";
    distance.className = "data-cell";
    distanceCell.appendChild(distance);

    var speedCell = row.insertCell(2);
    var speed = document.createElement("input");
    speed.type = "number";
    speed.value = "30";
    speed.step = "10";
    speed.min = "-100";
    speed.max = "100";
    speed.name = "txtbox[]";
    speed.className = "data-cell";
    speedCell.appendChild(speed);

    var headingCell = row.insertCell(3);
    var heading = document.createElement("input");
    heading.type = "number";
    heading.value = "0";
    heading.step = "5";
    heading.min = "0";
    heading.max = "360";
    heading.name = "txtbox[]";
    heading.className = "data-cell";
    headingCell.appendChild(heading);
	
	var deleteCell = row.insertCell(4);
	var deleteButton = `<button onclick="deleteRow(this)" type="button" class="btn btn-danger btn-sm px-3">
			<i class="fas fa-times"></i>
		</button>`;
	deleteCell.innerHTML = deleteButton;
}

function deleteRow(btn) {
	try {
		// Delete row the button
		var row = btn.parentNode.parentNode;
  		row.parentNode.removeChild(row);
		
		//Update Step numbers
        var table = document.getElementById('commandTable');
        var rowCount = table.rows.length;
        for (var i = 1; i < rowCount; i++) {
            var row = table.rows[i];
			let cell2 = row.cells[0];
			cell2.innerHTML = i;
        }
    } catch(e) {
        alert(e);
    }
}

//User input in command table into array
function missionTableToArray(commandTable) {
    document.querySelector("#missionForm").addEventListener("click", function(event) {
        event.preventDefault();
    }, false);
    var stepsArray = []
    var rows = commandTable.rows;
    var cells, t;
    for (var i=0, iLen=rows.length; i<iLen; i++) {
        cells = rows[i].cells;
        t = [];
        stepsArray[n] = rows[i].cells[1];
        stepsArray[n+1] = rows[i].cells[2];
        stepsArray[n+2] = rows[i].cells[3];
        stepsArray[n+3] = rows[i].cells[4];
        n += 4;
        stepsArray.push(t);
    }
    return stepsArray;
}

function saveMissionTable() {
	var userId = store.get('loggedUserid');
	if (userId != null) {
		updateTimestamp();
		var missionContent = {};	
		var steps;
		const timestamp = new Date(Date.now()).toISOString();

		var table = document.getElementById('commandTable');
        steps = table.rows.length - 1;
		missionContent.waypoints = [];
		
		for (var i = 0; i < steps; i++) {
            var row = table.rows[i+1];
			let cell2 = row.cells[0];
			
			var wp = {
					waypoint: i,
					heading: row.cells[1].getElementsByTagName('input')[0].value,
					speed: row.cells[2].getElementsByTagName('input')[0].value,
					distance: row.cells[3].getElementsByTagName('input')[0].value
				}
			
			missionContent.waypoints.push(wp);
        }
				
		const saveTableQuery = {
			name: 'save-mission-plot',
			text: 'INSERT INTO missions (userid, date, source, steps, content) VALUES ($1, $2, $3, $4, $5)',
			values: [userId, timestamp, 'table', steps, missionContent]
		}
		
		const client = new Client(clientConfig);
		client.connect();
		client
  			.query(saveTableQuery)
  			.then(result => {
				systemToast('missionSaveSuccess');
			})
  			.catch(e => {
				console.error(e.stack);
				systemToast('dbError');
			})
  			.then(() => client.end())
	} else {
		var desc = 'You need to login in order to save your mission.'
		saveModal('Save mission', desc, 'OK')
	}
}

function executeMissionTable() {
	hideModal('missionWarning');
	var missionContent = {};	
	var steps;

	var table = document.getElementById('commandTable');
	steps = table.rows.length - 1;
	missionContent.steps = [];

	for (var i = 0; i < steps; i++) {
		var row = table.rows[i+1];
		let cell2 = row.cells[0];

		var step = {
				step: i,
				parameters: {
					heading: row.cells[1].getElementsByTagName('input')[0].value,
					speed: row.cells[2].getElementsByTagName('input')[0].value,
					distance: row.cells[3].getElementsByTagName('input')[0].value
				}
			}

		missionContent.steps.push(step);
	}
	
	document.getElementById("stream-tab").classList.add("active");
	document.getElementById("stream-tab").classList.add("show");
	document.getElementById("table-tab").classList.remove("active");
	document.getElementById("table-tab").classList.remove("show");
	document.getElementById("missionTabs-stream-tab").classList.add("active");
	document.getElementById("missionTabs-table-tab").classList.remove("active");
	switchPane('stream');
	
	store.set('missionContent', missionContent);
}

function switchPane(pane) {
	if (pane == 'map') {
		document.getElementById('mission-guide panel-body').style.display = 'block';
		document.getElementById('table-guide panel-body').style.display = 'none';
		document.getElementById('stream-guide panel-body').style.display = 'none';
	} else if (pane == 'table') {
		document.getElementById('mission-guide panel-body').style.display = 'none';
		document.getElementById('table-guide panel-body').style.display = 'block';
		document.getElementById('stream-guide panel-body').style.display = 'none';
	} else if (pane == 'stream') {
		document.getElementById('mission-guide panel-body').style.display = 'none';
		document.getElementById('table-guide panel-body').style.display = 'none';
		document.getElementById('stream-guide panel-body').style.display = 'block';
	}
}

function getSelected(data) {
	if (data =='id') {
		var missionId = document.getElementsByName("missionSelect");
		var i = missionId.length;
		while (i--) {
			if(missionId[i].checked)
				 return missionId[i].value;
		}
	} else if (data =='source') {
		var missionId = document.getElementsByName("missionSelect");
		var i = missionId.length;
		while (i--) {
			if(missionId[i].checked)
				 return missionId[i].source;
		}
	}
}

function processMission(action)
{
    var selectedMission = getSelected('id');
	var selectedSource = getSelected('source');
	
	if (action == 'load' && selectedSource == 'map') {
		loadMission(selectedMission);
		
	} else if (action == 'load' && selectedSource == 'table') {
		loadTable(selectedMission);
		
	} else if (action == 'delete') {
		
		const deleteQuery = {
			name: 'list-missions',
			text: 'DELETE FROM missions WHERE id = $1',
			values: [selectedMission]
		}
		
		const client = new Client(clientConfig);
		client.connect();
		client
  			.query(deleteQuery)
  			.then(result => {
				hideModal('missionLoadList');
				systemToast('missionDeleteSuccess');
				setTimeout(function(){ location.reload(); }, 2500);
			})
  			.catch(e => {
				console.error(e.stack);
				systemToast('dbError');
			})
  			.then(() => client.end())
	}
}

function loadTable(missionId) {
	updateTimestamp();
	hideModal('missionLoadList');
	
	if (missionId != null) {
		const loadQuery = {
				name: 'list-missions',
				text: 'SELECT * FROM missions WHERE id = $1',
				values: [missionId]
			}

			const client = new Client(clientConfig);
			client.connect();
			client
				.query(loadQuery)
				.then(result => {
					// Switch to Mission table tab
					switchPane('table');
					document.getElementById("table-tab").classList.add("active")
					document.getElementById("table-tab").classList.add("show")
					document.getElementById("map-tab").classList.remove("active");
					document.getElementById("map-tab").classList.remove("show");
					document.getElementById("stream-tab").classList.remove("active");
					document.getElementById("stream-tab").classList.remove("show");
					document.getElementById("missionTabs-table-tab").classList.add("active")
					document.getElementById("missionTabs-map-tab").classList.remove("active")
					document.getElementById("missionTabs-stream-tab").classList.remove("active")

					console.log("Time to load table ...")
					var tableBody = document.getElementById('commandTableBody');
					var content = '';
					var rowCount = result.rows[0].steps;
					var json = result.rows[0].content.waypoints;

					for (var i = 0; i < rowCount; i++) {
						var step = i + 1;
						content += '<tr id="row' + step + '">';
						content += '<td class="number">' + step + '</td>';
						content += '<td id="heading"><input type="number" value="'+ json[i].heading +'" step="5" min="0" max="360" class="data-cell" /></td>';
						content += '<td id="speed"><input type="number" value="' + json[i].speed + '" step="10" min="-100" max="100" class="data-cell" /></td>';
						content += '<td id="distance"><input type="number" value="' + json[i].distance + '" step="100" class="data-cell" min="0" /></td>';
						content += '<td><button onclick="deleteRow(this)" type="button" class="btn btn-danger btn-sm px-3"><i class="fas fa-times"></i></button></td>';
						content += '</tr>';
					}
					// Replace table body with new content
					tableBody.innerHTML = content;
					systemToast('missionLoadSuccess');
				
				})
				.catch(e => {
					console.error(e.stack);
					systemToast('dbError');
				})
				.then(() => client.end())
	} else {
		systemToast('missionLoadError');
	}
}