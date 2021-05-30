// Map layer checkboxes
var showAllCheck = document.getElementById('showAllCheck');
var spawnCheck 	 = document.getElementById('spawnCheck');
var targetCheck  = document.getElementById('targetCheck');
var rockCheck 	 = document.getElementById('rockCheck');
var routeCheck 	 = document.getElementById('routeCheck');
var routeSelector = document.getElementById('routeSelector');
var reloadBtn = document.getElementById('reloadBtn');
var executeBtn = document.getElementById('executeBtn');
showAllCheck.addEventListener('change', function () { showAll()}, false);
spawnCheck.addEventListener('change', 	function () { showSpawn()}, false);
targetCheck.addEventListener('change', 	function () { showTarget()}, false);
rockCheck.addEventListener('change', 	function () { showRock()}, false);
routeCheck.addEventListener('change', 	function () { showRoute()}, false);
routeSelector.addEventListener('change', function () { plotRoute()}, false);

// Map variables
var map;
var overlayMaps;
var spawnLayer = L.layerGroup();
var rocks = L.layerGroup();
var routeLayer = L.layerGroup();
var targetAreas = L.layerGroup();
var routePlotter = L.layerGroup();
var routePlot;
let routeWaypoints = [];

// Coordinate fixing to x, y
var yx = L.latLng;
var xy = function(x, y) {
		if (L.Util.isArray(x)) {    // If array given as xy([x, y]);
			return yx(x[1], x[0]);
		}
		return yx(y, x);  // Or just coors as xy(x, y);
};

document.addEventListener("DOMContentLoaded", function() { loadMap()}, false);
						  
