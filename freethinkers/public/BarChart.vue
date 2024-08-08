<template>
  <div>
    <div>
      <label for="flowmeter-filter">Flowmeter:</label>
      <select v-model="selectedFlowmeter" @change="updateFlowmeterFilter">
        <option value="">All</option>
        <option v-for="flowmeter in uniqueFlowmeters" :key="flowmeter" :value="flowmeter">{{ flowmeter }}</option>
      </select>
    </div>

    <div>
      <label for="month-filter">Month:</label>
      <select v-model="selectedMonth" @change="updateDateFilter">
        <option value="">All</option>
        <option v-for="month in uniqueMonths" :key="month" :value="month">{{ month }}</option>
      </select>
    </div>

    <div>
      <label for="date-filter">Date:</label>
      <select v-model="selectedDate" @change="updateTimeFilter">
        <option value="">All</option>
        <option v-for="date in filteredDates" :key="date" :value="date">{{ date }}</option>
      </select>
    </div>

    <div>
      <label for="time-filter">Time:</label>
      <select v-model="selectedTime" @change="updateChart">
        <option value="">All</option>
        <option v-for="time in filteredTimes" :key="time" :value="time">{{ time }}</option>
      </select>
    </div>

    <div ref="chart"></div>
    <div ref="tooltip" class="tooltip" style="opacity: 0;"></div>
  </div>
</template>

<script>
import * as d3 from 'd3';
import rawData from '../assets/data.json'; // Ensure this path is correct

export default {
  name: 'BarChart',
  data() {
    return {
      chartData: [],
      uniqueFlowmeters: ['Flowmeter 1', 'Flowmeter 2', 'Flowmeter 3', 'Flowmeter 4'],
      uniqueMonths: [],
      filteredDates: [],
      filteredTimes: [],
      selectedFlowmeter: 'Flowmeter 1',
      selectedMonth: '',
      selectedDate: '',
      selectedTime: ''
    };
  },
  mounted() {
    this.processData();
    this.updateDateFilter();
    this.drawChart();
  },
  methods: {
    processData() {
      const data = rawData; // Adjust according to your actual data structure
      this.chartData = this.transformData(data, this.selectedFlowmeter);

      // Extract unique months from the data and filter to only show May, June, and July
      const monthNames = ['May', 'June', 'July'];
      this.uniqueMonths = [...new Set(this.chartData.map(d => new Date(d.date).toLocaleString('default', { month: 'long' })))].filter(month => monthNames.includes(month));
    },
    transformData(data, flowmeter) {
      return data.map(row => ({
        date: row[flowmeter],
        value: row[`field${this.uniqueFlowmeters.indexOf(flowmeter) * 2 + 2}`]
      }));
    },
    updateFlowmeterFilter() {
      this.processData();
      this.updateDateFilter();
      this.updateTimeFilter();
      this.updateChart();
    },
    updateDateFilter() {
      let filteredData = this.chartData;

      if (this.selectedMonth) {
        filteredData = filteredData.filter(d => new Date(d.date).toLocaleString('default', { month: 'long' }) === this.selectedMonth);
      }

      this.filteredDates = [...new Set(filteredData.map(d => new Date(d.date).toLocaleDateString()))];
      this.filteredTimes = [...new Set(filteredData.map(d => new Date(d.date).toLocaleTimeString()))];
      
      // Reset selected date and time if they no longer match available options
      if (!this.filteredDates.includes(this.selectedDate)) {
        this.selectedDate = '';
      }
      if (!this.filteredTimes.includes(this.selectedTime)) {
        this.selectedTime = '';
      }

      this.updateTimeFilter(); // Update time filter options based on the selected date
      this.updateChart(); // Re-apply filters to update the chart
    },
    updateTimeFilter() {
      let filteredData = this.chartData;

      if (this.selectedMonth) {
        filteredData = filteredData.filter(d => new Date(d.date).toLocaleString('default', { month: 'long' }) === this.selectedMonth);
      }
      if (this.selectedDate) {
        filteredData = filteredData.filter(d => new Date(d.date).toLocaleDateString() === this.selectedDate);
      }

      this.filteredTimes = [...new Set(filteredData.map(d => new Date(d.date).toLocaleTimeString()))];
      
      // Reset selected time if it no longer matches available options
      if (!this.filteredTimes.includes(this.selectedTime)) {
        this.selectedTime = '';
      }

      this.updateChart(); // Re-apply filters to update the chart
    },
    updateChart() {
      let filteredData = this.chartData;

      if (this.selectedMonth) {
        filteredData = filteredData.filter(d => new Date(d.date).toLocaleString('default', { month: 'long' }) === this.selectedMonth);
      }
      if (this.selectedDate) {
        filteredData = filteredData.filter(d => new Date(d.date).toLocaleDateString() === this.selectedDate);
      }
      if (this.selectedTime) {
        filteredData = filteredData.filter(d => new Date(d.date).toLocaleTimeString() === this.selectedTime);
      }

      this.drawChart(filteredData);
    },
    drawChart(data = this.chartData) {
      const svgWidth = 600;
      const svgHeight = 400;
      const margin = { top: 20, right: 20, bottom: 100, left: 40 }; // Increased bottom margin for rotated labels
      const width = svgWidth - margin.left - margin.right;
      const height = svgHeight - margin.top - margin.bottom;

      // Clear any existing chart
      d3.select(this.$refs.chart).select('svg').remove();

      const svg = d3.select(this.$refs.chart)
        .append('svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const x = d3.scaleBand()
        .domain(data.map(d => d.date))
        .range([0, width])
        .padding(0.1);

      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value)])
        .nice()
        .range([height, 0]);

      // Conditionally render x-axis
      if ((this.selectedDate && this.selectedMonth) || (this.selectedMonth && this.selectedTime)) {
        svg.append('g')
          .attr('class', 'x-axis')
          .attr('transform', `translate(0,${height})`)
          .call(d3.axisBottom(x).tickFormat(d => {
            const date = new Date(d);
            if (this.selectedDate && this.selectedMonth) {
              return date.toLocaleTimeString();
            } else if (this.selectedMonth && this.selectedTime) {
              return date.toLocaleDateString();
            }
            return '';
          }))
          .selectAll('text')
          .attr('transform', 'rotate(-45)')
          .attr('text-anchor', 'end');
      }

      svg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(y));

      const tooltip = d3.select(this.$refs.tooltip);

      svg.selectAll('.bar')
        .data(data)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.date))
        .attr('y', d => y(d.value))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.value))
        .attr('fill', '#4A90E2') // Dark blue color
        .on('mouseover', function(event, d) {
          d3.select(this).attr('fill', '#B0D4FF'); // Light blue color on hover
          tooltip.transition().duration(200).style('opacity', 0.9);
          tooltip.html(`Date: ${new Date(d.date).toLocaleDateString('en-GB')}<br>Time: ${new Date(d.date).toLocaleTimeString('en-GB')}<br>Value: ${d.value}`)
            .style('left', `${event.pageX}px`)
            .style('top', `${event.pageY - 28}px`);
        })
        .on('mouseout', function(d) {
          d3.select(this).attr('fill', '#4A90E2'); // Dark blue color
          tooltip.transition().duration(500).style('opacity', 0);
        });
    }
  }
}
</script>

<style scoped>
.bar {
  fill: #4A90E2;
}
.bar:hover {
  fill: #B0D4FF;
}
.tooltip {
  position: absolute;
  text-align: center;
  width: 120px;
  height: 60px;
  padding: 2px;
  font: 12px sans-serif;
  background: lightsteelblue;
  border: 0px;
  border-radius: 8px;
  pointer-events: none;
}
</style>
