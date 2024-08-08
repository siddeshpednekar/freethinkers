<template>
  <div>
    <!-- ======================= Cards ================== -->
    <div class="cardBox">
      <div class="card" v-for="(card, index) in cards" :key="index">
        <div>
          <div class="numbers">{{ card.numbers }}</div>
          <div class="cardName">{{ card.name }}</div>
        </div>
        <div class="iconBx">
          <q-icon :name="card.icon"></q-icon>
        </div>
      </div>
    </div>

    <!-- ================ Order Details List ================= -->
    <div class="details">
      <div class="recentOrders">
        <h2>Reported Potholes by Constituency</h2>
        <div ref="chart"></div>
      </div>

      <!-- ================= New Customers (Recent Potholes) ================ -->
      <div class="recentCustomers">
        <div class="cardHeader">
          <h2>Recently Reported Potholes</h2>
        </div>

        <table>
          <tr v-for="(pothole, index) in recentPotholes" :key="index">
            <td>
              <h4>
                Constituency: {{ pothole.constituency }} <br />
                <span>Date Reported: {{ pothole.ComplaintReceived }}</span><br/>
                <span>Date Fixed: {{ pothole.FixedOn==null?"NOT FIXED":pothole.FixedOn }}</span>
              </h4>
            </td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import * as d3 from "d3";

export default {
  data() {
    return {
      data: [],
      cards: [
        { numbers: "0", name: "No of Constituencies", icon: "ion-map" },
        { numbers: "0", name: "Total No of Potholes Not Fixed", icon: "ion-alert" },
        { numbers: "4", name: "No Of Flowmeters", icon: "ion-chatbubbles" },
        { numbers: "$7,842", name: "Earning", icon: "ion-cash" },
      ],
      recentPotholes: [],
    };
  },
  async mounted() {
    // Fetch the data from the JSON file
    const response = await fetch("/potholeData.json");
    const jsonData = await response.json();

    // Process the data
    const potholeCounts = {};
    let totalPotholesNotFixed = 0;

    jsonData.features.forEach((feature) => {
      const constituency = feature.properties.constituency;
      if (potholeCounts[constituency]) {
        potholeCounts[constituency]++;
      } else {
        potholeCounts[constituency] = 1;
      }

      if (!feature.properties.FixedOn) {
        totalPotholesNotFixed++;
      }
    });

    this.data = Object.entries(potholeCounts).map(([key, value]) => ({
      constituency: key,
      count: value,
    }));

    // Set the card values
    this.cards[0].numbers = Object.keys(potholeCounts).length;
    this.cards[1].numbers = totalPotholesNotFixed;

    // Sort features by ComplaintReceived date and get the 5 most recent
    this.recentPotholes = jsonData.features
      .sort((a, b) => new Date(b.properties.ComplaintReceived) - new Date(a.properties.ComplaintReceived))
      .slice(0, 5)
      .map(feature => ({
        id: feature.properties.id,
        constituency: feature.properties.constituency,
        ComplaintReceived: feature.properties.ComplaintReceived,
        FixedOn: feature.properties.FixedOn
      }));

    this.renderChart();
  },
  methods: {
  renderChart() {
    const margin = { top: 20, right: 30, bottom: 80, left: 70 };
    const width = 700 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3
      .select(this.$refs.chart)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scalePoint()
      .domain(this.data.map((d) => d.constituency))
      .range([0, width])
      .padding(0.5);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(this.data, (d) => d.count)])
      .nice()
      .range([height, 0]);

    const line = d3
      .line()
      .x((d) => x(d.constituency))
      .y((d) => y(d.count))
      .curve(d3.curveMonotoneX);

    // Add gradient for line color
    const defs = svg.append("defs");

    const gradient = defs
      .append("linearGradient")
      .attr("id", "line-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "100%");

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#2a2185");

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#2a2185");

    // Initialize the path with an empty d attribute
    const path = svg
      .append("path")
      .data([this.data])
      .attr("class", "line")
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", "url(#line-gradient)")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "0,10000") // Start with an invisible line
      .attr("stroke-dashoffset", "0");

    // Apply transition to draw the line
    path
      .transition()
      .duration(3000) // Duration of the animation
      .attr("stroke-dasharray", function () {
        const length = this.getTotalLength();
        return `${length},${length}`; // Full length of the line
      })
      .attr("stroke-dashoffset", 0); // Animate the line drawing from the start

    // Add x-axis
    svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(0).tickPadding(10))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("transform", "rotate(-45)");

    // Add y-axis
    svg
      .append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y).tickSize(0).tickPadding(10))
      .append("text")
      .attr("x", -height / 2)  // Center the text vertically
      .attr("y", -margin.left + 15) // Adjusted for better visibility
      .attr("dy", ".71em")
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .style("font-weight", "300")
      .text("Number of Potholes");
      
    // Add x-axis label
    svg
      .append("text")
      .attr(
        "transform",
        `translate(${width / 2},${height + margin.bottom - 10})`
      )
      .style("text-anchor", "middle")
      .style("font-weight", "300")
      .text("Constituency");

    // Add dots for each data point
    svg
      .selectAll(".dot")
      .data(this.data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => x(d.constituency))
      .attr("cy", (d) => y(d.count))
      .attr("r", 6)
      .attr("fill", "#2a2185")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // Add tooltip
    const tooltip = d3
      .select(this.$refs.chart)
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute');

    svg
      .selectAll('.dot')
      .on('mouseover', function (event, d) {
        // Get the bounding rectangle of the parent element
        const parentRect = this.parentNode.getBoundingClientRect();

        tooltip
          .transition()
          .duration(200)
          .style('display','block')
          .style('opacity', 0.9);
        tooltip
          .html(`Constituency: ${d.constituency}<br>Number of Potholes: ${d.count}`)
          .style('left', `${event.clientX - parentRect.left - 40}px`) // Offset by 10px from the left edge of parent
          .style('top', `${event.clientY - parentRect.top - 10}px`)  // Offset by 10px from the top edge of parent
          .style('color', '#fff')
          .style('padding', '1rem')
          .style('border-radius', '1rem')
          .style('background', '#2a2185');
      })
      .on('mouseout', function () {
        tooltip
          .transition()
          .duration(500)
          .style('display','none')
          .style('opacity', 0);
      });
  },
}

};
</script>