function loadMap() {						  
	// Load Mars map document onload
	var spawnPoint = xy(777,690);
	var spawn = L.circle(spawnPoint, {
		color: 'red',
		fillColor: '#f03',
		fillOpacity: 0.3,
		radius: 50
		}).bindPopup("<b>Rover spawn point</b><br>Original landing spot.").addTo(spawnLayer);
	
	// Rock markers
	var rockText1 = "<b>Pile of rock!</b><br>You need to avoid.";
	var rockText2 = "<b>Big rock!</b><br>You need to avoid.";
	var rockText3 = "<b>Small rock!</b><br>You need to avoid.";
	var rock1  = L.marker(xy(1300, 840 )).bindPopup(rockText1).addTo(rocks);
	var rock2  = L.marker(xy(2575, 1548)).bindPopup(rockText1).addTo(rocks);
	var rock3  = L.marker(xy(536,  1633)).bindPopup(rockText2).addTo(rocks);
	var rock4  = L.marker(xy(1095, 1539)).bindPopup(rockText3).addTo(rocks);
	var rock5  = L.marker(xy(1358, 1207)).bindPopup(rockText2).addTo(rocks);
	var rock6  = L.marker(xy(836,  409 )).bindPopup(rockText1).addTo(rocks);
	var rock7  = L.marker(xy(1627, 522 )).bindPopup(rockText2).addTo(rocks);
	var rock8  = L.marker(xy(1653, 1459)).bindPopup(rockText2).addTo(rocks);
	var rock9  = L.marker(xy(789,  1206)).bindPopup(rockText3).addTo(rocks);
	var rock10 = L.marker(xy(2455, 375 )).bindPopup(rockText1).addTo(rocks);
	var rock11 = L.marker(xy(2339, 1158)).bindPopup(rockText3).addTo(rocks);
	var rock12 = L.marker(xy(1654, 1037)).bindPopup(rockText3).addTo(rocks);
	var rock13 = L.marker(xy(2062, 1670)).bindPopup(rockText3).addTo(rocks);
	
	// Target area styling and popup text
	var targetStyle = { color: '#ff0', fillColor: '#ff0', fillOpacity: 0.3 };
	var sierraPopup = "<b>Area: Sierra Nevada</b><br>Easy level mission area";
	var steigerPopup = "<b>Area: Steigerwald Lake</b><br>Medium level mission area";
	var gascognePopup = "<b>Area: Landes de Gascogne</b><br>Medium level mission area";
	var timanPopup = "<b>Area: Timanfaya</b><br>Hard level mission area";
	var katmaiPopup = "<b>Area: Katmai</b><br>Hard level mission area";
	
	// Target areas
	var ta1 = [xy(280,50),	 xy(280,150),  xy(160,150),  xy(160,50)];
	var ta2 = [xy(540,1758), xy(540,1858), xy(420,1858), xy(420,1758)];
	var ta3 = [xy(1690,1715),xy(1690,1815),xy(1570,1815),xy(1570,1715)];
	var ta4 = [xy(2931,1510),xy(2931,1610),xy(2811,1610),xy(2811,1510)];
	var ta5 = [xy(3180,300), xy(3180,400), xy(3060,400), xy(3060,300)];
	
	var sierra = L.polygon(ta1, targetStyle).bindPopup(sierraPopup).addTo(targetAreas);
	var steigerwald = L.polygon(ta2, targetStyle).bindPopup(steigerPopup).addTo(targetAreas);
	var gascogne = L.polygon(ta3, targetStyle).bindPopup(gascognePopup).addTo(targetAreas);
	var timan = L.polygon(ta4, targetStyle).bindPopup(timanPopup).addTo(targetAreas);
	var katmai = L.polygon(ta5, targetStyle).bindPopup(katmaiPopup).addTo(targetAreas);
	
	// Routes setup
	var sierraPoint = xy(220, 100);
	var steigerwaldPoint = xy(360, 1900);
	var steigerwald_wp1 = xy(443, 1046);
	var steigerwald_wp2 = xy(752, 1716);
	var gascognePoint = xy(1620,1900);
	var gascogne_wp1 = xy(1086, 1336);
	var timanPoint 	= xy(3020, 1800);
	var timan_wp1 	= xy(1305, 1063);
	var timan_wp2 	= xy(1953, 1469);
	var timan_wp3 	= xy(2865, 1406);
	var katmaiPoint = xy(3120, 350);
	var katmai_wp1 = xy(1476, 752);
	var katmai_wp2 = xy(2667, 613);
	var routeStyle = { color: '#ffe0c2', weight: 3, dashArray: '20, 20', lineJoin: 'bevel', fillOpacity: 0.3 };
	
	var route1 = L.polyline([spawnPoint, sierraPoint], routeStyle).addTo(routeLayer);
	var route2 = L.polyline([spawnPoint, steigerwald_wp1, steigerwald_wp2, steigerwaldPoint], routeStyle).addTo(routeLayer);
	var route3 = L.polyline([spawnPoint, gascogne_wp1, gascognePoint], routeStyle).addTo(routeLayer);
	var route4 = L.polyline([spawnPoint, timan_wp1, timan_wp2, timan_wp3, timanPoint], routeStyle).addTo(routeLayer);
	var route5 = L.polyline([spawnPoint, katmai_wp1, katmai_wp2, katmaiPoint], routeStyle).addTo(routeLayer);
	
	// Route plotter
	map = L.map('marsMap', {
    	crs: L.CRS.Simple,
		center: xy([1664, 1024]),
    	maxZoom: 2,
		minZoom: -2,
    	fullscreenControl: {
        	pseudoFullscreen: true // if true, fullscreen to page width and height
    	}
	});
	map.attributionControl.setPrefix("Mars map © 2021");
	map.attributionControl.addAttribution("Group-09");

	var bounds = [[0,0], xy(3328,2048)];
	var image = L.imageOverlay('assets/map/map.png', bounds).addTo(map);

	map.fitBounds(bounds);
	map.setView( xy([1664,1024]), -5);
	
	// Add layers
	spawnLayer.addTo(map);
	targetAreas.addTo(map);
};

function eachLayer(layer) {
        // map.removeLayer(layer);
    }

// Show or hide all layers
function showAll() {
	if (showAllCheck.checked) {
		spawnLayer.addTo(map);
		targetAreas.addTo(map);
		rocks.addTo(map);
		routeLayer.addTo(map);
		spawnCheck.checked = true;
		rockCheck.checked = true;
		targetCheck.checked = true;
		routeCheck.checked = true;
	} else {
		map.removeLayer(spawnLayer);
		map.removeLayer(targetAreas);
		map.removeLayer(rocks);
		map.removeLayer(routeLayer);
		spawnCheck.checked = false;
		rockCheck.checked = false;
		targetCheck.checked = false;
		routeCheck.checked = false;
    }
}

function showSpawn() {
	if (spawnCheck.checked) {
            spawnLayer.addTo(map);
        } else {
            map.removeLayer(spawnLayer);
        }
}

function showTarget() {
	if (targetCheck.checked) {
            targetAreas.addTo(map);
        } else {
            map.removeLayer(targetAreas);
        }
}

