<template>
  <q-page>
    <div class="controls">
      <q-select
        v-model="selectedPipeline"
        :options="pipelineOptions"
        label="Select Pipeline"
        outlined
        dense
        @update:model-value="filterPipelines"
      />
    </div>
    <div id="map" class="map-container"></div>
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
    const flowMeterData = ref([]);
    const pipelineOptions = ref(['All']); // Include "All" as the first option
    const selectedPipeline = ref('All'); // Default to "All" option
    const markers = ref([]);
    const polylines = ref([]);

    const colorPalette = {
      '1': '#FF5733', 
      '2': '#FFFF33', 
      '3': '#33FF57', 
      '4': '#33A1FF',
      '5': '#113750',
      '6': '#b9166d',
      '7': '#1685b9',
      '8': '#ccc000',
      '9': '#ffffff', 
    };

    const initializeMap = () => {
      map.value = L.map('map').setView([15.5524, 73.7961], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map.value);
    };

    const addMarkersAndLines = () => {
      const coordinates = {};

      flowMeterData.value.forEach((meter) => {
        if (meter.coordinates) {
          const { latitude, longitude } = meter.coordinates;
          const position = meter.position;
          const rootPosition = position.split('.')[0];

          if (!pipelineOptions.value.includes(rootPosition)) {
            pipelineOptions.value.push(rootPosition);
          }

          coordinates[position] = [latitude, longitude];

          const marker = L.marker([latitude, longitude]);
          marker.bindPopup(
            `<b>${meter.name}</b><br>Location: ${meter.location}<br>Position: ${meter.position}`
          );
          markers.value.push({ marker, rootPosition });

          const parentPosition = position.split('.').slice(0, -1).join('.');
          if (parentPosition && coordinates[parentPosition]) {
            const parentCoordinates = coordinates[parentPosition];
            const lineColor = colorPalette[rootPosition] || '#000000';

            const polyline = L.polyline(
              [parentCoordinates, [latitude, longitude]],
              { color: lineColor, weight: 4, dashArray: '5, 10' }
            );
            polylines.value.push({ polyline, rootPosition });
          }
        }
      });

      filterPipelines(); // Apply the filter initially
    };

    const filterPipelines = () => {
      markers.value.forEach(({ marker }) => marker.removeFrom(map.value));
      polylines.value.forEach(({ polyline }) => polyline.removeFrom(map.value));

      markers.value.forEach(({ marker, rootPosition }) => {
        if (selectedPipeline.value === 'All' || selectedPipeline.value === rootPosition) {
          marker.addTo(map.value);
        }
      });

      polylines.value.forEach(({ polyline, rootPosition }) => {
        if (selectedPipeline.value === 'All' || selectedPipeline.value === rootPosition) {
          polyline.addTo(map.value);
        }
      });
    };

    onMounted(async () => {
      try {
        const response = await fetch('/fm.json');
        flowMeterData.value = await response.json();
        initializeMap();
        addMarkersAndLines();
      } catch (error) {
        console.error('Error fetching or processing fm.json:', error);
      }
    });

    return {
      selectedPipeline,
      pipelineOptions,
      filterPipelines,
    };
  },
};
</script>

<style>
.map-container {
  height: 100vh;
  width: 100%;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.line-label div {
  padding: 5px 10px;
  border-radius: 5px;
  color: white;
  font-weight: bold;
  font-size: 14px;
  background-color: rgba(0, 0, 0, 0.7);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
  color: #1685b9;
}

.controls {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  width: 100px;
}

.q-select {
  background-color: white;
  border-radius: 5px;
}
</style>
