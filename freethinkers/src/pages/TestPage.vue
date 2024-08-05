// src/pages/PotholeGraph.vue
<template>
    <h1 >Potholes by Constituency</h1>
    <div ref="chart"></div>
</template>

<script>
import * as d3 from 'd3';

export default {
  data() {
    return {
      data: [], // Will hold the processed data
    };
  },
  async mounted() {
    // Fetch the data from the JSON file
    const response = await fetch('/potholeData.json');
    const jsonData = await response.json();

    // Process the data
    const potholeCounts = {};

    jsonData.features.forEach((feature) => {
      const constituency = feature.properties.constituency;
      if (potholeCounts[constituency]) {
        potholeCounts[constituency]++;
      } else {
        potholeCounts[constituency] = 1;
      }
    });

    this.data = Object.entries(potholeCounts).map(([key, value]) => ({
      constituency: key,
      count: value,
    }));

    this.renderChart();
  },
  methods: {
    renderChart() {
      const margin = { top: 20, right: 30, bottom: 80, left: 60 };
      const width = 960 - margin.left - margin.right;
      const height = 500 - margin.top - margin.bottom;

      const svg = d3
        .select(this.$refs.chart)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const x = d3
        .scalePoint()
        .domain(this.data.map((d) => d.constituency))
        .range([0, width])
        .padding(0.5);

      const y = d3
        .scaleLinear()
        .domain([0, d3.max(this.data, (d) => d.count)]).nice()
        .range([height, 0]);

      const line = d3
        .line()
        .x((d) => x(d.constituency))
        .y((d) => y(d.count))
        .curve(d3.curveMonotoneX);

      svg
        .append('path')
        .data([this.data])
        .attr('class', 'line')
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', 'url(#line-gradient)')
        .attr('stroke-width', 2);

      // Add grid lines
      svg
        .append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(y).tickSize(-width).tickFormat('').tickPadding(10));

      // Add x-axis
      svg
        .append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickSize(0).tickPadding(10))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('transform', 'rotate(-45)');

      // Add y-axis
      svg
        .append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(y))
        .append('text')
        .attr('fill', '#000')
        .attr('x', -40)
        .attr('y', -40)
        .attr('dy', '.71em')
        .attr('text-anchor', 'end')
        .text('Number of Potholes');

      // Add x-axis label
      svg
        .append('text')
        .attr('transform', `translate(${width / 2},${height + margin.bottom - 10})`)
        .style('text-anchor', 'middle')
        .text('Constituency');

      // Add dots for each data point
      svg
        .selectAll('.dot')
        .data(this.data)
        .enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('cx', (d) => x(d.constituency))
        .attr('cy', (d) => y(d.count))
        .attr('r', 6)
        .attr('fill', '#2a2185')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

      // Add tooltip
      const tooltip = d3
        .select(this.$refs.chart)
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

      svg
        .selectAll('.dot')
        .on('mouseover', function (event, d) {
          tooltip
            .transition()
            .duration(200)
            .style('opacity', .9);
          tooltip
            .html(`Constituency: ${d.constituency}<br>Number of Potholes: ${d.count}`)
            .style('left', `${event.pageX + 5}px`)
            .style('top', `${event.pageY - 28}px`);
        })
        .on('mouseout', function () {
          tooltip
            .transition()
            .duration(500)
            .style('opacity', 0);
        });
      
      // Add gradient for line color
      const defs = svg.append('defs');

      const gradient = defs
        .append('linearGradient')
        .attr('id', 'line-gradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '100%');

      gradient
        .append('stop')
        .attr('offset', '0%')
        .attr('stop-color', '#2a2185');

      gradient
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', '#2a2185');
    },
  },
};
</script>

<style>
.q-page {
  max-width: 960px;
  margin: 0 auto;
}

.line {
  fill: none;
  stroke-width: 2;
}

.grid line {
  stroke: #ddd;
  stroke-width: 1;
}

.axis text {
  font-size: 12px;
}

.dot {
  cursor: pointer;
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