<style scoped>
/* ======================= Cards ====================== */
.cardBox {
  position: relative;
  width: 100%;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-gap: 30px;
}

.cardBox .card {
  position: relative;
  background: var(--white);
  padding: 30px;
  border-radius: 20px;
  display: flex;
  justify-content: space-between;
  cursor: pointer;
  box-shadow: 0 7px 25px rgba(0, 0, 0, 0.08);
}

.cardBox .card .numbers {
  position: relative;
  font-weight: 500;
  font-size: 2.5rem;
  color: var(--blue);
}

.cardBox .card .cardName {
  color: var(--black2);
  font-size: 1.1rem;
  margin-top: 5px;
}

.cardBox .card .iconBx {
  font-size: 3.5rem;
  color: var(--black2);
}

.cardBox .card:hover {
  background: var(--blue);
}
.cardBox .card:hover .numbers,
.cardBox .card:hover .cardName,
.cardBox .card:hover .iconBx {
  color: var(--white);
}

/* ================== Order Details List ============== */
.details {
  position: relative;
  width: 100%;
  padding: 20px;
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-gap: 30px;
  /* margin-top: 10px; */
}

.details .recentOrders {
  position: relative;
  display: grid;
  min-height: 500px;
  background: var(--white);
  padding: 20px;
  box-shadow: 0 7px 25px rgba(0, 0, 0, 0.08);
  border-radius: 20px;
}

.details .cardHeader {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.recentOrders h2,
.cardHeader h2 {
  font-weight: 600;
  font-size: 2rem;
  color: var(--blue);
}
.cardHeader .btn {
  position: relative;
  padding: 5px 10px;
  background: var(--blue);
  text-decoration: none;
  color: var(--white);
  border-radius: 6px;
}

.details table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}
.details table thead td {
  font-weight: 600;
}
.details .recentOrders table tr {
  color: var(--black1);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}
.details .recentOrders table tr:last-child {
  border-bottom: none;
}
.details .recentOrders table tbody tr:hover {
  background: var(--blue);
  color: var(--white);
}
.details .recentOrders table tr td {
  padding: 10px;
}
.details .recentOrders table tr td:last-child {
  text-align: end;
}
.details .recentOrders table tr td:nth-child(2) {
  text-align: end;
}
.details .recentOrders table tr td:nth-child(3) {
  text-align: center;
}
.status.delivered {
  padding: 2px 4px;
  background: #8de02c;
  color: var(--white);
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
}
.status.pending {
  padding: 2px 4px;
  background: #e9b10a;
  color: var(--white);
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
}
.status.return {
  padding: 2px 4px;
  background: #f00;
  color: var(--white);
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
}
.status.inProgress {
  padding: 2px 4px;
  background: #1795ce;
  color: var(--white);
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
}

.recentCustomers {
  position: relative;
  display: grid;
  min-height: 500px;
  padding: 20px;
  background: var(--white);
  box-shadow: 0 7px 25px rgba(0, 0, 0, 0.08);
  border-radius: 20px;
}
.recentCustomers .imgBx {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50px;
  overflow: hidden;
}
.recentCustomers .imgBx img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.recentCustomers table tr td {
  padding: 12px 10px;
}
.recentCustomers table tr td h4 {
  font-size: 16px;
  font-weight: 500;
  line-height: 1.2rem;
}
.recentCustomers table tr td h4 span {
  font-size: 14px;
  color: var(--black2);
}
.recentCustomers table tr:hover {
  background: var(--blue);
  color: var(--white);
}
.recentCustomers table tr:hover td h4 span {
  color: var(--white);
}

/* ====================== Responsive Design ========================== */
@media (max-width: 991px) {
  .navigation {
    left: -300px;
  }
  .navigation.active {
    width: 300px;
    left: 0;
  }
  .main {
    width: 100%;
    left: 0;
  }
  .main.active {
    left: 300px;
  }
  .cardBox {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .details {
    grid-template-columns: 1fr;
  }
  .recentOrders {
    overflow-x: auto;
  }
  .status.inProgress {
    white-space: nowrap;
  }
}

@media (max-width: 480px) {
  .cardBox {
    grid-template-columns: repeat(1, 1fr);
  }
  .cardHeader h2 {
    font-size: 20px;
  }
  .user {
    min-width: 40px;
  }
  .navigation {
    width: 100%;
    left: -100%;
    z-index: 1000;
  }
  .navigation.active {
    width: 100%;
    left: 0;
  }
  .toggle {
    z-index: 10001;
  }
  .main.active .toggle {
    color: #fff;
    position: fixed;
    right: 0;
    left: initial;
  }
}
</style>
