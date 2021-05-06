<p align="center"><img src="https://github.com/DIT112-V21/group-09/blob/master/frontendApp/assets/images/rover-logo.png?raw=true" alt="rover-logo.png" width="480" height="121"></p>

![Electron CI](https://github.com/DIT112-V21/group-09/actions/workflows/electron-ci.yml/badge.svg)
![Arduino Build](https://github.com/DIT112-V21/group-09/actions/workflows/arduino-build.yml/badge.svg)

Autonomous SmartRover that is designed to explore foreign planets, terrain and its environment.

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Testing](#testing)
- [How to use](#how-to-use)
- [Dependencies](#dependencies)
- [Development team](#development-team)
- [License](#license)

## Introduction
<p align="center"><img src="https://github.com/DIT112-V21/group-09/blob/master/frontendApp/assets/images/home-rover-model.png?raw=true" alt="rover-logo.png" width="600" height="369"></p>
In this repository you can find all the neccessary information to setup and use SmartRover system. By fully 
utilizing SmartCar shield software library capabilities, this system is designed to explore the idea of examining more
territory in the foreign terrain and perform remote robotic vehicle control. <br /><br />

Furthermore, you have access to all source codes and files that we put our effort to build this project. If you find any bugs, mistakes, foolishness, typos or have useful suggestions, please contact us (how? ... let's see about that) as we appreciate your interest in our project.

## Features

The system is developed such that it can perform the following tasks: 

- Load custom Martian terrain mod for improved realism
- Connect to the SmartRover and manually drive
- Send console commands to drive the rover
- Connect and receive live camera stream
- Autonomous driving with obstacle avoidance logic built-in
- Build and execute missions by defining each step parameters
- Create user account and login with unique profile
- Save and load user missions

## Installation
Detailed installation instructions are provided on the wiki page.
* [MacOS user build guide](https://github.com/DIT112-V21/group-09/wiki/MacOS-user-build-guide)
* [Windows user build guide](https://github.com/DIT112-V21/group-09/wiki/Windows-user-build-guide)

## Testing

To build, run or test the source package for the SmartRover frontend app, you need to install NodeJS package manager first. Please refer to [GET NPM](https://www.npmjs.com/get-npm) page to download and install npm. <br /><br />
To build before the tests for this project, lanuch Command prompt or terminal and navigate to ElectronJS root folder. And run:

    $ npm ci

To run the website for testing purposes, run:

    $ npm run test

## How to use

### Launch the app
Please refer to Installation manuals above to install the system. Once installed, you can launch the SmartRover app by clicking SmartRover app icon.
    
### Manual control
Manual control page allows the user to precisely control the Rover in real time by using control pad buttons and terminal console commands. Once you connect to the Mars Orbiter satellite feed, the app will show you live camera streams from the rover and detailed telemetry data as soon as it is available. 

Please visit [Manual control wiki page](https://github.com/DIT112-V21/group-09/wiki/Manual-control-of-the-Rover) for more detailed information.

### Mission control

More updates coming soon ...

### Dependencies

- [Arduino IDE](https://www.arduino.cc/en/software)
- [SMCE-gd](https://github.com/ItJustWorksTM/smce-gd)
- [Electron.js](https://www.electronjs.org/)
- [Godot engine](https://godotengine.org/)

## Development team:
- [Alexander Nikolic](https://github.com/nikalc)
- [Altansukh Tumenjargal](https://github.com/axe007)
- [Anwar Ramadi](https://github.com/ramadi-a)
- [Kamila Yosofi](https://github.com/kam56)
- [Markus Juntura](https://github.com/OneMoreOreo)

## Contributing

If you wish to contribute to this website, please fork it on GitHub, push your change to a named branch, then send a pull request. If it is a big feature, you might want to start an issue first to make sure it's something that will be accepted. If it involves code, please also write tests for it.

## License

MIT © Group-09
The source code for the site is licensed under the MIT license, which you can find in the MIT-LICENSE.txt file.

All graphical assets are licensed under the [Creative Commons Attribution 3.0 Unported License](https://creativecommons.org/licenses/by/3.0/).
