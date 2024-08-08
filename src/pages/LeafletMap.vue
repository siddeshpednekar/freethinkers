<template>
  <q-page>
    <div class="map-container">
      <div id="map" class="map"></div>
      <div class="overlay">
        <div class="search-container">
          <div class="search-bar">
            <q-select
              v-model="selectedConstituency"
              :options="constituencyOptions"
              label="Select Constituency"
              filled
              dense
              class="search-select"
              emit-value
            />
            <q-btn
              @click="searchByConstituency"
              label="Search"
              class="search-button"
            />
          </div>
        </div>
        <div class="details-container">
          <q-card class="details-card constituency-details-card" v-if="constituencyDetails">
            <q-card-section class="details-card-section">
              <div class="constituency-details">
                <h6>Constituency Details</h6>
                <p><strong>Name:</strong> {{ constituencyDetails.name }}</p>
                <p><strong>Description:</strong> {{ constituencyDetails.description }}</p>
                <p><strong>Number of Issues:</strong> {{ constituencyDetails.issueCount }}</p>
              </div>
            </q-card-section>
          </q-card>
          <q-card class="details-card location-details-card" v-if="displayLocationDetails">
            <q-card-section class="details-card-section">
              <div class="info-panel">
                <div class="info-header">
                  <h6>Location Details</h6>
                  <q-btn
                    flat
                    icon="close"
                    @click="clearSelection"
                    class="close-button"
                  />
                </div>
                <div class="details-content">
                  <p><strong>ID:</strong> {{ selectedLocation.id }}</p>
                  <p><strong>Area:</strong> {{ selectedLocation.area }}</p>
                  <p><strong>Fixed On:</strong> {{ selectedLocation.FixedOn }}</p>
                  <p><strong>Constituency:</strong> {{ selectedLocation.constituency }}</p>
                  <p><strong>PWD Verified On:</strong> {{ selectedLocation.PWDVerifiedOn }}</p>
                  <p><strong>Complaint Received:</strong> {{ selectedLocation.ComplaintReceived }}</p>
                  <p><strong>Assigned To Contractor:</strong> {{ selectedLocation.AssignedToContractor ? selectedLocation.AssignedToContractor : 'N/A' }}</p>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>











<script setup>
import { ref, onMounted } from 'vue';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import * as L from 'leaflet';
import 'leaflet-gesture-handling';
import 'leaflet-gesture-handling/dist/leaflet-gesture-handling.css';
import 'leaflet.heat';
import 'leaflet.markercluster';
import axios from 'axios';

const map = ref(null);
const markers = ref([]);
const heatmapData = ref([]);
const filteredMarkers = ref([]);
const selectedLocation = ref(null);
const displayLocationDetails = ref(false);
const selectedConstituency = ref(null);
const constituencyOptions = ref([]);
const constituencyDetails = ref(null);


const loadMarkers = async () => {
  try {
    const response = await axios.get('/Data.json');
    markers.value = response.data.markers;
    filteredMarkers.value = markers.value; // Initialize filtered markers

    // Extract unique constituencies
    const uniqueConstituencies = new Set(
      markers.value.map(marker => marker.properties.constituency)
    );

    // Populate constituency options
    constituencyOptions.value = Array.from(uniqueConstituencies).map(constituency => ({
      label: constituency,
      value: constituency
    }));

    // Prepare heatmap data from markers
    heatmapData.value = markers.value.map(marker => marker.geometry.coordinates.slice().reverse()); // reverse to [lat, lng]
  } catch (error) {
    console.error('Error loading markers:', error);
  }
};

const updateMapMarkers = () => {
  if (!map.value) return;

  // Remove existing markers from the map
  map.value.eachLayer(layer => {
    if (layer instanceof L.Marker) {
      map.value.removeLayer(layer);
    }
  });

  const markersCluster = L.markerClusterGroup();

  filteredMarkers.value.forEach(marker => {
    const { coordinates } = marker.geometry;
    const { properties } = marker;

    const leafletMarker = L.marker(coordinates.slice().reverse()).addTo(map.value)
      .bindPopup(getPopupContent(properties))
      .on('click', () => {
        selectedLocation.value = properties;
        displayLocationDetails.value = true;
        console.log(properties);
        map.value.setView(coordinates.slice().reverse(), 15); // Center map on marker
      })
      .on('mouseover', function () {
        this.openPopup();
      })
      .on('mouseout', function () {
        this.closePopup();
      });

    markersCluster.addLayer(leafletMarker);
  });

  map.value.addLayer(markersCluster);
};

const getPopupContent = (properties) => {
  return `
    <div>
      <p><strong>ID:</strong> ${properties.id}</p>
      <p><strong>Area:</strong> ${properties.area}</p>
      <p><strong>Fixed On:</strong> ${properties.FixedOn}</p>
      <p><strong>Constituency:</strong> ${properties.constituency}</p>
      <p><strong>PWD Verified On:</strong> ${properties.PWDVerifiedOn}</p>
      <p><strong>Complaint Received:</strong> ${properties.ComplaintReceived}</p>
      <p><strong>Assigned To Contractor:</strong> ${properties.AssignedToContractor ? properties.AssignedToContractor : 'N/A'}</p>
    </div>
  `;
};

const searchByConstituency = () => {
  const constituency = selectedConstituency.value;
  const location = markers.value.find(marker => marker.properties.constituency === constituency);
  displayLocationDetails.value = false;

  if (location) {
    const [lat, lng] = location.geometry.coordinates.slice().reverse();
    map.value.setView([lat, lng], 15); // Zoom to the location
    selectedLocation.value = location.properties; // Update selected location
    constituencyDetails.value = {
      name: constituency,
      description: "Description for " + constituency, // Placeholder for actual description
      issueCount: markers.value.filter(marker => marker.properties.constituency === constituency).length
    };
  } else {
    alert('No matching constituency found.');
    constituencyDetails.value = null; // Clear details if no match
  }
};

const clearSelection = () => {
  selectedLocation.value = null;
  displayLocationDetails.value = false;
};

onMounted(() => {
  map.value = L.map('map').setView([15.60056, 73.84358], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map.value);

  loadMarkers().then(() => {
    // Initially display all markers
    updateMapMarkers();

    // Add heatmap layer with adjusted options
    L.heatLayer(heatmapData.value, {
      radius: 20, // Adjusted radius for the heat points
      blur: 25,   // Adjusted blur for the heat points
      maxZoom: 15 // Adjusted max zoom level where heat will be visible
    }).addTo(map.value);
  });
});
</script>




<style scoped>
.map-container {
  position: relative;
  height: 100vh;
  margin: 0;
}

.map {
  width: 100%;
  height: 100%;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.search-container {
  position: absolute;
  width: 80%;
  top: 20px;
  left: 10%;
  z-index: 1000;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.2);
  pointer-events: auto;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-select {
  flex: 1;
  background-color: #fff;
}

.search-button {
  flex-shrink: 0;
  background-color: #2a2185;
  color: white;
}

.details-container {
  position: absolute;
  top: 120px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px; /* Decreased gap between details boxes */
  pointer-events: auto;
}

.details-card {
  background-color: rgba(255, 255, 255, 0.8) !important;
  border-radius: 8px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.2);
  width: 300px;
  max-height: 80vh;
  overflow-y: auto;
}


.details-card-section {
  padding-top: 0;
}
  


.info-panel {
  padding: 0px;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-button {
  cursor: pointer;
  display: flex;
  align-items: center;
}

.details-content {
  margin-top: 10px;
}
</style>








