<template>
  <q-page padding>
      <div class="dashboard-container">
          <!-- Conditional rendering: show all graphs or a single zoomed-in graph -->
          <div v-if="!zoomedIn">
              <div class="row">
                  <div class="col-6">
                      <div class="graph-container">
                          <iframe src="http://localhost:3000/d-solo/cdtzkeuurnoqoc/flowmeter1?orgId=1&from=1683492212138&to=1684132683830&panelId=19" width="100%" height="200" frameborder="0">
                          </iframe>
                      </div>
                      <div class="graph-container">
                          <iframe src="http://localhost:3000/d-solo/cdtzkeuurnoqoc/flowmeter1?orgId=1&from=1683492212138&to=1684132683830&panelId=20" width="100%" height="200" frameborder="0">
                          </iframe>
                      </div>
                  </div>
                  <div class="col-6">
                      <div class="graph-container">
                          <iframe src="http://localhost:3000/d-solo/cdtzkeuurnoqoc/flowmeter1?orgId=1&from=1683492212138&to=1684132683830&panelId=21" width="100%" height="200" frameborder="0">
                          </iframe>
                          <q-icon name="zoom_out_map" class="zoom-icon" @click="zoomIn('iframe3')" />
                      </div>
                  </div>
              </div>
          </div>
  
          <!-- Bar Chart -->
          <div class="chart-container" :class="{ 'zoomed': zoomedIn === 'barChart' }">
              <div class="bar-chart-container" ref="barChartContainer"></div>
              <q-icon :name="zoomedIn === 'barChart' ? 'zoom_in_map' : 'zoom_out_map'" class="chart-zoom-icon" @click="toggleZoomBarChart" />
              <q-btn v-if="zoomedIn === 'barChart'" icon="arrow_back" class="back-button" @click="zoomOut" />
          </div>
          <div v-if="zoomedIn === 'iframe3'" class="zoomed">
              <iframe src="http://localhost:3000/d-solo/cdtzkeuurnoqoc/flowmeter1?orgId=1&from=1683492212138&to=1684132683830&panelId=21" width="100%" height="100%" frameborder="0">
              </iframe>
              <q-btn icon="arrow_back" class="back-button" @click="zoomOut" />
              
          </div>
      </div>
  </q-page>
  </template>
  
<script>
import * as echarts from 'echarts';

