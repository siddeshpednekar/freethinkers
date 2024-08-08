<template>
  <q-page class="pie-chart-page">
    <div class="controls">
      <div class="flowmeter-buttons">
        <q-btn @click="setFlowmeter('Flowmeter 1')" label="Flowmeter 1" />
        <q-btn @click="setFlowmeter('Flowmeter 2')" label="Flowmeter 2" />
        <q-btn @click="setFlowmeter('Flowmeter 3')" label="Flowmeter 3" />
        <q-btn @click="setFlowmeter('Flowmeter 4')" label="Flowmeter 4" />
      </div>
      <q-select
        v-model="selectedMonth"
        :options="monthOptions"
        label="Select Month"
        emit-value
        map-options
        @input="filterData"
      />
      <q-select
        v-model="selectedDate"
        :options="dateOptions"
        label="Select Date"
        emit-value
        map-options
        @input="filterData"
      />
      <q-select
        v-model="selectedTime"
        :options="timeOptions"
        label="Select Time"
        emit-value
        map-options
        @input="filterData"
      />
      <q-btn @click="filterData" label="Filter Data" />
    </div>
    <div class="graph-title">{{ selectedFlowmeter }}</div>
    <div ref="pieChart" class="pie-chart"></div>
    <div v-if="tooltipData" class="data-box">
      <div>Date: {{ tooltipData.date }}</div>
      <div>Time: {{ tooltipData.time }}</div>
      <div>Value: {{ tooltipData.value }} m³/h</div>
    </div>
  </q-page>
</template>

<script>
import * as d3 from 'd3';

export default {
  name: 'PieChart',
  data() {
    return {
      data: [],
      filteredData: [],
      monthOptions: [],
      dateOptions: [],
      timeOptions: [],
      selectedMonth: '05', // Default month to May
      selectedDate: '01', // Default date to 1
      selectedTime: null,
      selectedFlowmeter: 'Flowmeter 1', // Default flowmeter
      tooltipData: null,
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
            .filter(d => d[this.selectedFlowmeter] && d[this.getFieldValue()])
            .map(d => {
              const [day, month, year] = d[this.selectedFlowmeter].split(' ')[0].split('-').map(Number);
              const [hour, minute] = d[this.selectedFlowmeter].split(' ')[1].split(':').map(Number);
              return {
                date: new Date(year, month - 1, day, hour, minute),
                value: +d[this.getFieldValue()],
                day: `${day < 10 ? '0' : ''}${day}`, // Pad day with leading zero
                month: `${month < 10 ? '0' : ''}${month}`, // Pad month with leading zero
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
    getFieldValue() {
      const flowmeterFieldMap = {
        'Flowmeter 1': 'field2',
        'Flowmeter 2': 'field4',
        'Flowmeter 3': 'field6',
        'Flowmeter 4': 'field8',
      };
      return flowmeterFieldMap[this.selectedFlowmeter] || '';
    },
    setFlowmeter(flowmeter) {
      this.selectedFlowmeter = flowmeter;
      this.loadData(); // Reload data with the new flowmeter
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

      const monthValue = this.selectedMonth;
      const dateValue = this.selectedDate;

      if (monthValue) {
        this.filteredData = this.filteredData.filter(d =>
          d.month === monthValue
        );
      }
      
      if (dateValue) {
        this.filteredData = this.filteredData.filter(d =>
          d.day === dateValue
        );
      }

      if (this.selectedTime) {
        this.filteredData = this.filteredData.filter(d =>
          d.time === this.selectedTime
        );
      }

      this.createPieChart();
    },
    createPieChart() {
      d3.select(this.$refs.pieChart).selectAll('*').remove(); // Clear the existing chart

      const width = 500;
      const height = 500;
      const radius = Math.min(width, height) / 2;

      const svg = d3.select(this.$refs.pieChart)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);

      const color = d3.scaleOrdinal(d3.schemeCategory10);

      const pie = d3.pie()
        .value(d => d.value)
        .sort(null);

      const arc = d3.arc()
        .outerRadius(radius - 10)
        .innerRadius(0);

      const labelArc = d3.arc()
        .outerRadius(radius - 40)
        .innerRadius(radius - 40);

      const pieData = pie(this.filteredData);

      const g = svg.selectAll('.arc')
        .data(pieData)
        .enter().append('g')
        .attr('class', 'arc');

      g.append('path')
        .attr('d', arc)
        .style('fill', d => color(d.data.date))
        .on('mouseover', (event, d) => {
          this.tooltipData = {
            date: d.data.date.toLocaleDateString(),
            time: d.data.date.toLocaleTimeString(),
            value: d.data.value,
          };
        })
        .on('mouseout', () => {
          this.tooltipData = null;
        });

      g.append('text')
        .attr('transform', d => `translate(${labelArc.centroid(d)})`)
        .attr('dy', '.35em')
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .text(d => `${d.data.value} m³/h`);
    },
  },
};
</script>

<style scoped>
.pie-chart-page {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.flowmeter-buttons {
  margin-bottom: 20px;
}

.pie-chart {
  width: 100%;
  height: 100%;
}

.graph-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
}

.data-box {
  border: 1px solid #ccc;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.tooltip {
  position: absolute;
  text-align: center;
  padding: 5px;
  font-size: 12px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  pointer-events: none;
}
</style>
