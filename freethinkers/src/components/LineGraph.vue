<template>
  <q-page class="line-graph-page">
    <div class="controls">
      <q-btn @click="setFlowmeter('Flowmeter 1')" label="Flowmeter 1" />
      <q-btn @click="setFlowmeter('Flowmeter 2')" label="Flowmeter 2" />
      <q-btn @click="setFlowmeter('Flowmeter 3')" label="Flowmeter 3" />
      <q-btn @click="setFlowmeter('Flowmeter 4')" label="Flowmeter 4" />
      
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
    <div ref="lineGraph" class="line-graph"></div>
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
  name: 'LineGraph',
  data() {
    return {
      data: [],
      filteredData: [],
      monthOptions: [],
      dateOptions: [],
      timeOptions: [],
      selectedMonth: '5', // Default month to May
      selectedDate: null,
      selectedTime: null,
      selectedFlowmeter: 'Flowmeter 1', // Default flowmeter
      tooltipData: null,
      monthLabel: 'May', // Default label for the month
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
    setFlowmeter(flowmeter) {
      this.selectedFlowmeter = flowmeter;
      this.loadData(); // Reload data based on the new selected flowmeter
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
    populateMonthOptions() {
      const months = new Set(this.data.map(d => d.month));
      this.monthOptions = Array.from(months).map(month => ({
        label: `Month ${month}`,
        value: month
      }));
      this.monthLabel = this.monthOptions.find(option => option.value === this.selectedMonth)?.label || 'May';
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
        this.monthLabel = this.monthOptions.find(option => option.value === this.selectedMonth)?.label || 'May';
      }
      
      if (this.selectedDate) {
        this.filteredData = this.filteredData.filter(d =>
          d.day === this.selectedDate
        );
      }

      if (this.selectedTime) {
        this.filteredData = this.filteredData.filter(d =>
          d.time === this.selectedTime
        );
      }

      this.createLineGraph();
    },
    createLineGraph() {
      d3.select(this.$refs.lineGraph).selectAll('*').remove(); // Clear the existing graph

      const margin = { top: 20, right: 30, bottom: 50, left: 40 };
      const width = 600 - margin.left - margin.right;
      const height = 300 - margin.top - margin.bottom;

      const svg = d3.select(this.$refs.lineGraph)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Set up x-axis scale based on the filter
      const xScale = d3.scaleTime()
        .domain(d3.extent(this.filteredData, d => d.date))
        .range([0, width]);

      const y = d3.scaleLinear()
        .domain([0, d3.max(this.filteredData, d => d.value)])
        .range([height, 0]);

      let xAxisFormat;

      if (this.selectedDate) {
        xAxisFormat = d3.timeFormat('%H:%M'); // Display time if a specific day is selected
      } else {
        xAxisFormat = d3.timeFormat('%d'); // Display only day otherwise
      }

      svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(xAxisFormat))
        .attr('class', 'x-axis');

      svg.append('g')
        .call(d3.axisLeft(y))
        .attr('class', 'y-axis');

      // Remove title displaying the current month
      // svg.append('text')
      //   .attr('x', (width / 2))
      //   .attr('y', 0 - (margin.top / 2))
      //   .attr('text-anchor', 'middle')
      //   .style('font-size', '16px')
      //   .style('font-weight', 'bold')
      //   .text(`Data for ${this.monthLabel}`);

      const tooltip = d3.select(this.$refs.lineGraph)
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

      const xLine = svg.append('line')
        .attr('stroke', 'black')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,4')
        .style('opacity', 0);

      const yLine = svg.append('line')
        .attr('stroke', 'black')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,4')
        .style('opacity', 0);

      const xLabel = svg.append('text')
        .attr('class', 'x-axis-label')
        .attr('x', 0)
        .attr('y', height)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', 'black')
        .style('opacity', 0);

      const yLabel = svg.append('text')
        .attr('class', 'y-axis-label')
        .attr('x', -margin.left)
        .attr('y', 0)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', 'black')
        .style('opacity', 0);

      svg.append('path')
        .datum(this.filteredData)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 1.5)
        .attr('d', d3.line()
          .x(d => xScale(d.date))
          .y(d => y(d.value))
        );

      const circles = svg.selectAll('dot')
        .data(this.filteredData)
        .enter().append('circle')
        .attr('r', 4)
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => y(d.value))
        .attr('fill', 'steelblue')
        .on('mouseover', (event, d) => {
          tooltip.transition().duration(200).style('opacity', .9);
          tooltip.html(`Date: ${d.date.toLocaleDateString()}<br>Time: ${d.time}<br>Value: ${d.value} m³/h`)
            .style('left', `${event.pageX + 5}px`)
            .style('top', `${event.pageY - 28}px`);
          this.tooltipData = {
            date: d.date.toLocaleDateString(),
            time: d.time,
            value: d.value,
          };
        })
        .on('mouseout', () => {
          tooltip.transition().duration(500).style('opacity', 0);
          this.tooltipData = null;
        });

      svg.on('mousemove', (event) => {
        const [xPos, yPos] = d3.pointer(event);
        xLine.attr('x1', xPos).attr('x2', xPos).attr('y1', 0).attr('y2', height).style('opacity', 0.5);
        yLine.attr('x1', 0).attr('x2', width).attr('y1', yPos).attr('y2', yPos).style('opacity', 0.5);
        xLabel.attr('x', xPos).attr('y', height + 20).style('opacity', 1).text(xAxisFormat(xScale.invert(xPos)));
        yLabel.attr('x', -margin.left).attr('y', yPos - 10).style('opacity', 1).text(d3.format('.2f')(y.invert(yPos)));
      }).on('mouseleave', () => {
        xLine.style('opacity', 0);
        yLine.style('opacity', 0);
        xLabel.style('opacity', 0);
        yLabel.style('opacity', 0);
      });
    }
  }
};
</script>

<style scoped>
.tooltip {
  position: absolute;
  text-align: center;
  padding: 5px;
  font-size: 12px;
  background: white;
  border: 1px solid black;
  border-radius: 4px;
  pointer-events: none;
}
</style>

<style scoped>
.line-graph-page {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.controls {
  margin-bottom: 16px;
}

.line-graph {
  width: 100%;
  height: 400px;
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
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 5px;
  font-size: 12px;
  pointer-events: none;
}
</style>
