<template>
  <div class="container">
    <div class="chart top-left">
      <PieChart />
    </div>
    <div class="chart top-right">
      <LineGraph />
    </div>
    <div class="bottom">
      <div class="middle-content">
        <BarChart />
      </div>
      <div class="icons">
        <i class="fas fa-signal"></i>
        <i class="fas fa-chart-bar"></i>
        <i class="fas fa-chart-pie"></i>
      </div>
    </div>
  </div>
</template>

<script>
import BarChart from 'src/components/BarChart.vue';
import PieChart from 'src/components/PieChart.vue';
import LineGraph from 'src/components/LineGraph.vue';

export default {
  components: {
    BarChart,
    PieChart,
    LineGraph,
  },
};
</script>

<style scoped>
.container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto 1fr;
  grid-gap: 16px;
  background:#f5f5f5;
  width: 100vw;
  height: 100vh;
  padding: 20px;
  box-sizing: border-box;
}

.chart {
  background-color: var(--white);
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.top-left {
  grid-area: 1 / 1 / 2 / 2;
}

.top-right {
  grid-area: 1 / 2 / 2 / 3;
}

.bottom {
  grid-area: 2 / 1 / 3 / 3;
  display: grid;
  grid-template-columns: 2fr 1fr;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.middle-content {
  display: flex;
  justify-content: center;
  align-items: center;
}

.icons {
  display: flex;
  gap: 20px;
  justify-content: center;
  align-items: center;
}

.icons i {
  font-size: 24px;
  cursor: pointer;
  color: #333;
  transition: color 0.3s;
}

.icons i:hover {
  color: #2a2185; /* Change this to your preferred hover color */
}

@media (max-width: 768px) {
  .container {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
  }

  .top-left, .top-right, .bottom {
    grid-column: 1 / 2;
  }

  .bottom {
    grid-template-columns: 1fr;
  }
}
</style>