function showRock() {
	if (rockCheck.checked) {
            rocks.addTo(map);
        } else {
            map.removeLayer(rocks);
        }
}

function showRoute() {
	if (routeCheck.checked) {
            routeLayer.addTo(map);
        } else {
            map.removeLayer(routeLayer);
        }
}

// Center on zoom
function centerLeafletMapOnMarker(map, marker) {
  var latLngs = [ marker.getLatLng() ];
  var markerBounds = L.latLngBounds(latLngs);
  map.fitBounds(markerBounds);
}

function plotRoute() {
	var routeSelected = routeSelector.value;
	var routeSpawn = [690,770];
	var sierraPoint = [168,257];
	var steigerwaldRoute = [
		[690,770],
		[1221.33,1080.00],
		[1520.00,824.00],
		[1734.67,781.33],
		[1808, 481]
	];
	var gascogneRoute = [
		[690,770],
		[722.67,1390.67],
		[901.33,1930.67],
		[1408.00,1944.00],
		[1753.67, 1611]
	];
	var timanRoute 	= [
		[690,770],
		[710.67,1346.67],
		[858.67,1920.00],
		[960.00,2597.33],
		[1007,2948.67],
		[1290.00,2851],
		[1572,2866.58]
	];
	var katmaiRoute = [
		[690,770],
		[677.33,1200.00],
		[898.67,1884.00],
		[898.67,2242.67],
		[509.33,2738.67],
		[529.33,3138.67],
		[432.00,3085.33],
		[350, 3120]
	];
	var selectedRoute = [];
	
	switch(routeSelected) {
		case "sierra":
			selectedRoute = [ routeSpawn, sierraPoint ]
			break;
		case "steigerwald":
			selectedRoute = steigerwaldRoute;
			break;
		case "gascogne":
			selectedRoute = gascogneRoute;
			break;
		case "timan":
			selectedRoute = timanRoute;
			break;
		case "katmai":
			selectedRoute = katmaiRoute
			break;
		default:
			map.removeControl(routePlotter);
			routePlotter.clearLayers();
	}
	
	routeSelector.disabled = true;
	reloadBtn.disabled = false;
	executeBtn.disabled = false;
	mapSaveBtn.disabled = false;
	
	routePlot = L.Polyline.PolylineEditor(selectedRoute, {maxMarkers: 50});
	routePlot.addTo(map);
	
	map.fitBounds(routePlot.getBounds());
	
	// Reload confirmation
	var reloadDesc = "If you reload map, it will reset the entire map and your current route will be deleted. Are you sure to reload?"
	reloadBtn.addEventListener('click',function () { missionModal('Clear map', reloadDesc, 'Reload', 'Cancel', 'reloadMap()')}, false);
	
	var executeDesc = "It is highly recommended to save your mission before executing it. There is a good chance of loosing your mission details due to communication errors or other unforeseen errors. Also it is useful to save if you would like to revise it and execute again. Any unsaved missions would be reset after mission completion.<br /><br /><strong>Are you sure to execute the mission now?</strong>";
	executeBtn.addEventListener('click',function () { missionModal('Execute mission', executeDesc, 'Execute', 'Cancel', 'executeMission()')}, false);
}

function reloadMap() {
	location.reload();
}

