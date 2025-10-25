// BETA VERSION - For testing and feedback
//
// Constants
const ROME_COORDS = [41.9028, 12.4964];
const REQUEST_TIMEOUT = 15000;

// Global variables
let mainMap;
let startMarker = null;
let routePath = null;
let currentRouteElements = [];

// Initialize map
function initializeMap() {
    // Create map centered on Rome
    mainMap = L.map('map').setView(ROME_COORDS, 4);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors | Made by SySLink'
    }).addTo(mainMap);

    // Add Rome marker
    const romeIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    });

    L.marker(ROME_COORDS, { icon: romeIcon })
        .addTo(mainMap)
        .bindPopup('Rome - The Eternal City')
        .openPopup();

    // Add click handler
    mainMap.on('click', handleMapClick);
}

// Check if a point is in a major water body
function isInMajorWaterBody(point) {
    // Rough bounding boxes for major water bodies
    const waterBodies = [
        // Mediterranean Sea
        { name: 'Mediterranean', bounds: [[30, -5], [46, 36]] },
        // North Atlantic
        { name: 'North Atlantic', bounds: [[35, -30], [60, -5]] },
        // North Sea
        { name: 'North Sea', bounds: [[51, -4], [60, 8]] }
    ];

    const [lat, lng] = point;
    return waterBodies.some(body => {
        const [[minLat, minLng], [maxLat, maxLng]] = body.bounds;
        return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
    });
}

// Handle map clicks
async function handleMapClick(e) {
    // Prevent multiple simultaneous calculations
    if (document.getElementById('loading').classList.contains('hidden') === false) {
        return;
    }
    
    const clickedPoint = [e.latlng.lat, e.latlng.lng];
    
    // Clear all previous route elements
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

    // Add marker for clicked location
    startMarker = L.marker(clickedPoint, {
        icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34]
        })
    }).addTo(mainMap);

    // Show loading indicator
    document.getElementById('loading').classList.remove('hidden');

    try {
        // Always try land route first
        let route = null;
        try {
            route = await calculateRoute(clickedPoint, ROME_COORDS);
        } catch (landError) {
            route = null;
        }

        if (route) {
            // Land route found
            routePath = L.geoJSON(route.geometry, {
                style: {
                    color: '#2196F3',
                    weight: 3,
                    opacity: 0.8
                }
            }).addTo(mainMap);
            const distance = (route.distance / 1000).toFixed(1);
            routePath.bindPopup(`Road route to Rome: ${distance} km`).openPopup();
            mainMap.fitBounds(routePath.getBounds(), { padding: [50, 50] });
        } else {
            // No land route, fallback to sea route
            const nearestPort = findNearestPort(clickedPoint);
            if (nearestPort) {
                // Sea route to port
                const seaRoute = createWaterRoute(clickedPoint, nearestPort.coords);
                const portMarker = L.marker(nearestPort.coords, {
                    icon: L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                        iconSize: [20, 32],
                        iconAnchor: [10, 32],
                        popupAnchor: [1, -28]
                    })
                }).addTo(mainMap)
                    .bindPopup(`Nearest port: ${nearestPort.name}`);
                // Land route from port to Rome
                let landRoute = null;
                try {
                    landRoute = await calculateRoute(nearestPort.coords, ROME_COORDS);
                } catch (portError) {
                    landRoute = null;
                }
                // Draw paths
                const waterPath = L.geoJSON(seaRoute.geometry, {
                    style: {
                        color: '#ff0000',
                        weight: 4,
                        opacity: 0.8,
                        dashArray: '15, 10'
                    }
                }).addTo(mainMap);
                let groupLayers = [waterPath, portMarker];
                let totalDistance = seaRoute.distance;
                if (landRoute) {
                    const landPath = L.geoJSON(landRoute.geometry, {
                        style: {
                            color: '#2196F3',
                            weight: 3,
                            opacity: 0.8
                        }
                    }).addTo(mainMap);
                    groupLayers.push(landPath);
                    totalDistance += landRoute.distance;
                }
                routePath = L.featureGroup(groupLayers).addTo(mainMap);
                routePath.bindPopup(
                    `Combined route to Rome:<br>` +
                    `Sea route: ${(seaRoute.distance / 1000).toFixed(1)} km<br>` +
                    (landRoute ? `Land route: ${(landRoute.distance / 1000).toFixed(1)} km<br>` : '') +
                    `Total: ${(totalDistance / 1000).toFixed(1)} km`
                ).openPopup();
                mainMap.fitBounds(routePath.getBounds(), { padding: [50, 50] });
            } else {
                // No port found, show straight line
                routePath = L.polyline([clickedPoint, ROME_COORDS], {
                    color: '#ff4444',
                    weight: 2,
                    opacity: 0.6,
                    dashArray: '5, 10'
                }).addTo(mainMap);
                const directDistance = (mainMap.distance(clickedPoint, ROME_COORDS) / 1000).toFixed(1);
                routePath.bindPopup(`Direct distance to Rome: ${directDistance} km (No route available)`);
            }
        }
    } catch (error) {
        console.error('Route calculation error:', error);
        startMarker.bindPopup('Unable to find a route to Rome from this location').openPopup();
        routePath = L.polyline([clickedPoint, ROME_COORDS], {
            color: '#ff4444',
            weight: 2,
            opacity: 0.6,
            dashArray: '5, 10'
        }).addTo(mainMap);
        const directDistance = (mainMap.distance(clickedPoint, ROME_COORDS) / 1000).toFixed(1);
        routePath.bindPopup(`Direct distance to Rome: ${directDistance} km (No route available)`);
    } finally {
        document.getElementById('loading').classList.add('hidden');
    }
}

// Check if a point is near a road
async function isNearRoad(point) {
    const url = `https://router.project-osrm.org/nearest/v1/driving/${point[1]},${point[0]}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.code === 'Ok' && data.waypoints && data.waypoints.length > 0) {
            // If the distance to nearest road is more than 2km, consider it too far
            return data.waypoints[0].distance <= 2000;
        }
        return false;
    } catch (error) {
        return false;
    }
}

// Calculate route between two points
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

// Create a water route
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

// Find nearest port
function findNearestPort(point) {
    // Define major ports by region
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

    // Check all regions
    Object.values(ports).flat().forEach(port => {
        const distance = mainMap.distance(point, port.coords);
        // Weight distance by port priority (closer to Rome = better)
        const weightedDistance = distance * port.priority;
        
        if (weightedDistance < shortestWeightedDistance) {
            shortestWeightedDistance = weightedDistance;
            bestPort = port;
        }
    });

    return bestPort;
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeMap();
    // Feedback button logic
    const feedbackBtn = document.getElementById('feedbackBtn');
    const feedbackModal = document.getElementById('feedbackModal');
    const feedbackModalContent = document.getElementById('feedbackModalContent');
    const closeFeedback = document.getElementById('closeFeedback');
    if (feedbackBtn && feedbackModal && feedbackModalContent && closeFeedback) {
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
    }
});