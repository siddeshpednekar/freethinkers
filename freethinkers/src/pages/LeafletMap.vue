<template>
  <q-page>
    <div class="map-container">
      <div id="map" class="map"></div>
      <div class="overlay">
        <div class="controls-container">
          <div class="toggles-container">
            <div class="marker-toggle">
            <q-toggle
              v-model="showMarkers"
              label="Show Markers"
              class="toggle-button"
              color="dark"
              @update:model-value="updateMarkersVisibility"
            />
            <div v-if="showMarkers" class="filter-container">
              <q-select
                v-model="markerFilter"
                :options="filterOptions"
                label="Status"
                filled
                dense
                class="filter-select"
                emit-value
                @update:model-value="applyMarkerFilter"
              />
            </div>
            </div>
            <q-toggle
              v-model="showHeatmap"
              label="Show Heatmap"
              class="toggle-button"
              color="dark"
              @update:model-value="updateHeatmapVisibility"
            />
          </div>
          <div class="search-container">
            <div class="search-bar">
              <q-select
                v-model="selectedConstituency"
                :options="constituencyOptions"
                label="Select Constituency"
                filled
                dense
                class="search-select small-select"
                emit-value
              />
              <q-btn
                @click="searchByConstituency"
                label="Search"
                class="search-button small-button"
              />
            </div>
          </div>
        </div>
        <div class="details-container">
          <q-card class="details-card constituency-details-card q-pt-sm" v-if="constituencyDetails">
            <q-card-section class="details-card-section">
              <div class="info-panel">
                <div class="info-header">
                  <h6>Constituency Details</h6>
                  <q-btn
                    flat
                    icon="close"
                    @click="clearConstituencyDetails"
                    class="close-button"
                  />
                </div>
                <div class="details-content">
                  <p><strong>Name:</strong> {{ constituencyDetails.name }}</p>
                  <!--<p><strong>Description:</strong> {{ constituencyDetails.description }}</p>-->
                  <p><strong>Number of Issues:</strong> {{ constituencyDetails.issueCount }}</p>
                </div>
              </div>
            </q-card-section>
          </q-card>
          <q-card class="details-card location-details-card q-pt-sm" v-if="displayLocationDetails">
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
                  <p><strong>Constituency:</strong> {{ selectedLocation.constituency }}</p>
                  
                  <q-btn-dropdown color="dark" label="Timeline" @click="showDropdown = !showDropdown" />
                      
                  <q-timeline v-show="showDropdown" color="primary" class="q-mt-md">
                    <q-timeline-entry
                      class="custom-timeline-entry"
                      title="Complaint Received"
                      :subtitle="selectedLocation.ComplaintReceived"
                      icon="report"
                    />
                    <q-timeline-entry
                      class="custom-timeline-entry"
                      title="Assigned To Contractor"
                      :subtitle="selectedLocation.AssignedToContractor ? selectedLocation.AssignedToContractor : 'Pending'"
                      :icon="selectedLocation.AssignedToContractor ? 'check' : 'pending'"
                      :color="selectedLocation.AssignedToContractor ? 'green' : 'grey'"
                    />
                    <q-timeline-entry
                      class="custom-timeline-entry"
                      title="Fixed On"
                      :subtitle="selectedLocation.FixedOn ? selectedLocation.FixedOn : 'Pending'"
                      :icon="selectedLocation.FixedOn ? 'check' : 'pending'"
                      :color="selectedLocation.FixedOn ? 'green' : 'grey'"
                    />
                    <q-timeline-entry
                      class="custom-timeline-entry"
                      title="PWD Verified On"
                      :subtitle="selectedLocation.PWDVerifiedOn ? selectedLocation.PWDVerifiedOn : 'Pending'"
                      :icon="selectedLocation.PWDVerifiedOn ? 'check' : 'pending'"
                      :color="selectedLocation.PWDVerifiedOn ? 'green' : 'grey'"
                    />
                  </q-timeline>
                      
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
import { ref, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
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
const showMarkers = ref(true);
const showHeatmap = ref(true);
const showDropdown = ref(false);
const markerFilter = ref(null);
const pinMarker = ref(null);

const filterOptions = ref([
  { label: 'All', value: null },
  { label: 'Fixed', value: 'fixed' },
  { label: 'Not Fixed', value: 'notFixed' }
]);
const $q = useQuasar();
const route = useRoute();
const potholeId = ref(route.query.id);
console.log(potholeId.value)
const loadMarkers = async () => {
  try {
    const response = await axios.get('/data1.json');
    markers.value = response.data.markers;
    filteredMarkers.value = markers.value;

    const uniqueConstituencies = new Set(
      markers.value.map(marker => marker.properties.constituency)
    );

    constituencyOptions.value = Array.from(uniqueConstituencies).map(constituency => ({
      label: constituency,
      value: constituency
    }));

    constituencyOptions.value.sort((a, b) => a.label.localeCompare(b.label));

    heatmapData.value = markers.value.map(marker => marker.geometry.coordinates.slice().reverse());
  } catch (error) {
    console.error('Error loading markers:', error);
  }
};

const updateMapMarkers = () => {
  if (!map.value) return;

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
        map.value.setView(coordinates.slice().reverse(), 15);
      })
      .on('mouseover', function () {
        this.openPopup();
      })
      .on('mouseout', function () {
        this.closePopup();
      });

    markersCluster.addLayer(leafletMarker);
  });

  if (showMarkers.value) {
    map.value.addLayer(markersCluster);
  }
};

