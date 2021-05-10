const { app, BrowserWindow, globalShortcut } = require("electron");

const path = require("path")

$(app).ready(function () {
  var grid;
  grid = $("#grid").grid({
    // dataSource: '/Players/Get',
    dataSource: "",
    uiLibrary: "bootstrap4",
    primaryKey: "ID",
    inlineEditing: { mode: "command" },
    columns: [
      { field: "Throttle Application Steps", width: 44 },
      { field: "Turn Angle Steps", editor: true },
      { field: "Console Command Ajustments", type: "date", editor: true },
    ],
    pager: { limit: 10 },
  });
  grid.on("rowDataChanged", function (e, id, record) {
    // Clone the record in new object where you can format the data to format that is supported by the backend.
    var data = $.extend(true, {}, record);
    // Format the date to format that is supported by the backend.
    data.DateOfBirth = gj.core
      .parseDate(record.DateOfBirth, "mm/dd/yyyy")
      .toISOString();
    // Post the data to the server
    $.ajax({
     // url: "/Players/Save",
      url: "",
      data: { record: data },
      method: "POST",
    }).fail(function () {
      alert("Failed to save.");
    });
  });
  grid.on("rowRemoving", function (e, $row, id, record) {
    if (confirm("Are you sure?")) {
        //$.ajax({ url: "/Players/Delete", data: { id: id }, method: "POST" })
        $.ajax({ url: "", data: { id: id }, method: "POST" })
        .done(function () {
          grid.reload();
        })
        .fail(function () {
          alert("Failed to delete.");
        });
    }
  });
});
