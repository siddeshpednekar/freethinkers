<template>
  <q-page padding>
    <div class="container">
      <div class="buttons-container">
        <q-btn label="Flowmeter 1" @click="showFlowmeter(1)" class="flowmeter-button" />
        <q-btn label="Flowmeter 2" @click="showFlowmeter(2)" class="flowmeter-button" />
        <q-btn label="Flowmeter 3" @click="showFlowmeter(3)" class="flowmeter-button" />
        <q-btn label="Flowmeter 4" @click="showFlowmeter(4)" class="flowmeter-button" />
      </div>
      <div class="dashboard-content">
        <FlowMeter1 v-if="currentFlowmeter === 1" />
        <FlowMeter2 v-if="currentFlowmeter === 2" />
        <FlowMeter3 v-if="currentFlowmeter === 3" />
        <FlowMeter4 v-if="currentFlowmeter === 4" />

        <!-- Add components for Flowmeter 2, 3, 4 here and conditionally render them -->
      </div>
    </div>
  </q-page>
</template>

<script>
import FlowMeter1 from '../components/FlowMeter1.vue';
import FlowMeter2 from '../components/FlowMeter2.vue';
import FlowMeter3 from '../components/FlowMeter3.vue';
import FlowMeter4 from '../components/FlowMeter4.vue';

export default {
  components: {
    FlowMeter1,
    FlowMeter2,
    FlowMeter3,
    FlowMeter4
    // Import other Flowmeter components here
  },
  data() {
    return {
      currentFlowmeter: 1
    };
  },
  methods: {
    showFlowmeter(flowmeterNumber) {
      this.currentFlowmeter = flowmeterNumber;
    }
  }
};
</script>

<style>
.container {
  display: grid;
  grid-template-columns: 200px 1fr; /* Fixed width for buttons, flexible width for content */
  grid-template-rows: 1fr;
  height: 100vh;
  padding: 5%;
  padding-right: 20px;
  width: 100%;
  background-color: rgb(255, 254, 254);
}

.buttons-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.flowmeter-button {
  width: 100%;
}

.dashboard-content {
  display: grid;
  width: 2000px;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  grid-column-gap: 5px;
  grid-row-gap: 6px;
  padding-left: 20px;
}
</style>