const updateMarkersVisibility = (value) => {
  if (!map.value) return;

  if (value) {
    updateMapMarkers();
  } else {
    map.value.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        map.value.removeLayer(layer);
      }
    });
  }
};

const updateHeatmapVisibility = (value) => {
  if (!map.value) return;

  if (value) {
    L.heatLayer(heatmapData.value, {
      radius: 20,
      blur: 25,
      maxZoom: 15
    }).addTo(map.value);
  } else {
    map.value.eachLayer(layer => {
      if (layer instanceof L.HeatLayer) {
        map.value.removeLayer(layer);
      }
    });
  }
};

const applyMarkerFilter = () => {
  if (!showMarkers.value) return;

  if (markerFilter.value === 'fixed') {
    filteredMarkers.value = markers.value.filter(marker => marker.properties.FixedOn);
  } else if (markerFilter.value === 'notFixed') {
    filteredMarkers.value = markers.value.filter(marker => !marker.properties.FixedOn);
  } else {
    filteredMarkers.value = markers.value;
  }

  updateMapMarkers();
};

const getPopupContent = (properties) => {
  const complaintReceivedTimestamp = new Date(properties.ComplaintReceived).getTime();
  let assignedToContractorDate;

  if (properties.FixedOn) {
    const fixedOnTimestamp = new Date(properties.FixedOn).getTime();
    const randomTimestamp = Math.random() * (fixedOnTimestamp - complaintReceivedTimestamp) + complaintReceivedTimestamp;
    assignedToContractorDate = new Date(randomTimestamp);
  } else {
    assignedToContractorDate = new Date(complaintReceivedTimestamp + 24 * 60 * 60 * 1000);
  }
  properties.AssignedToContractor = assignedToContractorDate.toISOString().split('T')[0];
  return `
    <div>
      <p><strong>ID:</strong> ${properties.id}</p>
      <p><strong>Area:</strong> ${properties.area}</p>
      <p><strong>Fixed On:</strong> ${properties.FixedOn ? properties.FixedOn : '-'}</p>
      <p><strong>Constituency:</strong> ${properties.constituency}</p>
      <p><strong>PWD Verified On:</strong> ${properties.PWDVerifiedOn ? properties.PWDVerifiedOn : '-'}</p>
      <p><strong>Complaint Received:</strong> ${properties.ComplaintReceived}</p>
      <p><strong>Assigned To Contractor:</strong> ${properties.AssignedToContractor ? properties.AssignedToContractor : '-'}</p>
    </div>
  `;
};

const searchByConstituency = () => {
  const constituency = selectedConstituency.value;
  const location = markers.value.find(marker => marker.properties.constituency === constituency);
  displayLocationDetails.value = false;

  if (location) {
    const [lat, lng] = location.geometry.coordinates.slice().reverse();
    map.value.setView([lat, lng], 15);
    selectedLocation.value = location.properties;
    constituencyDetails.value = {
      name: constituency,
      description: "Description for " + constituency,
      issueCount: markers.value.filter(marker => marker.properties.constituency === constituency).length
    };
  } else {
    alert('No matching constituency found.');
    constituencyDetails.value = null;
  }
};

const clearSelection = () => {
  selectedLocation.value = null;
  displayLocationDetails.value = false;
};

