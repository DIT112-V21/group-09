//commandsTable
function addRow(commandTable) {
    var table = document.getElementById(commandTable);
    var rowCount = table.rows.length;
    var row = table.insertRow(rowCount);
    var checkBoxCell = row.insertCell(0);
    var step = document.createElement("input");
    step.type = "checkbox";
    step.name="chkbox[]";

    checkBoxCell.appendChild(step);
    
    var stepNumberCell = row.insertCell(1);
    stepNumberCell.innerHTML = rowCount ;

    var distanceCell = row.insertCell(2);
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
    speed.value = "0";
    speed.step = "10";
    speed.min = "-100";
    speed.max = "100";
    speed.name = "txtbox[]";
    speed.className = "data-cell";
    speedCell.appendChild(speed);

    var headingCell = row.insertCell(2);
    var heading = document.createElement("input");
    heading.type = "number";
    heading.value = "0";
    heading.step = "5";
    heading.min = "0";
    heading.max = "360";
    heading.name = "txtbox[]";
    heading.className = "data-cell";
    headingCell.appendChild(heading);
}

function deleteRow(commandTable) {
    try {
        var table = document.getElementById(commandTable);
        var rowCount = table.rows.length;
		let n = 1;
		
        for (var i=0; i < rowCount; i++) {
            var row = table.rows[i];
            var chkbox = row.cells[0].childNodes[0];
			
			if (i > 0) {
				let cell2 = row.cells[1];
				cell2.innerHTML = n;
				n++;
			}
			
            if(null != chkbox && true == chkbox.checked) {
                table.deleteRow(i);
                rowCount--;
                i--;
				n--;
            }
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