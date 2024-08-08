<template>
  <q-page padding>
  <div class="graph">
  <span class="title">constituencies vs pending poles</span>
   <div id="bar-chart" class="chart-container"></div>
   </div>
    <q-table
      :rows="notFixedPotholes"
      :columns="columns"
      row-key="properties.id"
      flat
      bordered
      separator="horizontal"
      class="my-table"
    >
      <template v-slot:body-cell-id="props">
        <q-td :props="props">
          {{ props.row.properties.id }}
        </q-td>
      </template>
      <template v-slot:body-cell-coordinates="props">
        <q-td :props="props">
          {{ props.row.geometry.coordinates.join(", ") }}
        </q-td>
      </template>
      <template v-slot:body-cell-area="props">
        <q-td :props="props">
          {{
            props.row.properties.area == null
              ? "N/A"
              : props.row.properties.area
          }}
        </q-td>
      </template>
      <template v-slot:body-cell-constituency="props">
        <q-td :props="props">
          {{ props.row.properties.constituency }}
        </q-td>
      </template>
      <template v-slot:body-cell-complaintReceived="props">
        <q-td :props="props">
          {{ props.row.properties.ComplaintReceived }}
        </q-td>
      </template>
      <template v-slot:body-cell-view="props">
        <q-td :props="props">
          <q-btn
            label="View on Map"
            @click="viewOnMap(props.row)"
            class="btn"
          />
        </q-td>
      </template>
    </q-table>

    <!-- Container for the bar chart -->
   
  </q-page>
</template>

<script>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";
import * as d3 from "d3";

export default {
  name: "PotholesNotFixedPage",
  setup() {
    const notFixedPotholes = ref([]);
    const router = useRouter();
    const columns = [
      { name: "id", label: "Pothole ID", field: "id", align: "left" },
      {
        name: "coordinates",
        label: "Coordinates",
        field: "coordinates",
        align: "left",
      },
      { name: "area", label: "Area", field: "area", align: "left" },
      {
        name: "constituency",
        label: "Constituency",
        field: "constituency",
        align: "left",
      },
      {
        name: "complaintReceived",
        label: "Complaint Received",
        field: "complaintReceived",
        align: "left",
      },
      { name: "view", label: "View on Map", field: "view", align: "center" },
    ];

    onMounted(async () => {
      try {
        const response = await axios.get("/potholeData.json");
        const features = response.data.features;
        notFixedPotholes.value = features.filter(
          (feature) => !feature.properties.FixedOn
        );
        drawChart(); // Draw chart after data is fetched
      } catch (error) {
        console.error("Error fetching pothole data:", error);
      }
    });

    const viewOnMap = (row) => {
      if (row && row.properties.id) {
        router.push({
          path: "/dashboard/maps",
          query: { id: row.properties.id },
        });
      } else {
        console.error("Pothole ID missing");
      }
    };

   const drawChart = () => {
  // Prepare data for the chart
  const data = notFixedPotholes.value.reduce((acc, pothole) => {
    const constituency = pothole.properties.constituency;
    if (!acc[constituency]) {
      acc[constituency] = 0;
    }
    acc[constituency] += 1; // Count potholes per constituency
    return acc;
  }, {});

  // Convert object to array
  const dataArray = Object.keys(data).map(key => ({
    constituency: key,
    count: data[key]
  }));

  // Set up dimensions and margins for the chart
  const margin = { top: 20, right: 30, bottom: 60, left: 70 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Clear previous chart
  d3.select("#bar-chart").select("svg").remove();

  // Create SVG container
  const svg = d3.select("#bar-chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Create scales
  const x = d3.scaleBand()
    .domain(dataArray.map(d => d.constituency))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(dataArray, d => d.count)])
    .nice()
    .range([height, 0]);

  // Draw bars
  svg.selectAll(".bar")
    .data(dataArray)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.constituency))
    .attr("y", height)  // Initial y position at the bottom
    .attr("width", x.bandwidth())
    .attr("height", 0)  // Initial height of 0
    .attr("fill", "#2a2185")
    .on('mouseover', function (event, d) {
      tooltip
        .transition()
        .duration(200)
        .style('opacity', .9);
      tooltip
        .html(`Constituency: ${d.constituency}<br>Number of Potholes: ${d.count}`)
        .style('left', `${event.pageX + 5}px`) // Adjust tooltip position
        .style('top', `${event.pageY - 28}px`)  // Adjust tooltip position
        .style('display', 'block');
    })
    .on('mousemove', function (event) {
      tooltip
        .style('left', `${event.pageX - 140}px`)
        .style('top', `${event.pageY - 140}px`);
    })
    .on('mouseout', function () {
      tooltip
        .transition()
        .duration(500)
        .style('opacity', 0);
    })
    .transition()
    .duration(2000)  // Animation duration of 2000ms (2 seconds)
    .attr("y", d => y(d.count))  // Final y position
    .attr("height", d => height - y(d.count));  // Final height

  // Add X axis
  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickSize(0))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("transform", "rotate(-45)");

  // Add Y axis
  svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y).ticks(10, "s"));

  // Add Y axis label
  svg.append("text")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 15)
    .attr("dy", ".71em")
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .style("font-weight", "300")
    .text("Number of Potholes");

  // Add X axis label
  svg.append("text")
    .attr("transform", `translate(${width / 2},${height + margin.bottom - 10})`)
    .style("text-anchor", "middle")
    .style("font-weight", "300")
    .text("Constituency");

  // Add tooltip
  const tooltip = d3.select("#bar-chart")
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0)
    .style('position', 'absolute')
    .style('background', '#2a2185')
    .style('color', '#fff')
    .style('padding', '5px 10px')
    .style('border-radius', '4px')
    .style('pointer-events', 'none'); // Ensure tooltip does not block mouse events
};




    return { notFixedPotholes, columns, viewOnMap };
  },
};
</script>

<style scoped>
.q-page {
  background: var(--gray);
}

.q-table {
  width: 100%;
  margin: 0 auto;
  max-width: 1200px;
}

.my-table tbody tr:hover {
  background-color: #f5f5f5;
}

.my-table tbody td {
  color: black;
  background: white;
  padding: 16px;
}

.my-table .q-table__title {
  font-weight: bold;
  text-align: center;
  margin-bottom: 16px;
}

.my-table {
  background: #2a2185;
  color: white;
  border-radius: 1rem;
}

.btn {
  border: 2px solid #2a2185;
  color: #2a2185;
  border-radius: 2rem;
}

.btn:hover {
  background: #2a2185;
  color: white;
}

.chart-container {
  margin-top: 20px;
}

.bar {
  fill: #2a2185;
}

.x-axis path, .x-axis line, .y-axis path, .y-axis line {
  shape-rendering: crispEdges;
}

.graph{
  display:flex;
  flex-direction:column;
  align-items:center;
}

.title{
  font-size:2rem;
  color:#2a2185;
}
</style>
