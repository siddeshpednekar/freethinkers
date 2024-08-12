<template>
    <q-page>
      <div id="map" style="height: 500px;"></div>
    </q-page>
  </template>
  
  <script>
  import { onMounted, ref } from 'vue';
  import L from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  
  export default {
    name: 'FlowmeterMap',
    setup() {
      const map = ref(null);
      const flowMeterData = ref([]); // Store the flowmeter data
  
      // Define a color palette for the pipelines
      const colorPalette = {
        '1': '#FF5733', // Red for pipelines starting with 1
        '2': '#FFFF33', // Yellow for pipelines starting with 2
        '3': '#33FF57', // Green for pipelines starting with 3
        '4': '#33A1FF', // Blue for pipelines starting with 4
        // Add more colors if needed
      };
  
      const initializeMap = () => {
        map.value = L.map('map').setView([15.5524, 73.7961], 12);
  
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map.value);
  
        const coordinates = {};
        const lines = {};
  
        // Process the flowmeter data
        flowMeterData.value.forEach((meter) => {
          if (meter.coordinates) {
            const { latitude, longitude } = meter.coordinates;
            const position = meter.position;
            coordinates[position] = [latitude, longitude];
  
            // Add a marker for each flowmeter
            const marker = L.marker([latitude, longitude]).addTo(map.value);
            marker.bindPopup(`<b>${meter.name}</b><br>Location: ${meter.location}<br>Position: ${meter.position}`);
  
            // Draw lines for bifurcations
            const parentPosition = position.split('.').slice(0, -1).join('.');
            if (parentPosition) {
              if (coordinates[parentPosition]) {
                const parentCoordinates = coordinates[parentPosition];
                const rootPosition = position.split('.')[0];
                const lineColor = colorPalette[rootPosition] || '#000000'; // Default to black if no color is assigned
  
                const polyline = L.polyline([parentCoordinates, [latitude, longitude]], { color: lineColor }).addTo(map.value);
  
                // Create a label for the line, initially hidden
                const label = L.divIcon({
                  className: 'line-label',
                  html: `<div style="background-color: ${lineColor}; padding: 2px 5px; border-radius: 3px; color: white; font-size: 12px;">${parentPosition} → ${position}</div>`,
                  iconSize: [100, 40],
                });
  
                const labelMarker = L.marker([
                  (parentCoordinates[0] + latitude) / 2,
                  (parentCoordinates[1] + longitude) / 2
                ], {
                  icon: label,
                  opacity: 0 // Initially hide the label
                }).addTo(map.value);
  
                // Show the label on mouseover and hide on mouseout
                polyline.on('mouseover', () => {
                  labelMarker.setOpacity(1);
                });
  
                polyline.on('mouseout', () => {
                  labelMarker.setOpacity(0);
                });
              } else {
                console.warn(`Parent position not found in coordinates: ${parentPosition}`);
              }
            }
          } else {
            console.warn(`No coordinates found for: ${meter.name}`);
          }
        });
      };
  
      onMounted(async () => {
        try {
          // Fetch the data from the fm.json file
          const response = await fetch('/fm.json');
          flowMeterData.value = await response.json();
  
          // Initialize the map and draw markers and lines
          initializeMap();
        } catch (error) {
          console.error('Error fetching or processing fm.json:', error);
        }
      });
  
      return {};
    }
  };
  </script>
  
  <style>
  /* Style for line labels */
  .line-label {
    font-size: 12px;
    padding: 2px 5px;
    border-radius: 3px;
    color: black;
    background-color: transparent; /* Set to transparent as the color is defined inline */
  }
  </style>
  