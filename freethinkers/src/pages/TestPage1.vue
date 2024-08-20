<template>
  <q-page class="q-pa-none">
    <q-card class="q-pa-md">
      <h4 class="heading">Dynamic Flowmeter Network Visualization
        <q-btn label="Add New Flowmeter" class="btnsubmit" @click="showForm = true" />
      </h4>


      <!-- Form in a modal -->
      <q-dialog v-model="showForm" persistent>
        <q-card class="q-pa-md" style="min-width: 300px;">
          <q-card-section>
            <div class="text-h6">Add New Flowmeter</div>
          </q-card-section>

          <q-form @submit="addFlowmeter">
            <q-input v-model="newFlowmeter.name" label="Name" required />
            <q-input v-model="newFlowmeter.location" label="Location" required />
            <q-input v-model="newFlowmeter.position" label="Position" required />
            <q-input v-model.number="newFlowmeter.flowRate" label="Flow Rate (l/s)" required type="number" />

            <q-card-actions align="center">
              <q-btn class="btnsubmit" flat label="Cancel"  @click="showForm = false" />
              <q-btn class="btnsubmit" type="submit" label="Add"  />
            </q-card-actions>
          </q-form>
        </q-card>
      </q-dialog>

      <div class="container">
        <div class="svg-container">
          <svg ref="flowDiagram" :width="width" :height="height"></svg>
        </div>
        <div id="tooltip" class="tooltip"></div>
      </div>
    </q-card>
  </q-page>
</template>


<script>
import * as d3 from 'd3';

export default {
  data() {
    return {
      width: 1200,
      height: 600,
      flowmeterData: [],
      showForm: false, 
      newFlowmeter: {  // Initialize form data
        name: '',
        location: '',
        position: '',
        flowRate: 0
      } // Initialize as empty array
    };
  },
  mounted() {
    this.fetchFlowmeterData(); // Fetch data when component is mounted
  },
  methods: {
    async fetchFlowmeterData() {  
      try {
        const response = await fetch('/test.json');
        const data = await response.json();
        this.flowmeterData = data; // Update flowmeterData with fetched data
        this.createFlowDiagram(); // Create the diagram after data is fetched
        this.simulateRealTimeData(); // Start simulation
      } catch (error) {
        console.error('Error fetching flowmeter data:', error);
      }
    },

    addFlowmeter() {
      const newEntry = { ...this.newFlowmeter };
      this.flowmeterData.push(newEntry);
      this.createFlowDiagram();
      this.showForm = false;  // Close modal after submission

      // Reset form
      this.newFlowmeter = { name: '', location: '', position: '', flowRate: 0 };
    },

    createFlowDiagram() {
      const svg = d3.select(this.$refs.flowDiagram);
      const margin = { top: 20, right: 40, bottom: 20, left: 40 };
      const width = this.width - margin.left - margin.right;
      const height = this.height - margin.top - margin.bottom;

      // Create a single root node
      const dataWithRoot = [
        { id: "root", name: "Root", parentId: "",flowRate:"Root" }, // Root node
        ...this.flowmeterData.map(d => ({
          id: d.position,
          name: d.name,
          parentId: d.position.substring(0, d.position.lastIndexOf('.')) || "root",
          location: d.location,
          flowRate: d.flowRate
        }))
      ];

      // Use stratify to create a hierarchical structure
      const root = d3.stratify()
        .id(d => d.id)
        .parentId(d => d.parentId)
        (dataWithRoot);

      const treeLayout = d3.tree().nodeSize([200, 400]); // Adjust nodeSize for spacing
      const treeData = treeLayout(root);

      const nodes = treeData.descendants();
      const links = treeData.links();

      // Clear previous content
      svg.selectAll("*").remove();

      const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Define zoom behavior
      const zoom = d3.zoom()
        .scaleExtent([0.5, 4])  // Set zoom scale range
        .on("zoom", function(event) {
          g.attr("transform", event.transform);
        });

      svg.call(zoom);

      g.selectAll(".pipe")
        .data(links)
        .enter()
        .append("path")
        .attr("class", "pipe")
        .attr("fill", "none")
        .attr("stroke", "#d0cdd7")
        .attr("stroke-width", 20)
        .attr("d", d3.linkHorizontal()
          .x(d => d.y)
          .y(d => d.x)
        );

      g.selectAll(".water-flow")
        .data(links)
        .enter()
        .append("path")
        .attr("class", "water-flow")
        .attr("fill", "none")
        .attr("stroke", "var(--blue)")
        .attr("stroke-width", 12)
        .attr("stroke-dasharray", "10, 20")
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
            .on("end", repeat);
        });

      const node = g.selectAll(".node")
        .data(nodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.y},${d.x})`)
        .on("mouseover", function(event, d) {
          const tooltip = d3.select("#tooltip");
          tooltip
            .style("visibility", "visible")
            .html(`
              <strong>${d.data.name}</strong><br>
              Location: ${d.data.location}<br>
              Flow Rate: ${d.data.flowRate} l/s
            `);
        })
        .on("mousemove", function(event) {
          const tooltip = d3.select("#tooltip");
          tooltip
            .style("background", "var(--blue)")
            .style("opacity", "0.9")
            .style("top", (event.pageY - 139) + "px")
            .style("left", (event.pageX - 340) + "px");
        })
        .on("mouseout", function() {
          d3.select("#tooltip").style("visibility", "hidden");
        });

      node.append("circle")
        .attr("r", 40)
        .attr("fill", "var(--white)")
        .attr("stroke", "var(--blue)")
        .attr("stroke-width", 2);

      node.append("circle")
        .attr("class", "gauge")
        .attr("r", 35)
        .attr("fill", "none")
        .attr("stroke", "var(--blue)")
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

      node.append("text")
        .attr("dy", -50)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("fill", "var(--black1)")
        .text(d => d.data.location);

      node.append("text")
        .attr("class", "flow-rate-text")
        .attr("dy", 5)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("fill", "var(--blue)")
        .text(d => `${d.data.flowRate} l/s`);

      // Set initial zoom to fit the tree
      const bounds = svg.node().getBBox();
      const scale = Math.min(width / bounds.width, height / bounds.height);
      const translate = [
        (width - scale * (bounds.x + bounds.width / 2)) / 2,
        (height - scale * (bounds.y + bounds.height / 2)) / 2
      ];

      svg.transition()
        .duration(1000)
        .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
    },

    updateFlowRates() {
      const svg = d3.select(this.$refs.flowDiagram);

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
}
</script>

<style scoped>
.q-card {
  margin: auto;
  background-color: var(--white);
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 90vw;
}
.heading {
  color: var(--blue);
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-align: center;
  display: flex;
  justify-content: space-between;
}

.q-btn{
  margin-right: 10%;
}
.container {
  display: flex;
  justify-content: center;
  align-items: center;
}
.svg-container {
  width: 100%;
  height: 100%;
  overflow: auto;
  position: relative;
  border: 1px solid var(--gray);
  border-radius: 8px;
  background-color: var(--gray);
}
.pipe {
  stroke-width: 20px;
  stroke: var(--gray);
}
.water-flow {
  stroke-width: 12px;
  stroke: var(--blue);
  stroke-dasharray: 10, 20;
}
.gauge {
  transition: stroke-dasharray 1s, stroke-dashoffset 1s;
}
.tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: 8px;
  border-radius: 4px;
  pointer-events: none;
  visibility: hidden;
  font-size: 14px;
  white-space: nowrap;
}

/* Add some margin to the form */
q-form {
  margin-bottom: 2rem;
  color: white;
}
.btnsubmit{
  background: var(--blue);
  color: white;
}
</style>
