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
      </div>
    </div>
  </q-page>
</template>

<script>
import FlowMeter1 from 'src/components/FlowMeter1.vue';
import FlowMeter2 from 'src/components/FlowMeter2.vue';
import FlowMeter3 from 'src/components/FlowMeter3.vue';
import FlowMeter4 from 'src/components/FlowMeter4.vue';

export default {
  components: {
    FlowMeter1,
    FlowMeter2,
    FlowMeter3,
    FlowMeter4
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

<style scoped>
.container {
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-gap: 20px;
  height: 100vh;
  padding: 20px;
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
  display: flex;
  /* width: 10000px; */
  flex-direction: column;
  gap: 20px;
  padding-left: 20px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .container {
    grid-template-columns: 1fr;
    padding: 10px;
  }

  .buttons-container {
    flex-direction: row;
    justify-content: space-around;
    gap: 5px;
  }

  .dashboard-content {
    padding-left: 0;
  }
}

@media (max-width: 480px) {
  .buttons-container {
    flex-direction: column;
    gap: 5px;
  }

  .dashboard-content {
    gap: 10px;
  }
}
</style>
