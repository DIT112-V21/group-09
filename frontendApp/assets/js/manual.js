const buttonClick = document.querySelector(".clickHere");

//Manual Controll
document.addEventListener("DOMContentLoaded", function () {
  document.getElementsByTagName("form")[0].onsubmit = function (evt) {
    evt.preventDefault();
    checkWord();
  };

  document.getElementById("consoleTextInput").focus();

  //User Input
  let textInputValue //= document.getElementById("consoleTextInput").value.trim();

  //Clear Input Text
  let clearInput = function () {
    document.getElementById("consoleTextInput").value = "";
  };

  //Scroll Text In Console
  let scrollToBottomOfResults = function () {
    let consoleResultsDiv = document.getElementById("consoleContentResults");
    consoleResultsDiv.scrollTop = consoleResultsDiv.scrollHeight;
  };

  scrollToBottomOfResults();

  //Output text to the Console
  let addTextToConsole = function (textToAdd) {
    document.getElementById("consoleContentResults").innerHTML +=
      "<p>" + textToAdd + "</p>";
    scrollToBottomOfResults();
  };

  //Print Help List
  let postHelpList = function () {
    let helpKeyWords = [
      "User Commands For Rover",
      "Go Forward: F10-100",
      "Reverse: R10-100",
      "Turn Left: Left",
      "Turn Right: Right",
      "Stop: Stop"
    ].join("<br>");
    addTextToConsole(helpKeyWords);
  };

  //User Commands to Input
  let textCommands = function () {
    switch (textInputValueLowerCase) {
      case "f10":
        clearInput();
        addTextToConsole("Direction Forward Speed 10");
        break;
      case "f20":
        clearInput();
        addTextToConsole("Direction Forward Speed 20");
        break;
      case "f30":
        clearInput();
        addTextToConsole("Direction Forward Speed 30");
        break;
      case "f40":
        clearInput();
        addTextToConsole("Direction Forward Speed 30");
        break;
      case "f50":
        clearInput();
        addTextToConsole("Direction Forward Speed 30");
        break;
      case "r10":
        clearInput();
        addTextToConsole("Direction Reverse Speed 10");
        break;
      case "r20":
        clearInput();
        addTextToConsole("Direction Reverse Speed 10");
        break;
      case "r30":
        clearInput();
        addTextToConsole("Direction Reverse Speed 10");
        break;
      case "left":
        clearInput();
        addTextToConsole("Turning Left");
        break;
      case "right":
        clearInput();
        addTextToConsole("Turning Right");
        break;
        case "stop":
          clearInput();
          addTextToConsole("Rover Has Stopped!")
          break;
      case "help":
        clearInput();
        postHelpList();
        break;
      default:
        clearInput();
        addTextToConsole("That´s not a command!! Type: Help");
        break;
    }
  };

  let checkWord = function () {
    textInputValue = document.getElementById("consoleTextInput").value.trim();
    textInputValueLowerCase = textInputValue.toLowerCase();

    if (textInputValue != "") {
      addTextToConsole(
        "<p class='userEnteredText'> Command: " + textInputValue + "<p>"
      );
      textCommands(textInputValueLowerCase);
    }

    clearInput();
  };
});

//Status Updates
let addTextToOutput = function (textToAdd) {
  document.getElementById("output-updates").innerHTML +=
    "<p class='status-output'>" + textToAdd + "</p>";
  scrollOutput();
};

let scrollOutput = function () {
  let outputResultsDiv = document.getElementById("output-updates");
  outputResultsDiv.scrollTop = outputResultsDiv.scrollHeight;
};

buttonClick.addEventListener("click", function () {
  addTextToOutput("Rover Has Landed!");
});
