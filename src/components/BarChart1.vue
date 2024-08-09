<template>
    <q-page class="bar-chart-page">
      <div ref="barChart" class="bar-chart"></div>
    </q-page>
  </template>
  
  <script>
  import * as echarts from 'echarts';
  
  export default {
    name: 'GradientBarChartFlowmeter2',
    data() {
      return {
        data: [],
        categories: [],
      };
    },
    mounted() {
      this.loadData();
    },
    methods: {
      loadData() {
        fetch('/src/assets/data.json')
          .then(response => response.json())
          .then(data => {
            this.data = data.map(d => +d['field2']); // Change to field4
            this.categories = data.map(d => d['Flowmeter 1']); // Change to Flowmeter 2
            this.createBarChart();
          });
      },
      createBarChart() {
        const chart = echarts.init(this.$refs.barChart);
  
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
          series: [
            {
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
            },
          ],
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow',
            },
          },
          dataZoom: [
            {
              type: 'slider',
              xAxisIndex: 0,
              start: 0,
              end: 100,
              backgroundColor: 'rgba(47, 69, 84, 0)',
              fillerColor: 'rgba(47, 69, 84, 0.25)',
              borderColor: 'blue',
              bottom: 20,
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
            },
          ],
        };
  
        chart.setOption(option);
  
        // Enable zoom on bar click
        const zoomSize = 6;
        chart.on('click', (params) => {
          const startValue = this.categories[Math.max(params.dataIndex - zoomSize / 2, 0)];
          const endValue = this.categories[Math.min(params.dataIndex + zoomSize / 2, this.data.length - 1)];
          
          chart.dispatchAction({
            type: 'dataZoom',
            startValue: startValue,
            endValue: endValue,
          });
        });
      },
    },
  };
  </script>
  
  <style scoped>
  .bar-chart-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    position: relative;
  }
  
  .bar-chart {
    width: 100%;
    max-width: 750px;
    height: 400px; /* Adjusted height to accommodate the zoom slider */
    margin-top: 1rem;
  }
  </style>
  