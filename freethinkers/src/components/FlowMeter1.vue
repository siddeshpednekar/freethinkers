<template>
<q-page padding>
    <div class="dashboard-container">
        <!-- Conditional rendering: show all graphs or a single zoomed-in graph -->
        <div v-if="!zoomedIn">
            <div class="row">
                <div class="col-6">
                    <div class="graph-container">
                        <iframe src="http://localhost:3000/d-solo/cdtzkeuurnoqoc/flowmeter1?orgId=1&from=1683492212138&to=1684132683830&panelId=14" width="100%" height="200" frameborder="0" title="Flowmeter 1 Graph 1"></iframe>
                    </div>
                    <div class="graph-container">
                        <iframe src="http://localhost:3000/d-solo/cdtzkeuurnoqoc/flowmeter1?orgId=1&from=1683492212138&to=1684132683830&panelId=16" width="100%" height="200" frameborder="0" title="Flowmeter 1 Graph 2"></iframe>
                    </div>
                </div>
                <div class="col-6">
                    <div class="graph-container">
                        <iframe src="http://localhost:3000/d-solo/cdtzkeuurnoqoc/flowmeter1?orgId=1&from=1683492212138&to=1684132683830&panelId=1" width="100%" height="200" frameborder="0" title="Flowmeter 1 Graph 3"></iframe>
                        <q-icon name="zoom_out_map" class="zoom-icon" @click="zoomIn('iframe3')" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Bar Chart Container -->
        <div class="chart-container" :class="{ zoomed: zoomedIn === 'barChart' }">

            <div class="bar-chart-container" ref="barChartContainer"></div>

            <q-icon :name="zoomedIn === 'barChart' ? 'zoom_in_map' : 'zoom_out_map'" class="chart-zoom-icon" @click="toggleZoomBarChart" />
            <q-btn v-if="zoomedIn === 'barChart'" icon="arrow_back" class="back-button" @click="zoomOut" />
        </div>

        <!-- Zoomed Iframe -->
        <div v-if="zoomedIn === 'iframe3'" class="zoomed">
            <iframe src="http://localhost:3000/d-solo/cdtzkeuurnoqoc/flowmeter1?orgId=1&from=1683492212138&to=1684132683830&panelId=1" width="100%" height="100%" frameborder="0" title="Zoomed Flowmeter 1 Graph"></iframe>
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
                .then((response) => response.json())
                .then((data) => {
                    this.data = data.map((d) => +d['field2']);
                    this.categories = data.map((d) => d['Flowmeter 1']);
                    this.createBarChart(false);
                });
        },
        createBarChart(isZoomed) {
            const chartContainer = this.$refs.barChartContainer;
            const chart = echarts.init(chartContainer);

            const targetMonth = 5; // May

            let startIndex = -1;
            let endIndex = -1;
            this.categories.forEach((date, index) => {
                const [day, month] = date.split('-').map(Number);
                if (month === targetMonth) {
                    if (startIndex === -1) startIndex = index; // First occurrence
                    if (day === 2) endIndex = index; // Second day
                }
            });

            const startZoom = (startIndex / this.categories.length) * 100;
            const endZoom = ((endIndex + 1) / this.categories.length) * 100;

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
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                                offset: 0,
                                color: '#2a2185'
                            },
                            {
                                offset: 0.5,
                                color: '#2a2185'
                            },
                            {
                                offset: 1,
                                color: '#2a2185'
                            },
                        ]),
                    },
                    backgroundStyle: {
                        color: 'rgba(180, 180, 180, 0.2)',
                    },
                    emphasis: {
                        itemStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                                    offset: 0,
                                    color: '#5c4db8'
                                }, // Slightly lighter shade at the top
                                {
                                    offset: 0.5,
                                    color: '#4b3da5'
                                }, // Original color in the middle
                                {
                                    offset: 1,
                                    color: '#3a2d92'
                                }, // Slightly darker shade at the bottom
                            ]),
                            
                        },
                    },
                    animationDelay: (idx) => idx * 50, // Increase delay for smoothness
                    animationDuration: 1500, // Duration of each bar animation (in milliseconds)
                    animationEasing: 'elasticOut', // Elastic easing function for bounce effect
                }, ],
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow',
                    },
                    formatter: (params) => {
                        const dataIndex = params[0].dataIndex;
                        const date = this.categories[dataIndex];
                        const value = this.data[dataIndex];
                        return `<strong>Date:</strong> ${date}<br/><strong>Value:</strong> ${value}`;
                    },
                },
                dataZoom: [{
                        type: 'slider',
                        xAxisIndex: 0,
                        orient: 'vertical',
                        start: startZoom,
                        end: endZoom,
                        backgroundColor: 'rgba(47, 69, 84, 0)',
                        fillerColor: 'rgba(47, 69, 84, 0.25)',
                        borderColor: '#2a2185',
                        right: 90,
                        width: 30,
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
                animation: true,
                animationDuration: 2000,
                animationEasing: 'elasticOut',
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

                // Get and display the data for a specific date when clicked
                const clickedDate = this.categories[params.dataIndex];
                const dateData = this.getDateData(clickedDate);
                console.log(dateData); // Display in the console or handle it as needed
            });

            // Adjust size based on zoomed state
            if (isZoomed) {
                chartContainer.style.width = '108vw';
                chartContainer.style.height = '95vh';
            } else {
                chartContainer.style.width = '90vw';
                chartContainer.style.height = '60vh';
            }

            chart.resize();
        },

        getDateData(targetDate) {
            // Find the index of the target date in the categories array
            const dateIndex = this.categories.findIndex(date => date.startsWith(targetDate));

            if (dateIndex !== -1) {
                // If the date is found, return the corresponding data
                const dataValue = this.data[dateIndex];
                return {
                    date: this.categories[dateIndex],
                    value: dataValue
                };
            } else {
                // If the date is not found, return a message or handle it accordingly
                return `Data for the date ${targetDate} not found.`;
            }
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
    max-width: 50%;
    padding: 0 8px;
}

