<p align="center"><img src="https://github.com/DIT112-V21/group-09/blob/master/frontendApp/assets/images/rover-logo.png?raw=true" alt="rover-logo.png" width="480" height="121"></p>

![Electron CI](https://github.com/DIT112-V21/group-09/actions/workflows/electron-ci.yml/badge.svg)
![Arduino Build](https://github.com/DIT112-V21/group-09/actions/workflows/arduino-build.yml/badge.svg)

Autonomous SmartRover that is designed to explore foreign planets, terrain and its environment.

- [Introduction](#introduction)
- [Features](#features)
- [Demo](#demo) 
- [Installation](#installation)
- [Testing](#testing)
- [How to use](#how-to-use)
- [Dependencies](#dependencies)
- [Development team](#development-team)
- [Credits](#credits)
- [Contributing](#contributing)  
- [License](#license)

## Introduction
<p align="center"><img src="https://github.com/DIT112-V21/group-09/blob/master/frontendApp/assets/images/home-rover-model.png?raw=true" alt="rover-logo.png" width="600" height="369"></p>
In this repository you can find all the neccessary information to setup and use SmartRover system. By fully 
utilizing SmartCar shield software library capabilities, this system is designed to explore the idea of examining more
territory in the foreign terrain and perform remote robotic vehicle control. <br />

Furthermore, you have access to all source codes and files that we put our effort to build this project. If you find any 
bugs, mistakes, foolishness, typos or have useful suggestions, please contact us (how? ... let's see about that) as we 
appreciate your interest in our project.

## Demo video
[![SmartRover Demo](https://img.youtube.com/vi/RKo8-B3RKVY/0.jpg)](https://www.youtube.com/watch?v=RKo8-B3RKVY "SmartRover Demo")

## Features

The system is developed such that it can perform the following tasks: 
- Robust [Frontend app](https://github.com/DIT112-V21/group-09/wiki/Front-end-website) built on Electron JS
- Load custom [Martian terrain and rover mod](https://github.com/DIT112-V21/group-09/wiki/Emulator-UI-modification) for improved realism
- Connect to the SmartRover and [manually drive](https://github.com/DIT112-V21/group-09/wiki/Manual-control-of-the-Rover)
- Send console commands to drive the SmartRover
- Connect and receive [live camera stream](https://github.com/DIT112-V21/group-09/wiki/Retrieve-emulator-feedback)
- Autonomous driving with obstacle avoidance logic built-in
- Build and execute [the Missions](https://github.com/DIT112-V21/group-09/wiki/Mission-control-frontend) by defining each step parameters
- Create [user account](https://github.com/DIT112-V21/group-09/wiki/User-management-and-data-persistence) and login with unique profile
- Save and load [user missions](https://github.com/DIT112-V21/group-09/wiki/User-management-and-data-persistence)

## Installation
Detailed installation instructions are provided on the wiki page.
* [MacOS user build guide](https://github.com/DIT112-V21/group-09/wiki/MacOS-user-build-guide)
* [Windows user build guide](https://github.com/DIT112-V21/group-09/wiki/Windows-user-build-guide)

## Testing

To build, run or test the source package for the SmartRover frontend app, you need to install NodeJS package manager first. 
Please refer to [GET NPM](https://www.npmjs.com/get-npm) page to download and install npm. <br /><br />
To build before the tests for this project, launch Command prompt or terminal and navigate to ElectronJS root folder. And run:

    $ npm ci

To run the website for testing purposes, run:

    $ npm run test

## How to use

### Launch the app
<p><img align="left" src="https://raw.githubusercontent.com/DIT112-V21/group-09/master/frontendApp/assets/images/favicon.ico" 
alt="rover-logo.png" width="48" height="48">
Please refer to Installation manuals above to install the system. Once installed, you can launch the SmartRover app by 
clicking SmartRover app icon.</p><br>
    
### Manual control
Manual control page allows the user to precisely control the Rover in real time by using control pad buttons and terminal 
console commands. Once you connect to the Mars Orbiter satellite feed, the app will show you live camera streams from the 
rover and detailed telemetry data as soon as it is available. 

Please visit [Manual control wiki page](https://github.com/DIT112-V21/group-09/wiki/Manual-control-of-the-Rover) for more 
detailed information.

### Mission control

Mission control page allows the user to plot a mission to designated target areas on the Jezero crater area and send it 
to the SmartRover for execution. User can monitor status of the mission and receive notifications. Once SmartRover reaches
the target area and successfully scans the target area encoded in the QR code, the mission is complete and considered 
successful.

Please visit [Mission control wiki page](https://github.com/DIT112-V21/group-09/wiki/Mission-control-guide) for more 
detailed information.

## Dependencies

- [Arduino IDE](https://www.arduino.cc/en/software)
- [SMCE-gd](https://github.com/ItJustWorksTM/smce-gd)
- [Electron.js](https://www.electronjs.org/)
- [Godot engine](https://godotengine.org/)

Please visit [Technology & Frameworks](https://github.com/DIT112-V21/group-09/wiki/Technology-&-Frameworks) for more 
information.

## Development team:
- [Alexander Nikolic](https://github.com/nikalc)
- [Altansukh Tumenjargal](https://github.com/axe007)
- [Anwar Ramadi](https://github.com/ramadi-a)
- [Kamila Yosofi](https://github.com/kam56)
- [Markus Juntura](https://github.com/OneMoreOreo)

## Credits 
We appreciate everyone who had supported us during this project, including the creators of various plugins, addons, 
creative materials, medias, 3D models and much more.

Please visit [CREDITS](https://github.com/DIT112-V21/group-09/wiki/Credits) for our special thanks, credits and 
attributions. While we made our best effort to include everyone, if we are missing something feel free to notify us. 
We will make an immediate updates. Thank you again. 

## Contributing

If you wish to contribute to this website, please fork it on GitHub, push your changes to a named branch, then send a 
pull request. If it is a big feature, you might want to start an issue first to make sure it's something that will be 
accepted. If it involves code, please also write tests for it.

## License

MIT © Group-09
The source code for the site is licensed under the MIT license, which you can find in the MIT-LICENSE.txt file.

All graphical assets are licensed under the [Creative Commons Attribution 3.0 Unported License](https://creativecommons.org/licenses/by/3.0/).
