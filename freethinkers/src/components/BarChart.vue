<template>
  <q-page class="bar-chart-page">
    <div class="controls">
      <q-select
        v-model="selectedMonth"
        :options="monthOptions"
        label="Select Month"
        emit-value
        map-options
      />
      <q-select
        v-model="selectedDate"
        :options="dateOptions"
        label="Select Date"
        emit-value
        map-options
      />
      <q-select
        v-model="selectedTime"
        :options="timeOptions"
        label="Select Time"
        emit-value
        map-options
      />
      <q-btn @click="filterData" label="Apply Filters" color="primary" />
    </div>
    <div ref="barChart" class="bar-chart"></div>
  </q-page>
</template>

<script>
import * as d3 from 'd3';

export default {
  name: 'BarChart',
  data() {
    return {
      data: [],
      filteredData: [],
      monthOptions: [],
      dateOptions: [],
      timeOptions: [],
      selectedMonth: '5', // Default to May
      selectedDate: null,
      selectedTime: null,
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
          this.data = data
            .filter(d => d['Flowmeter 1'] && d['field2'])
            .map(d => {
              const [day, month, year] = d['Flowmeter 1'].split(' ')[0].split('-').map(Number);
              const [hour, minute] = d['Flowmeter 1'].split(' ')[1].split(':').map(Number);
              return {
                date: new Date(year, month - 1, day, hour, minute),
                value: +d['field2'],
                day: `${day}`,
                month: `${month}`,
                year: `${year}`,
                time: `${hour}:${minute}`,
              };
            });
          this.populateMonthOptions();
          this.populateDateOptions();
          this.populateTimeOptions();
          this.filterData(); // Apply filters after data is loaded
        });
    },
    populateMonthOptions() {
      const months = new Set(this.data.map(d => d.month));
      this.monthOptions = Array.from(months).map(month => ({
        label: `Month ${month}`,
        value: month
      }));
    },
    populateDateOptions() {
      const dates = new Set(this.data.map(d => d.day));
      this.dateOptions = Array.from(dates).map(day => ({
        label: `Day ${day}`,
        value: day
      }));
    },
    populateTimeOptions() {
      const times = new Set(this.data.map(d => d.time));
      this.timeOptions = Array.from(times).map(time => ({
        label: time,
        value: time
      }));
    },
    filterData() {
      this.filteredData = this.data;

      if (this.selectedMonth) {
        this.filteredData = this.filteredData.filter(d =>
          d.month === this.selectedMonth
        );
      }
      
      if (this.selectedDate) {
        this.filteredData = this.filteredData.filter(d =>
          d.day === this.selectedDate
        );
      }

      if (this.selectedMonth && this.selectedDate) {
        this.createBarChartForMonthAndDate();
      } else if (this.selectedMonth) {
        this.createBarChartForMonth();
      } else {
        this.createBarChart(); // Use your default chart creation method here if needed
      }
    },
    createBarChartForMonth() {
      d3.select(this.$refs.barChart).selectAll('*').remove(); // Clear the existing chart

      const width = 500;
      const height = 300;
      const margin = { top: 20, right: 20, bottom: 40, left: 60 };

      const svg = d3.select(this.$refs.barChart)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const tooltip = d3.select(this.$refs.barChart)
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

      const xDomain = this.filteredData.map(d => d.date.toLocaleDateString('en-GB', { day: '2-digit' }));

      const x = d3.scaleBand()
        .domain(xDomain)
        .range([0, width - margin.left - margin.right])
        .padding(0.1);

      const y = d3.scaleLinear()
        .domain([0, d3.max(this.filteredData, d => d.value)])
        .nice()
        .range([height - margin.top - margin.bottom, 0]);

      svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(x)
          .tickFormat(d => d)
        );

      svg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(y));

      svg.selectAll('.bar')
        .data(this.filteredData)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.date.toLocaleDateString('en-GB', { day: '2-digit' })))
        .attr('y', d => y(d.value))
        .attr('width', x.bandwidth())
        .attr('height', d => height - margin.top - margin.bottom - y(d.value))
        .style('fill', 'steelblue')
        .on('mouseover', (event, d) => {
          tooltip.transition()
            .duration(200)
            .style('opacity', .9);
          tooltip.html(`Date: ${d.date.toLocaleDateString()}<br>Time: ${d.time}<br>Value: ${d.value} m³/h`)
            .style('left', (event.pageX + 5) + 'px')
            .style('top', (event.pageY - 28) + 'px');
          d3.select(event.target).style('fill', 'orange'); // Change color on hover
        })
        .on('mousemove', (event) => {
          tooltip.style('left', (event.pageX + 5) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', (event) => {
          tooltip.transition()
            .duration(500)
            .style('opacity', 0);
          d3.select(event.target).style('fill', 'steelblue'); // Revert color on mouseout
        });
    },
    createBarChartForMonthAndDate() {
      d3.select(this.$refs.barChart).selectAll('*').remove(); // Clear the existing chart

      const width = 500;
      const height = 300;
      const margin = { top: 20, right: 20, bottom: 40, left: 60 };

      const svg = d3.select(this.$refs.barChart)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const tooltip = d3.select(this.$refs.barChart)
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

      const xDomain = this.filteredData.map(d => d.time);

      const x = d3.scaleBand()
        .domain(xDomain)
        .range([0, width - margin.left - margin.right])
        .padding(0.1);

      const y = d3.scaleLinear()
        .domain([0, d3.max(this.filteredData, d => d.value)])
        .nice()
        .range([height - margin.top - margin.bottom, 0]);

      svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(x)
          .tickFormat(d => d)
        );

      svg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(y));

      svg.selectAll('.bar')
        .data(this.filteredData)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.time))
        .attr('y', d => y(d.value))
        .attr('width', x.bandwidth())
        .attr('height', d => height - margin.top - margin.bottom - y(d.value))
        .style('fill', 'steelblue')
        .on('mouseover', (event, d) => {
          tooltip.transition()
            .duration(200)
            .style('opacity', .9);
          tooltip.html(`Date: ${d.date.toLocaleDateString()}<br>Time: ${d.time}<br>Value: ${d.value} m³/h`)
            .style('left', (event.pageX + 5) + 'px')
            .style('top', (event.pageY - 28) + 'px');
          d3.select(event.target).style('fill', 'orange'); // Change color on hover
        })
        .on('mousemove', (event) => {
          tooltip.style('left', (event.pageX + 5) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', (event) => {
          tooltip.transition()
            .duration(500)
            .style('opacity', 0);
          d3.select(event.target).style('fill', 'steelblue'); // Revert color on mouseout
        });
    }
  }
};
</script>

<style scoped>
.bar-chart-page {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.bar-chart {
  width: 100%;
  max-width: 600px;
  position: relative; /* Ensure the tooltip is positioned relative to the chart */
}

.tooltip {
  position: absolute;
  text-align: center;
  padding: 8px;
  font: 12px sans-serif;
  background: lightsteelblue;
  border: 0;
  border-radius: 8px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
}
</style>
