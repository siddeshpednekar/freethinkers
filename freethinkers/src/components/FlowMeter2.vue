<template>
  <q-page padding>
    <div class="dashboard-container">
      <!-- Conditional rendering: show all graphs or a single zoomed-in graph -->
      <div v-if="!zoomedIn">
        <div class="row">
          <div class="col-6">
            <div class="graph-container">
              <iframe 
                src="http://localhost:3000/d-solo/cdtzkeuurnoqoc/flowmeter1?orgId=1&from=1683492212138&to=1684132683830&panelId=18" 
                width="450" 
                height="200" 
                frameborder="0">
              </iframe>
              <q-icon 
                name="zoom_in" 
                class="zoom-icon"
                @click="zoomIn('iframe1')" />
            </div>
            <div class="graph-container">
              <iframe 
                src="http://localhost:3000/d-solo/cdtzkeuurnoqoc/flowmeter1?orgId=1&from=1683492212138&to=1684132683830&panelId=13" 
                width="450" 
                height="200" 
                frameborder="0">
              </iframe>
              <q-icon 
                name="zoom_in" 
                class="zoom-icon"
                @click="zoomIn('iframe2')" />
            </div>
          </div>
          <div class="col-6">
            <div class="graph-container">
              <iframe 
                src="http://localhost:3000/d-solo/cdtzkeuurnoqoc/flowmeter1?orgId=1&from=1683492212138&to=1684132683830&panelId=17" 
                width="450" 
                height="200" 
                frameborder="0">
              </iframe>
              <q-icon 
                name="zoom_in" 
                class="zoom-icon"
                @click="zoomIn('iframe3')" />
            </div>
          </div>
        </div>

        <!-- Bar chart row with zoom icon -->
        <div class="row">
          <div class="col-12">
            <div class="graph-container bar-chart-container">
              <BarChart2 ref="BarChart2" />
              <q-icon 
                name="zoom_in" 
                class="zoom-icon"
                @click="zoomIn('BarChart2')" />
            </div>
          </div>
        </div>
      </div>

      <!-- Zoomed-in view -->
      <div v-if="zoomedIn === 'BarChart2'" class="zoomed">
        <BarChart2/>
        <q-btn icon="arrow_back" class="back-button" @click="zoomOut" />
      </div>
      <div v-if="zoomedIn === 'iframe1'" class="zoomed">
        <iframe 
          src="http://localhost:3000/d-solo/cdtzkeuurnoqoc/flowmeter1?orgId=1&from=1683492212138&to=1684132683830&panelId=18" 
          width="100%" 
          height="100%" 
          frameborder="0">
        </iframe>
        <q-btn icon="arrow_back" class="back-button" @click="zoomOut" />
      </div>
      <div v-if="zoomedIn === 'iframe2'" class="zoomed">
        <iframe 
          src="http://localhost:3000/d-solo/cdtzkeuurnoqoc/flowmeter1?orgId=1&from=1683492212138&to=1684132683830&panelId=13" 
          width="100%" 
          height="100%" 
          frameborder="0">
        </iframe>
        <q-btn icon="arrow_back" class="back-button" @click="zoomOut" />
      </div>
      <div v-if="zoomedIn === 'iframe3'" class="zoomed">
        <iframe 
          src="http://localhost:3000/d-solo/cdtzkeuurnoqoc/flowmeter1?orgId=1&from=1683492212138&to=1684132683830&panelId=17" 
          width="100%" 
          height="100%" 
          frameborder="0">
        </iframe>
        <q-btn icon="arrow_back" class="back-button" @click="zoomOut" />
      </div>
    </div>
  </q-page>
</template>

<script>
import BarChart2 from 'src/components/BarChart2.vue';

export default {
  name: 'FlowMeter1',
  data() {
    return {
      zoomedIn: null, // Track which graph is zoomed in
    };
  },
  components: {
    BarChart2,
  },
  methods: {
    zoomIn(graph) {
      this.zoomedIn = graph; // Set the zoomed-in graph
    },
    zoomOut() {
      this.zoomedIn = null; // Reset to show all graphs
    },
  },
};
</script>

<style>
html, body, #q-app, .q-page {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
}

.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  width: 100%;
}

.row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
}

.col-6, .col-12 {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
}

.col-6 {
  max-width: calc(50% - 16px); /* Two columns with space in between */
}

.col-12 {
  max-width: 100%; /* Full-width column */
}

/* Container for graph and zoom icon */
.graph-container {
  position: relative;
  width: 100%;
}

/* Increased width of the bar chart */
.bar-chart-container {
  max-width: calc(100% + 300px); /* Increase the width by 300px */
}

iframe {
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Zoom icon styling */
.zoom-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  padding: 4px;
  cursor: pointer;
}

/* Style for zoomed-in content */
.zoomed {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: white;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.3s ease;
  transform: scale(1);
}

/* Back button styling */
.back-button {
  position: absolute;
  top: 16px;
  left: 16px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  cursor: pointer;
}
</style>