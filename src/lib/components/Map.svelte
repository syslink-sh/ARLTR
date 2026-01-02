<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import type { Map as LeafletMap, Polyline, Marker } from "leaflet";
    import { ROME, MAP_CONFIG } from "$lib/config";

    let { onMapClick, routeData = null } = $props();

    let mapElement: HTMLElement;
    let map: LeafletMap;
    let startMarker: Marker | null = null;
    let romeMarker: Marker | null = null;
    let routeLayer: Polyline | null = null;
    let L: any;

    onMount(async () => {
        L = (await import("leaflet")).default;

        map = L.map(mapElement, {
            zoomControl: false,
            attributionControl: false,
        }).setView([ROME.lat, ROME.lng], MAP_CONFIG.defaultZoom);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: MAP_CONFIG.maxZoom,
        }).addTo(map);

        L.control
            .zoom({
                position: "bottomright",
            })
            .addTo(map);

        const romeIcon = L.icon({
            iconUrl:
                "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png",
            shadowUrl:
                "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
        });

        romeMarker = L.marker([ROME.lat, ROME.lng], { icon: romeIcon })
            .addTo(map)
            .bindPopup(`<strong>${ROME.displayName}</strong>`);

        map.on("click", (e: any) => {
            const { lat, lng } = e.latlng;
            updateStartMarker(lat, lng);
            onMapClick({ lat, lng });
        });

        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 100);
    });

    function updateStartMarker(lat: number, lng: number) {
        if (startMarker) {
            map.removeLayer(startMarker);
        }

        const startIcon = L.icon({
            iconUrl:
                "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
            shadowUrl:
                "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
        });

        startMarker = L.marker([lat, lng], { icon: startIcon })
            .addTo(map)
            .bindPopup("<strong>Starting Point</strong>")
            .openPopup();

        if (map) map.invalidateSize();
    }

    $effect(() => {
        if (routeData && map && L) {
            if (routeLayer) {
                map.removeLayer(routeLayer);
            }

            const latLngs = routeData.coordinates.map(
                (coord: [number, number]) => [coord[1], coord[0]],
            );

            routeLayer = L.polyline(latLngs, {
                color: "#475569",
                weight: 4,
                opacity: 1,
                lineJoin: "round",
            }).addTo(map);

            if (routeLayer) {
                map.fitBounds(routeLayer.getBounds(), {
                    padding: [40, 40],
                    animate: true,
                });
            }
            map.invalidateSize();
        } else if (!routeData && routeLayer && map) {
            map.removeLayer(routeLayer);
            routeLayer = null;
            if (startMarker) {
                map.removeLayer(startMarker);
                startMarker = null;
            }
            map.setView([ROME.lat, ROME.lng], MAP_CONFIG.defaultZoom, {
                animate: true,
            });
            map.invalidateSize();
        }
    });

    onDestroy(() => {
        if (map) {
            map.remove();
        }
    });
</script>

<div bind:this={mapElement} class="h-full w-full z-0 outline-none"></div>

<style>
    @reference "../../app.css";
    :global(.leaflet-popup-content-wrapper) {
        @apply bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.1)];
    }
    :global(.leaflet-popup-tip) {
        @apply bg-white dark:bg-[#1E293B] border-[#CBD5E1] dark:border-[#334155];
    }
    :global(.leaflet-control-zoom-in, .leaflet-control-zoom-out) {
        @apply !bg-white dark:!bg-[#1E293B] !border !border-[#CBD5E1] dark:!border-[#334155] !text-[#1E293B] dark:!text-[#F8FAFC] !flex !items-center !justify-center !transition-colors !rounded-none;
    }
    :global(.leaflet-control-zoom) {
        @apply !border-none !shadow-[0_2px_4px_rgba(0,0,0,0.05)] !rounded-[10px] !overflow-hidden;
    }
    :global(.leaflet-control-zoom-in:hover, .leaflet-control-zoom-out:hover) {
        @apply !bg-[#F8FAFC] dark:!bg-[#334155];
    }
</style>