export default {
    name: 'FlowMeter1',
    data() {
        return {
            zoomedIn: null,
            data: [],
            categories: [],
            originalChartSize: {
                width: '100%',
                height: '400px'
            }, // Store the original size
        };
    },
    mounted() {
        this.loadData();
    },
    methods: {
        zoomIn(graph) {
            this.zoomedIn = graph;
            if (graph === 'barChart') {
                this.createBarChart(true);
            }
        },
        zoomOut() {
            if (this.zoomedIn === 'barChart') {
                this.createBarChart(false); // Restore original size
            }
            this.zoomedIn = null;
        },
        toggleZoomBarChart() {
            if (this.zoomedIn === 'barChart') {
                this.zoomOut();
            } else {
                this.zoomIn('barChart');
            }
        },
        loadData() {
            fetch('/src/assets/data.json')
                .then(response => response.json())
                .then(data => {
                    this.data = data.map(d => +d['field6']);
                    this.categories = data.map(d => d['Flowmeter 3']);
                    this.createBarChart(false);
                });
        },
        createBarChart(isZoomed) {
    const chartContainer = this.$refs.barChartContainer;
    const chart = echarts.init(chartContainer);

    // Define the month you want to zoom in on
    const targetMonth = 5; // May

    // Find the indices for the first and second day of the target month
    let startIndex = -1;
    let endIndex = -1;
    this.categories.forEach((date, index) => {
        const [day, month] = date.split('-').map(Number);
        if (month === targetMonth) {
            if (startIndex === -1) startIndex = index; // First occurrence
            if (day === 2) endIndex = index; // Second day
        }
    });

    // Calculate zoom range
    const startZoom = startIndex / this.categories.length * 100;
    const endZoom = (endIndex + 1) / this.categories.length * 100;

    const option = {
        xAxis: {
            type: 'category',
            data: this.categories,
            axisLabel: {
                rotate: 45, // Rotate the labels if they are too long
                formatter: (value) => value.split(' ')[0], // Display only the date part
            },
        },
        yAxis: {
            type: 'value',
        },
        series: [{
            data: this.data,
            type: 'bar',
            showBackground: true,
            itemStyle: {
                borderRadius: 5,
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#83bff6' },
                    { offset: 0.5, color: '#188df0' },
                    { offset: 1, color: '#188df0' },
                ]),
            },
            backgroundStyle: {
                color: 'rgba(180, 180, 180, 0.2)',
            },
            emphasis: {
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#2378f7' },
                        { offset: 0.7, color: '#2378f7' },
                        { offset: 1, color: '#83bff6' },
                    ]),
                },
            },
            animationDelay: (idx) => idx * 50, // Increase delay for smoothness
            animationDuration: 1500, // Duration of each bar animation (in milliseconds)
            animationEasing: 'elasticOut', // Elastic easing function for bounce effect
        }],
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow',
            },
        },
        dataZoom: [{
                type: 'slider',
                xAxisIndex: 0,
                orient: 'vertical', // Set orientation to vertical
                start: startZoom,
                end: endZoom,
                backgroundColor: 'rgba(47, 69, 84, 0)',
                fillerColor: 'rgba(47, 69, 84, 0.25)',
                borderColor: 'blue',
                right: 20, // Adjust the position to the right
                width: 30, // Set the width of the slider
                handleStyle: {
                    color: 'blue',
                    borderColor: 'blue',
                },
                textStyle: {
                    color: 'blue',
                },
            },
            {
                type: 'inside',
                xAxisIndex: 0,
                start: startZoom,
                end: endZoom,
            },
        ],
        animation: true, // Enable overall animation for the chart
        animationDuration: 2000, // Duration of the whole chart animation (in milliseconds)
        animationEasing: 'elasticOut', // Smooth easing function for the whole animation
    };

    chart.setOption(option);

    const zoomSize = 12;
    chart.on('click', (params) => {
        const startValue = this.categories[Math.max(params.dataIndex - zoomSize / 2, 0)];
        const endValue = this.categories[Math.min(params.dataIndex + zoomSize / 2, this.data.length - 1)];

        chart.dispatchAction({
            type: 'dataZoom',
            startValue: startValue,
            endValue: endValue,
        });
    });

    // Adjust size based on zoomed state
    if (isZoomed) {
        chartContainer.style.width = '110vw';
        chartContainer.style.height = '95vh';
    } else {
        chartContainer.style.width = '80vw';
        chartContainer.style.height = '60vh';
    }

    chart.resize();
}


    },
};
</script>

<style scoped>
/* Base Styles for the Page */
html,
body,
#q-app,
.q-page {
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
    font-family: 'Roboto', sans-serif;
    color: #333;
}
/* Column Definitions */
.col-6,
.col-12 {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
}

.col-6 {
    max-width: 50%; /* Ensure columns don't exceed 50% */
    padding: 0 8px; /* Optional: Adjust padding as needed */
}

/* Container for each graph */
.graph-container {
    position: relative;
    background-color: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
    width: 100%; /* Ensure graph container fills the column */
    height: auto;
}


/* Main Container */
.dashboard-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    height: 100%;
    width: 100%;
    box-sizing: border-box;
    background-color: #f7f9fc;
    /* Light background for a clean look */
}

/* Row for Graphs */
.row {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 16px;
    width: 100%;
}

/* Column Definitions */
.col-6,
.col-12 {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
}

.col-6 {
    max-width: calc(50% - 16px);
    /* Two columns with space in between */
}

.col-12 {
    max-width: 100%;
}

/* Container for each graph */
.graph-container {
    position: relative;
    background-color: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
    width: 100%;
    height: auto;
}

/* Icon for Zooming */
.zoom-icon {
    position: absolute;
    top: 8px;
    right: 8px;
    font-size: 24px;
    color: #007bff;
    cursor: pointer;
}

/* Bar Chart Container */
.chart-container {
    position: relative;
    background-color: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    width: 100%;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
}

.bar-chart-container {
    width: 100%;
    height: 400px;
}

/* Styling for the zoomed chart */
.zoomed {
    width: 100vw;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    background-color: #ffffff;
    z-index: 1000;
    padding: 32px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 1s ease-in-out;
}

/* Zoom Icon for Charts */
.chart-zoom-icon {
    position: absolute;
    top: 16px;
    right: 16px;
    font-size: 24px;
    color: #007bff;
    cursor: pointer;
}

/* Back Button Styling */
.back-button {
    position: absolute;
    top: 16px;
    left: 16px;
    background-color: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
    padding: 8px 16px;
}
</style>