var modalWrap = null;
const missionModal = (title, description, yesBtnLabel, noBtnLabel, action) => {
  if (modalWrap !== null) {
    modalWrap.remove();
  }
	modalWrap = document.createElement('div');
	
  modalWrap.innerHTML = `
    <div class="modal fade" id="missionWarning">
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
			<button id="modalYesBtn" type="button" class="btn btn-primary me-4" onclick="` + action + `">${yesBtnLabel}</button>
        	<button id="modalNoBtn" type="button" class="btn btn-warning" data-bs-dismiss="modal" >${noBtnLabel}</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.append(modalWrap);

  var modal = new bootstrap.Modal(modalWrap.querySelector('.modal'));
  modal.show();
}

function saveMissionMap() {
	var userId = store.get('loggedUserid');
	if (userId != null) {
		updateTimestamp();
		var missionContent = extractPolys();	
		var steps = missionContent.waypoints.length;
		const timestamp = new Date(Date.now()).toISOString();

		const saveMapQuery = {
			name: 'save-mission-plot',
			text: 'INSERT INTO missions (userid, date, source, steps, content) VALUES ($1, $2, $3, $4, $5)',
			values: [userId, timestamp, 'map', steps, missionContent]
		}
		
		const client = new Client(clientConfig);
		client.connect();
		client
  			.query(saveMapQuery)
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

function extractPolys() {
	var missionContent = {};	

	map.getEditablePolylines().forEach(function(polyline) {
		var missionRoute = polyline.getPoints();
		var i = 0;
		missionContent.waypoints = [];

		missionRoute.forEach(function(point) {
			var latLng = point.getLatLng();
			var wp = {
				waypoint: i,
				coord: {
					lat: latLng.lat.toFixed(2),
					lng: latLng.lng.toFixed(2)
				}
			}

			missionContent.waypoints.push(wp);
			i++;
		});
	});
	
	return missionContent;
}

function executeMission() {
	updateTimestamp();
	hideModal('missionWarning');
	var missionWaypoints = extractPolys();
	var missionContent = {};
	var steps = missionWaypoints.waypoints.length;
	missionContent.steps = [];
	
	var gdMultiplier = 5.5281385;

	for (var i = 0; i < steps-1; i++) {
		// Calculate heading and distance from waypoints
		var a2 = missionWaypoints.waypoints[i].coord.lat, 
			a1 = missionWaypoints.waypoints[i].coord.lng,
			b2 = missionWaypoints.waypoints[i+1].coord.lat, 
			b1 = missionWaypoints.waypoints[i+1].coord.lng;
	
		console.log([a1,a2,b1,b2])
		
		// Heading calculator
		const twoPi = 6.2831853071795865;
    	const RAD2DEG = 57.2957795130823209;
    	// if (a1 = b1 and a2 = b2) throw an error 
    	var theta = Math.atan2(b1 - a1, a2 - b2);
    	if (theta < 0)
        	theta += twoPi;
    	var brng = Math.round(RAD2DEG * theta); 
		if (brng >= 360) {
			brng = 0;
		}
		
		// distance
		var sq1 = Math.pow(b2-a2,2);
		var sq2 = Math.pow(b1-a1,2);
		var distance = (Math.sqrt(sq1+sq2)) * gdMultiplier;
		distance = parseInt(distance);
		
		// Capture result
		var step = {
				step: i,
				parameters: {
					heading: brng,
					speed: 60,
					distance: distance
				}
		}
		missionContent.steps.push(step);
	}
	
	document.getElementById("stream-tab").classList.add("active");
	document.getElementById("stream-tab").classList.add("show");
	document.getElementById("map-tab").classList.remove("active");
	document.getElementById("map-tab").classList.remove("show");
	document.getElementById("missionTabs-stream-tab").classList.add("active");
	document.getElementById("missionTabs-map-tab").classList.remove("active");
	switchPane('stream');
	
	store.set('missionContent', missionContent);
};

function loadMission(missionId) {
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
					switchPane('map');
					document.getElementById("map-tab").classList.add("active");
					document.getElementById("map-tab").classList.add("show");
					document.getElementById("table-tab").classList.remove("active")
					document.getElementById("table-tab").classList.remove("show")
					document.getElementById("stream-tab").classList.remove("active");
					document.getElementById("stream-tab").classList.remove("show");
					document.getElementById("missionTabs-map-tab").classList.add("active")	
					document.getElementById("missionTabs-table-tab").classList.remove("active")
					document.getElementById("missionTabs-stream-tab").classList.remove("active")

					console.log("Time to load map ...")
					var selectedRoute = [];
					var wpCount = result.rows[0].steps;
					var json = result.rows[0].content.waypoints;
				
					for (var i = 0; i < wpCount; i++) {
						selectedRoute.push([json[i].coord.lat, json[i].coord.lng]);
					}
				
					routeSelector.disabled = true;
					reloadBtn.disabled = false;
					executeBtn.disabled = false;
					mapSaveBtn.disabled = false;

					routePlot = L.Polyline.PolylineEditor(selectedRoute, {maxMarkers: 50});
					routePlot.addTo(map);

					map.fitBounds(routePlot.getBounds());

					// Reload confirmation
					var reloadDesc = "If you reload map, it will reset the entire map and your current route will be deleted. Are you sure to reload?"
					reloadBtn.addEventListener('click',function () { showModal("Clear map", reloadDesc, yesBtnLabel = 'Reload', noBtnLabel = 'Cancel', false)}, false);
					
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