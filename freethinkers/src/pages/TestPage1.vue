<template>
  <q-page class="q-pa-md">
    <q-card class="q-pa-md">
      <h4>Flowmeter Data Visualization with Realistic Pipes and Flow Rate Gauge Animation</h4>
      <div class="container">
        <svg ref="flowDiagram" :width="width" :height="height"></svg>
      </div>
    </q-card>
  </q-page>
</template>

<script>
import * as d3 from 'd3';

export default {
  data() {
    return {
      width: 800,
      height: 600,
      flowmeterData: [
        { id: 1, name: "Ursa", location: "Assagao", position: "1", flowRate: 30 },
        { id: 2, name: "Capricorn", location: "Aldona", position: "1.1", flowRate: 50 },
        { id: 3, name: "Orion", location: "Saligao", position: "1.1.1", flowRate: 70 },
        { id: 4, name: "Taurus", location: "Mapusa", position: "1.1.2", flowRate: 40 },
        { id: 5, name: "Gemini", location: "Pernem", position: "1.2", flowRate: 80 }
      ]
    };
  },
  mounted() {
    this.createFlowDiagram();
    this.simulateRealTimeData();
  },
  methods: {
    createFlowDiagram() {
      const svg = d3.select(this.$refs.flowDiagram);
      const margin = { top: 20, right: 40, bottom: 20, left: 40 };
      const width = this.width - margin.left - margin.right;
      const height = this.height - margin.top - margin.bottom;

      const root = d3.stratify()
        .id(d => d.position)
        .parentId(d => d.position.substring(0, d.position.lastIndexOf('.')))
        (this.flowmeterData);

      const treeLayout = d3.tree().size([height, width]);
      const treeData = treeLayout(root);

      const nodes = treeData.descendants();
      const links = treeData.links();

      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      // Create realistic pipes (links) with flowing water animation
      g.selectAll(".pipe")
        .data(links)
        .enter()
        .append("path")
        .attr("class", "pipe")
        .attr("fill", "none")
        .attr("stroke", "#d0cdd7")  // Color updated
        .attr("stroke-width", 20)
        .attr("d", d3.linkHorizontal()
          .x(d => d.y)
          .y(d => d.x)
        );

      // Animated water flow within pipes
      g.selectAll(".water-flow")
        .data(links)
        .enter()
        .append("path")
        .attr("class", "water-flow")
        .attr("fill", "none")
        .attr("stroke", "var(--blue)")  // Color updated
        .attr("stroke-width", 12)
        .attr("stroke-dasharray", "10, 20") // Stroke dashes to simulate flowing water
        .attr("d", d3.linkHorizontal()
          .x(d => d.y)
          .y(d => d.x)
        )
        .attr("stroke-dashoffset", function() { return this.getTotalLength(); })
        .transition()
        .duration(3000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0)
        .on("end", function repeat() {
          d3.select(this)
            .attr("stroke-dashoffset", function() { return this.getTotalLength(); })
            .transition()
            .duration(3000)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0)
            .on("end", repeat); // Loop the animation
        });

      // Nodes with flow rate gauges
      const node = g.selectAll(".node")
        .data(nodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.y},${d.x})`);

      // Flow rate gauges
      node.append("circle")
        .attr("r", 40)
        .attr("fill", "var(--white)")  // Color updated
        .attr("stroke", "var(--blue)")  // Color updated
        .attr("stroke-width", 2);

      node.append("circle")
        .attr("class", "gauge")
        .attr("r", 35)
        .attr("fill", "none")
        .attr("stroke", "var(--blue)")  // Color updated
        .attr("stroke-width", 10)
        .attr("stroke-dasharray", function(d) {
          const radius = 35;
          const circumference = 2 * Math.PI * radius;
          return `${(d.data.flowRate / 100) * circumference} ${circumference}`;
        })
        .attr("stroke-dashoffset", function() {
          const radius = 35;
          const circumference = 2 * Math.PI * radius;
          return circumference;
        })
        .transition()
        .duration(1000)
        .attr("stroke-dashoffset", function(d) {
          const radius = 35;
          const circumference = 2 * Math.PI * radius;
          return circumference - (d.data.flowRate / 100) * circumference;
        });

      // Flowmeter labels
      node.append("text")
        .attr("dy", -50)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("fill", "var(--black1)")  // Color updated
        .text(d => d.data.location); // Location name above the gauge

      // Flow rate reading inside the gauge
      node.append("text")
        .attr("class", "flow-rate-text")
        .attr("dy", 5)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("fill", "var(--blue)")  // Color updated
        .text(d => `${d.data.flowRate} l/s`); // Flow rate reading inside the gauge
    },

    // Simulate real-time data changes
    simulateRealTimeData() {
      setInterval(() => {
        this.flowmeterData.forEach(meter => {
          // Randomly change flow rate to simulate real-time data
          meter.flowRate = Math.max(0, Math.min(100, meter.flowRate + (Math.random() * 20 - 10)));
        });
        this.updateFlowRates();
      }, 2000); // Update every 2 seconds
    },

    updateFlowRates() {
      const svg = d3.select(this.$refs.flowDiagram);

      // Update gauge strokes
      svg.selectAll(".gauge")
        .transition()
        .duration(1000)
        .attr("stroke-dasharray", d => {
          const radius = 35;
          const circumference = 2 * Math.PI * radius;
          return `${(d.data.flowRate / 100) * circumference} ${circumference}`;
        })
        .attr("stroke-dashoffset", d => {
          const radius = 35;
          const circumference = 2 * Math.PI * radius;
          return circumference - (d.data.flowRate / 100) * circumference;
        });

      // Update flow rate text
      svg.selectAll(".flow-rate-text")
        .transition()
        .duration(1000)
        .tween("text", function(d) {
          const i = d3.interpolateNumber(parseFloat(this.textContent), d.data.flowRate);
          return function(t) {
            this.textContent = `${Math.round(i(t))} l/s`;
          };
        });
    }
  }
};
</script>

<style scoped>
.q-card {
  max-width: 1000px;
  margin: auto;
}
.pipe {
  stroke-width: 20px;
  stroke: var(--gray);  /* Color updated */
}
.water-flow {
  stroke-width: 12px;
  stroke: var(--blue);  /* Color updated */
  stroke-dasharray: 10, 20;
}
.gauge {
  transition: stroke-dasharray 1s, stroke-dashoffset 1s;
}

.container{
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>
