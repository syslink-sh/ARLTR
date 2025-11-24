// beta stuff
//
// stuff
const ROME_COORDS = CONFIG.DESTINATION.coords;
const REQUEST_TIMEOUT = CONFIG.FEATURES.requestTimeout;

// vars
let mainMap;
let startMarker = null;
let routePath = null;
let currentRouteElements = [];

// map setup
function initializeMap() {
    // make map
    mainMap = L.map('map').setView(ROME_COORDS, CONFIG.MAP.defaultZoom);

    // tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors | Made by SySLink'
    }).addTo(mainMap);

    // marker
    const destinationIcon = L.icon({
        iconUrl: CONFIG.ICONS.destination,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    });

    L.marker(ROME_COORDS, { icon: destinationIcon })
        .addTo(mainMap)
        .bindPopup(CONFIG.DESTINATION.displayName)
        .openPopup();

    // clicks
    mainMap.on('click', handleMapClick);
}

// water check
function isInMajorWaterBody(point) {
    // water areas
    const waterBodies = [
        // med sea
        { name: 'Mediterranean', bounds: [[30, -5], [46, 36]] },
        // atlantic
        { name: 'North Atlantic', bounds: [[35, -30], [60, -5]] },
        // north sea
        { name: 'North Sea', bounds: [[51, -4], [60, 8]] }
    ];

    const [lat, lng] = point;
    return waterBodies.some(body => {
        const [[minLat, minLng], [maxLat, maxLng]] = body.bounds;
        return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
    });
}

// click handler
async function handleMapClick(e) {
    // no double clicks
    if (document.getElementById('loading').classList.contains('hidden') === false) {
        return;
    }
    
    const clickedPoint = [e.latlng.lat, e.latlng.lng];
    
    // clear old stuff
    if (startMarker) {
        mainMap.removeLayer(startMarker);
        startMarker = null;
    }
    if (routePath) {
        mainMap.removeLayer(routePath);
        routePath = null;
    }
    currentRouteElements.forEach(element => {
        if (element && mainMap.hasLayer(element)) {
            mainMap.removeLayer(element);
        }
    });
    currentRouteElements = [];

    // add marker
    startMarker = L.marker(clickedPoint, {
        icon: L.icon({
            iconUrl: CONFIG.ICONS.start,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34]
        })
    }).addTo(mainMap);

    // loading
    document.getElementById('loading').classList.remove('hidden');

    try {
        // try land first
        let route = null;
        try {
            route = await calculateRoute(clickedPoint, ROME_COORDS);
        } catch (landError) {
            route = null;
        }

        if (route) {
            // got land route
            routePath = L.geoJSON(route.geometry, {
                style: CONFIG.ROUTES.landRoute
            }).addTo(mainMap);
            const distance = (route.distance / 1000).toFixed(1);
            routePath.bindPopup(`Road route to ${CONFIG.DESTINATION.name}: ${distance} km`).openPopup();
            mainMap.fitBounds(routePath.getBounds(), { padding: [50, 50] });
        } else {
            // no land, try sea
            const nearestPort = findNearestPort(clickedPoint);
            if (nearestPort) {
                // sea to port
                const seaRoute = createWaterRoute(clickedPoint, nearestPort.coords);
                const portMarker = L.marker(nearestPort.coords, {
                    icon: L.icon({
                        iconUrl: CONFIG.ICONS.port,
                        iconSize: [20, 32],
                        iconAnchor: [10, 32],
                        popupAnchor: [1, -28]
                    })
                }).addTo(mainMap)
                    .bindPopup(`Nearest port: ${nearestPort.name}`);
                // port to destination
                let landRoute = null;
                try {
                    landRoute = await calculateRoute(nearestPort.coords, ROME_COORDS);
                } catch (portError) {
                    landRoute = null;
                }
                // draw lines
                const waterPath = L.geoJSON(seaRoute.geometry, {
                    style: CONFIG.ROUTES.seaRoute
                }).addTo(mainMap);
                let groupLayers = [waterPath, portMarker];
                let totalDistance = seaRoute.distance;
                if (landRoute) {
                    const landPath = L.geoJSON(landRoute.geometry, {
                        style: CONFIG.ROUTES.landRoute
                    }).addTo(mainMap);
                    groupLayers.push(landPath);
                    totalDistance += landRoute.distance;
                }
                routePath = L.featureGroup(groupLayers).addTo(mainMap);
                routePath.bindPopup(
                    `Combined route to ${CONFIG.DESTINATION.name}:<br>` +
                    `Sea route: ${(seaRoute.distance / 1000).toFixed(1)} km<br>` +
                    (landRoute ? `Land route: ${(landRoute.distance / 1000).toFixed(1)} km<br>` : '') +
                    `Total: ${(totalDistance / 1000).toFixed(1)} km`
                ).openPopup();
                mainMap.fitBounds(routePath.getBounds(), { padding: [50, 50] });
            } else {
                // no port, straight line
                routePath = L.polyline([clickedPoint, ROME_COORDS], CONFIG.ROUTES.errorRoute).addTo(mainMap);
                const directDistance = (mainMap.distance(clickedPoint, ROME_COORDS) / 1000).toFixed(1);
                routePath.bindPopup(`Direct distance to ${CONFIG.DESTINATION.name}: ${directDistance} km (No route available)`);
            }
        }
    } catch (error) {
        console.error('Route calculation error:', error);
        startMarker.bindPopup(`Unable to find a route to ${CONFIG.DESTINATION.name} from this location`).openPopup();
        routePath = L.polyline([clickedPoint, ROME_COORDS], CONFIG.ROUTES.errorRoute).addTo(mainMap);
        const directDistance = (mainMap.distance(clickedPoint, ROME_COORDS) / 1000).toFixed(1);
        routePath.bindPopup(`Direct distance to ${CONFIG.DESTINATION.name}: ${directDistance} km (No route available)`);
    } finally {
        document.getElementById('loading').classList.add('hidden');
    }
}