/* Container for each graph */
.graph-container {
    margin: 8px;
    margin-left: 0px;
    position: relative;
    background-color: #f5f5f5;
    border-radius: 12px;
    overflow: hidden;
    width: 100%;
    height: auto;
    transition: all 0.3s ease;
}

/* Hover Effect for Graph Containers */
.graph-container:hover {
    /* box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2); */
    transform: translateY(4px);
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
    background-color: #f5f5f5;
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
}

.col-12 {
    max-width: 100%;
}

/* Icon for Zooming */
.zoom-icon {
    position: absolute;
    top: 8px;
    right: 8px;
    font-size: 24px;
    color: #2a2185;
    cursor: pointer;
    transition: transform 0.3s ease;
}

/* Hover Effect for Zoom Icons */
.zoom-icon:hover,
.chart-zoom-icon:hover {
    transform: scale(1.1);
}

/* Bar Chart Container */
.chart-container {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    background-color: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    width: 100%;
    /* box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15); */
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
    transition: transform 0.8s ease-in-out, opacity 0.6s ease;
    opacity: 1;
    transform: scale(1);
}

.zoomed.fade-out {
    opacity: 0;
    transform: scale(0.9);
}

.zoomed.fade-in {
    opacity: 1;
    transform: scale(1);
}

/* Zoom Icon for Charts */
.chart-zoom-icon {
    position: absolute;
    top: 16px;
    right: 16px;
    font-size: 24px;
    color: #2a2185;
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
    /* box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15); */
    padding: 8px 16px;
}

/* Responsive Layout for Bar Chart */
.bar-chart-container {
    width: 100%;
    height: 40vh;
    /* Default height for larger screens */
}

@media (max-width: 768px) {
    .bar-chart-container {
        height: 30vh;
        /* Adjust height for tablets and small devices */
    }
}

@media (max-width: 576px) {
    .bar-chart-container {
        height: 25vh;
        /* Adjust height for mobile devices */
    }
}

/* Adjust chart container for zoomed-in state */
.chart-container.zoomed .bar-chart-container {
    height: 90vh;
}

.chart-container.zoomed .chart-zoom-icon {
    top: 10px;
    right: 10px;
    font-size: 20px;
}

/* Responsive Layout for Mobile Devices */
@media (max-width: 768px) {
    .row {
        flex-direction: column;
    }

    .col-6 {
        max-width: 100%;
        padding: 0 8px;
    }

    .chart-container {
        width: 100%;
    }

    .zoom-icon,
    .chart-zoom-icon {
        top: 12px;
        right: 12px;
        font-size: 20px;
    }
}

/* Dark Mode Styles */
body.dark-mode {
    background-color: #1e1e1e;
    color: #d0d0d0;
}

body.dark-mode .dashboard-container {
    background-color: #2c2c2c;
}

body.dark-mode .graph-container,
body.dark-mode .chart-container {
    background-color: #3a3a3a;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
}

body.dark-mode .zoom-icon,
body.dark-mode .chart-zoom-icon {
    color: #2a2185;
}

/* Loading Spinner */
.loading-spinner {
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top: 4px solid #007bff;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin: auto;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}
</style>
