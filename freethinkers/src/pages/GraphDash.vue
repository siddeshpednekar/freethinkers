<template>
  <q-page padding>
    <div class="container">
      <div class="button-container">
        <q-btn
          v-for="i in 4"
          :key="i"
          :label="'Flowmeter ' + i"
          @click="showFlowmeter(i)"
          class="flowmeter-button"
          
          flat
        />
      </div>
      <div class="dashboard-content">
        <transition name="fade" mode="out-in">
          <component :is="currentFlowmeterComponent" />
        </transition>
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
    FlowMeter4,
  },
  data() {
    return {
      currentFlowmeter: 1,
    };
  },
  computed: {
    currentFlowmeterComponent() {
      return `FlowMeter${this.currentFlowmeter}`;
    },
  },
  methods: {
    showFlowmeter(flowmeterNumber) {
      this.currentFlowmeter = flowmeterNumber;
    },
  },
};
</script>
<style scoped>
.q-page{
  background-color: #f5f5f5;
}

.container {
  display: grid;
  /* width: 700px; */
  width: 100%;
  /* grid-template-columns: 250px 250px 250px 250px; */
  grid-gap: 30px;
  height: 100vh;
  /* padding: 30px; */
  background-color: #f5f5f5;
  border-radius: 8px;
  /* box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1); */
}

.buttons-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.05);
}

.flowmeter-button {
  width: 300px;
  margin: 1rem ;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  background-color: #282185;
  color: white;
  border-radius:10px ;
}
.flowmeter-button:hover {
    transform: scale(1.05) ;
}


.dashboard-content {
  /* background-color: red; */
  width: 1400px;
  display: flex;
  flex-direction: column;
  /* gap: 25px; */
  padding-left: 25px;
  background-color: #f5f5f5;
  /* padding: 20px; */
  border-radius: 8px;
  /* box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.05); */
}

/* Transition styles */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.button-container{
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .container {
    grid-template-columns: 1fr;
    padding: 20px;
  }

  .buttons-container {
    flex-direction: row;
    justify-content: space-between;
    gap: 10px;
    padding: 15px;
  }

  .dashboard-content {
    padding-left: 0;
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .buttons-container {
    flex-direction: column;
    gap: 10px;
  }

  .dashboard-content {
    gap: 15px;
  }
}
</style>
