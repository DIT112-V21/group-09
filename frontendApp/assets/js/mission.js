
//Notifications
let button1 = document.querySelector("#button1");
let button2 = document.querySelector("#button2");
let button3 = document.querySelector("#button3");

document.getElementById("button1").onclick = function () {
    let newToast = document.getElementById('toast1');//select id of toast
    let newNotification = new bootstrap.Toast(newToast);//inizialize it
    newNotification.show();//show it
}

document.getElementById("button2").onclick = function () {
    let newToast = document.getElementById('toast2');//select id of toast
    let newNotification = new bootstrap.Toast(newToast);//inizialize it
    newNotification.show();//show it
}

document.getElementById("button3").onclick = function () {
    let newToast = document.getElementById('toast3');//select id of toast
    let newNotification = new bootstrap.Toast(newToast);//inizialize it
    newNotification.show();//show it
}


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


window.onscroll = function () {myFunction()};
var navbar = document.getElementById("navbar");
var sticky = navbar.offsetTop;

function myFunction() {
    if (window.pageYOffset >= sticky) {
        navbar.classList.add("sticky")
    } else {
        navbar.classList.remove("sticky");
    }
}
