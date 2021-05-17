
//mqttTable
function addRow(mqttTable) {
  var table = document.getElementById(mqttTable);
  var rowCount = table.rows.length;
  var row = table.insertRow(rowCount);
  var checkBoxCell = row.insertCell(0);
  var step = document.createElement("input");
  step.type = "checkbox";
  step.name="chkbox[]";

  checkBoxCell.appendChild(step);
  
 // var stepNumberCell = row.insertCell(1);
  //stepNumberCell.innerHTML = rowCount ;

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
  speed.value = "0";
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

  var headingCell = row.insertCell(4);
  var heading = document.createElement("input");
  heading.type = "number";
  heading.value = "0";
  heading.step = "5";
  heading.min = "0";
  heading.max = "360";
  heading.name = "txtbox[]";
  heading.className = "data-cell";
  headingCell.appendChild(heading);

  var headingCell = row.insertCell(5);
  var heading = document.createElement("input");
  heading.type = "text";
  heading.value = "Pending";
  heading.step = "5";
  heading.min = "0";
  heading.max = "360";
  heading.name = "txtbox[]";
  heading.className = "data-cell";
  headingCell.appendChild(heading);
}

function deleteRow(mqttTable) {
  try {
      var table = document.getElementById(mqttTable);
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

function deleteRow(mqttTable) {
  try {
      var table = document.getElementById(mqttTable);
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


const $tableID = $('#table');
const $BTN = $('#export-btn'); 
const $EXPORT = $('#export');
const newTr = `
<tr class="hide">
  <td class="pt-3-half" contenteditable="true">Example</td>
  <td class="pt-3-half" contenteditable="true">Example</td>
  <td class="pt-3-half" contenteditable="true">Example</td>
  <td class="pt-3-half" contenteditable="true">Example</td>
  <td class="pt-3-half" contenteditable="true">Example</td>
  <td class="pt-3-half">
    <span class="table-up"
      ><a href="#!" class="indigo-text"
        ><i class="fas fa-long-arrow-alt-up" aria-hidden="true"></i></a
    ></span>
    <span class="table-down"
      ><a href="#!" class="indigo-text"
        ><i class="fas fa-long-arrow-alt-down" aria-hidden="true"></i></a
    ></span>
  </td>
  <td>
    <span class="table-remove"
      ><button
        type="button"
        class="btn btn-danger btn-rounded btn-sm my-0 waves-effect waves-light"
      >
        Remove
      </button></span
    >
  </td>
</tr>
`;
 (table-add).on('click', 'i', () => { const $clone = $tableID.find('mqttTable2').last().clone(true).removeClass('hide table-line'); if ($tableID.find('mqttTable2').length
=== 0) { $('tbody').append(newTr); } $tableID.find('table').append($clone); });

$tableID.on('click', '.table-remove', function () { $(this).parents('tr').detach(); });

$tableID.on('click', '.table-up', function () { const $row = $(this).parents('tr');if
($row.index() === 0) { return; } $row.prev().before($row.get(0)); }); 

$tableID.on('click','.table-down', function () { const $row = $(this).parents('tr');
$row.next().after($row.get(0)); }); // A few jQuery helpers for exporting only jQuery.fn.pop= [].pop; 
jQuery.fn.shift = [].shift; $BTN.on('click', () => { const $rows =

$tableID.find('tr:not(:hidden)'); const headers = []; const data = []; // Get the headers("add special header logic here") 
$($rows.shift()).find('th:not(:empty)').each(function () {
headers.push($(this).text().toLowerCase()); }); // Turn all existing rows into a loopable array
$rows.each(function () { const $td = $(this).find('td'); const h = {}; // Use theheaders from earlier to name our hash keys headers.

forEach((header, i) => { h[header] =
$td.eq(i).text(); }); data.push(h); }); // Output the result
$EXPORT.text(JSON.stringify(data)); });






//mqttTable2
function addRow(mqttTable2) {
  var table = document.getElementById(mqttTable2);
  var rowCount = table.rows.length;
  var row = table.insertRow(rowCount);
  var checkBoxCell = row.insertCell(0);
  var step = document.createElement("input");
  step.type = "checkbox";
  step.name="chkbox[]";

  checkBoxCell.appendChild(step);
  
 // var stepNumberCell = row.insertCell(1);
  //stepNumberCell.innerHTML = rowCount ;

  var distanceCell = row.insertCell(1);
  var distance = document.createElement("input");
 
  distanceCell.appendChild(distance);

  var speedCell = row.insertCell(2);
  var speed = document.createElement("input");
  
  speedCell.appendChild(speed);

  var headingCell = row.insertCell(3);
  var heading = document.createElement("input");
  
  headingCell.appendChild(heading);

  var headingCell = row.insertCell(4);
  var heading = document.createElement("input");
 
  headingCell.appendChild(heading);

  var headingCell = row.insertCell(5);
  var heading = document.createElement("input");
 
  headingCell.appendChild(heading);
}




const saveBtn = document.getElementById('saveBtn')
const cacelBtn = document.getElementById('cancelBtn')

saveBtn.addEventListener('click', function(){persistData(saveBtn);} )


function persistData(elmnt){



}