let map;
let romeCoords;
let romeMarker;
let startMarker = null;
let routeLayer = null;

async function init() {
    try {
        const configResponse = await fetch('/api/config');
        const config = await configResponse.json();
        romeCoords = [config.rome.lat, config.rome.lng];

        initializeMap(config.rome);

        setupEventListeners();
    } catch (error) {
        showError('Failed to initialize application. Please refresh the page.');
    }
}

function initializeMap(romeConfig) {
    map = L.map('map').setView(romeCoords, 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors | Made by SySLink',
        maxZoom: 19
    }).addTo(map);

    const romeIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        shadowSize: [41, 41]
    });

    romeMarker = L.marker(romeCoords, { icon: romeIcon })
        .addTo(map)
        .bindPopup(`<strong>${romeConfig.displayName}</strong><br`)
        .openPopup();

    map.on('click', handleMapClick);
}

function setupEventListeners() {
    document.getElementById('clearRoute').addEventListener('click', clearRoute);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            clearRoute();
        }
    });
}

async function handleMapClick(e) {
    const clickedPoint = {
        lat: e.latlng.lat,
        lng: e.latlng.lng
    };

    clearRoute();

    const startIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        shadowSize: [41, 41]
    });

    startMarker = L.marker([clickedPoint.lat, clickedPoint.lng], { icon: startIcon })
        .addTo(map)
        .bindPopup('<strong>Starting Point</strong>')
        .openPopup();

    await calculateRoute(clickedPoint);
}

async function calculateRoute(start) {
    showLoading(true);

    try {
        const response = await fetch('/api/route', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                start: start,
                end: { lat: romeCoords[0], lng: romeCoords[1] },
                profile: 'car'
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to calculate route');
        }

        if (data.success) {
            displayRoute(data.route);
        } else {
            throw new Error('No route found');
        }

    } catch (error) {
        const errorMessage = error.message || 'Unable to calculate route. Please try a different location.';
        showError(errorMessage);
        
        if (startMarker) {
            map.removeLayer(startMarker);
            startMarker = null;
        }
    } finally {
        showLoading(false);
    }
}

function displayRoute(route) {
    const latLngs = route.coordinates.map(coord => [coord[1], coord[0]]);

    routeLayer = L.polyline(latLngs, {
        color: '#0000ff',
        weight: 3,
        opacity: 1,
        lineJoin: 'miter'
    }).addTo(map);

    map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
}

function clearRoute() {
    if (startMarker) {
        map.removeLayer(startMarker);
        startMarker = null;
    }

    if (routeLayer) {
        map.removeLayer(routeLayer);
        routeLayer = null;
    }

    map.setView(romeCoords, 6);
}

function showLoading(show) {
    const loadingDiv = document.getElementById('loading');
    if (show) {
        loadingDiv.classList.remove('hidden');
    } else {
        loadingDiv.classList.add('hidden');
    }
}

function showError(message) {
    alert(`Error: ${message}`);
}

document.addEventListener('DOMContentLoaded', init);