const clearConstituencyDetails = () => {
  constituencyDetails.value = null;
};

const popup = () => {
  $q.notify({
    message: "Click and drag to explore the map.",
    position: 'top',
    timeout: 2000,
    color: 'dark',
  });
};
const addOrUpdatePinMarker = (lat, lng, potholeProperties) => {
  if (pinMarker.value) {
    // Update the position of the existing marker
    pinMarker.value.setLatLng([lat, lng]);
    pinMarker.value.setPopupContent(getPopupContent(potholeProperties.properties));
  } else {
    // Create a new marker with custom icon and popup content
    pinMarker.value = L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'custom-icon', // Custom class for the icon
        // html: '<div style="background-color: red; width: 10px; height: 10px; border-radius: 50%;"></div>', // Custom HTML for the icon
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      })
    }).addTo(map.value).bindPopup(getPopupContent(potholeProperties.properties));
    
    // Open the popup immediately after adding the marker
    pinMarker.value.openPopup();
    setInterval(() => {
      pinMarker.value.closePopup();
    }, 2000);
  }
};


const findAndDisplayPothole = () => {
  
  if (!potholeId.value) return;

  const pothole = markers.value.find(marker => marker.properties.id == potholeId.value);
console.log(pothole)
  if (pothole) {
    const [lat, lng] = pothole.geometry.coordinates.slice().reverse();
    map.value.setView([lat, lng], 20);
const potholeProperties = markers.value.find(marker => {if(marker.properties.id == potholeId.value)return marker.properties});
console.log(potholeProperties)
    selectedLocation.value = pothole.properties;

    addOrUpdatePinMarker(lat, lng,potholeProperties);
  } else {
    alert('Pothole not found.');
    displayLocationDetails.value = false;
  }
};

onMounted(() => {
  map.value = L.map('map').setView([15.60056, 73.84358], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map.value);

  loadMarkers().then(() => {
    updateMapMarkers();
    updateHeatmapVisibility(showHeatmap.value);
    popup();
    findAndDisplayPothole();
  });
});

watch(() => showMarkers.value, updateMarkersVisibility);
watch(() => showHeatmap.value, updateHeatmapVisibility);
watch(() => markerFilter.value, applyMarkerFilter);

</script>






<style scoped>

:deep(.q-timeline .q-timeline-entry .q-timeline-entry__title) {
  font-size: 12px;
}

:deep(.q-timeline .q-timeline-entry .q-timeline-entry__subtitle) {
  font-size: 10px;
}


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

.controls-container {
  position: absolute;
  top: 10px;
  right: 20px;
  z-index: 1000;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.2);
  pointer-events: auto;
  display: flex;
  align-items: center;
}

.toggles-container {
  display: flex;
  flex-direction: row; 
  gap: 10px; 
  margin-right: 15px;
}


.search-container {
  display: flex;
  align-items: center; 
  flex-direction: row;
}

.marker-toggle {
  display: flex;
  flex-direction: row;
  gap: 5px;
}

.toggle-button {
  flex-shrink: 0; 
}

.search-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.small-select {
  width: 200px;
}

.small-button {
  flex-shrink: 0;
  padding: 5px 10px;
  background-color: #2a2185;
  color: white;
}

.details-container {
  position: absolute;
  top: 90px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 7px; 
  pointer-events: auto;
}

.details-card {
  background-color: rgba(255, 255, 255, 0.8) !important;
  border-radius: 8px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.2);
  width: 300px;
  max-height: 55vh;
  overflow-y: auto;
}

.details-card-section {
  padding-top: 0;
  padding-bottom: 10px;
}

.info-panel {
  padding: 0px;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.close-button {
  cursor: pointer;
  display: flex;
  align-items: center;
  margin-right: -15px;
}

.details-content {
  margin-top: 3px;
}

.filter-select {
  width: 100px;
}

.q-timeline {
  width: 100%;
}


@media (max-width: 830px) {
  
  .details-card {
    width: 190px;
    display: flex;
    flex-direction: column;
  }

  .details-container {
    margin-top: 90px;
  }
    

  .controls-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .toggles-container {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
  }

  
  .marker-toggle {
    display: flex;
    flex-direction: column;
  }

  .search-container {
    display: flex;
    flex-direction: row;
    margin-left: -35px;
  }

  .filter-select {
    width: 110px;
  }

  .info-header {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
  }
  
}
  

</style>