// road check
async function isNearRoad(point) {
    const url = `https://router.project-osrm.org/nearest/v1/driving/${point[1]},${point[0]}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.code === 'Ok' && data.waypoints && data.waypoints.length > 0) {
            // too far from road
            return data.waypoints[0].distance <= 2000;
        }
        return false;
    } catch (error) {
        return false;
    }
}

// get route
async function calculateRoute(start, end) {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            return data.routes[0];
        }
        throw new Error('No route found');
    } catch (error) {
        throw error;
    }
}

// make water line
function createWaterRoute(start, end) {
    const latlngs = [];
    const steps = 20;
    
    for (let i = 0; i <= steps; i++) {
        const fraction = i / steps;
        const lat = start[0] + (end[0] - start[0]) * fraction;
        const lng = start[1] + (end[1] - start[1]) * fraction;
        const curvature = 0.02;
        const midpointOffset = Math.sin(fraction * Math.PI) * curvature;
        
        latlngs.push([
            lat + midpointOffset * (end[1] - start[1]),
            lng - midpointOffset * (end[0] - start[0])
        ]);
    }
    
    return {
        geometry: {
            type: "LineString",
            coordinates: latlngs.map(ll => [ll[1], ll[0]])
        },
        distance: mainMap.distance(start, end)
    };
}

// find port
function findNearestPort(point) {
    // ports list
    const ports = {
        mediterranean: [
            { name: "Civitavecchia (Rome's Port)", coords: [42.0938, 11.7896], priority: 1 },
            { name: "Naples", coords: [40.8518, 14.2681], priority: 1 },
            { name: "Genoa", coords: [44.4056, 8.9463], priority: 1 },
            { name: "Marseille", coords: [43.2965, 5.3698], priority: 2 },
            { name: "Barcelona", coords: [41.3851, 2.1734], priority: 2 },
            { name: "Palermo", coords: [38.1157, 13.3615], priority: 2 },
            { name: "Athens", coords: [37.9421, 23.6466], priority: 3 },
            { name: "Istanbul", coords: [41.0082, 28.9784], priority: 3 },
            { name: "Alexandria", coords: [31.2001, 29.9187], priority: 3 },
            { name: "Tunis", coords: [36.8065, 10.1815], priority: 3 }
        ],
        atlantic: [
            { name: "Lisbon", coords: [38.7223, -9.1393], priority: 2 },
            { name: "Porto", coords: [41.1579, -8.6291], priority: 2 },
            { name: "Bordeaux", coords: [44.8378, -0.5792], priority: 2 }
        ],
        northSea: [
            { name: "Amsterdam", coords: [52.3676, 4.9041], priority: 3 },
            { name: "Hamburg", coords: [53.5511, 9.9937], priority: 3 }
        ]
    };

    let bestPort = null;
    let shortestWeightedDistance = Infinity;

    // check ports
    Object.values(ports).flat().forEach(port => {
        const distance = mainMap.distance(point, port.coords);
        // priority stuff
        const weightedDistance = distance * port.priority;
        
        if (weightedDistance < shortestWeightedDistance) {
            shortestWeightedDistance = weightedDistance;
            bestPort = port;
        }
    });

    return bestPort;
}

// start
document.addEventListener('DOMContentLoaded', () => {
    // update page
    document.title = CONFIG.SITE_TITLE;
    document.querySelector('h1').innerHTML = `All Roads Lead To ${CONFIG.DESTINATION.name} <span style="font-size:0.5em; color:#fff; background:#2196F3; border-radius:6px; padding:2px 8px; margin-left:10px; vertical-align:middle;">${CONFIG.FEATURES.showBetaBadge ? 'BETA' : ''}</span>`;
    document.querySelector('.instructions p').textContent = `Click anywhere on the map to find your path to ${CONFIG.DESTINATION.name}!`;
    document.querySelector('.footer').innerHTML = `${CONFIG.BRANDING.footerText} <a href="${CONFIG.BRANDING.footerLink}" target="_blank" style="color: #2196F3; text-decoration: none;">${CONFIG.BRANDING.footerLinkText}</a> ${CONFIG.BRANDING.copyright}`;
    
    // modal stuff
    document.querySelector('#feedbackModalContent p').innerHTML = `To send feedback or contact the team,<br>reach out to me on Discord.`;
    document.querySelector('#feedbackModalContent div').innerHTML = `Discord: <b>${CONFIG.BRANDING.feedbackDiscord}</b>`;
    
    initializeMap();
    // button clicks
    const feedbackBtn = document.getElementById('feedbackBtn');
    const feedbackModal = document.getElementById('feedbackModal');
    const feedbackModalContent = document.getElementById('feedbackModalContent');
    const closeFeedback = document.getElementById('closeFeedback');
    if (feedbackBtn && feedbackModal && feedbackModalContent && closeFeedback && CONFIG.FEATURES.enableFeedbackButton) {
        feedbackModal.classList.add('hidden');
        feedbackBtn.addEventListener('click', () => {
            feedbackModal.classList.remove('hidden');
        });
        closeFeedback.addEventListener('click', () => {
            feedbackModal.classList.add('hidden');
        });
        feedbackModal.addEventListener('click', (e) => {
            if (e.target === feedbackModal) {
                feedbackModal.classList.add('hidden');
            }
        });
    } else if (!CONFIG.FEATURES.enableFeedbackButton) {
        feedbackBtn.style.display = 'none';
    }
});