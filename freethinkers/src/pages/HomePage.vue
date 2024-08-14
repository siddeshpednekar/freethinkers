<template>
  <div>
    <!-- ======================= Cards ================== -->
    <div class="cardBox">
      <div class="card" v-for="(card, index) in cards" :key="index" @click="handleCardClick(index)">
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
          <tr v-for="(pothole, index) in recentPotholes" :key="index" @click="showPotholeDetails(pothole)">
            <td>
              <h4>
                Constituency: {{ pothole.constituency }} <br />
                <span>Date Reported: {{ pothole.ComplaintReceived }}</span><br/>
                <span>Date Fixed: {{ pothole.FixedOn == null ? "NOT FIXED" : pothole.FixedOn }}</span>
              </h4>
            </td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Modal for displaying constituency list -->
   <q-dialog v-model="isConstituencyDialogVisible" class="custom-dialog">
  <q-card>
    <q-card-section>
      <div class="dialog-header">
        <div class="text-h6">Total Constituencies</div>
        <q-icon name="close" style="margin-left:2rem;" @click="isConstituencyDialogVisible = false" class="close-icon" />
      </div>
    </q-card-section>

    <q-card-section>
      <!-- Table for constituency details -->
      <table class="constituency-table">
        <thead>
          <tr>
            <th class="text-left" style="color:#2a2185;">Constituencies</th>
            <th class="text-left" style="color:#2a2185;">Potholes Reported</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(constituency, index) in constituencyList" :key="index">
            <td>{{ constituency.name }}</td>
            <td>{{ constituency.pendingPotholes }}</td>
          </tr>
        </tbody>
      </table>
    </q-card-section>
    
    <q-card-actions>
      <q-btn @click="isConstituencyDialogVisible = false" style="background:#2a2185;color:white;" label="Close" />
    </q-card-actions>
  </q-card>
</q-dialog>


    <!-- Modal for displaying detailed information -->
    <q-dialog v-model="isModalVisible" class="custom-dialog">
      <q-card>
        <q-card-section>
          <div class="dialog-header">
            <div class="text-h6">Pothole Details</div>
            <q-icon name="close" @click="isModalVisible = false" style="margin-left:1rem;" class="close-icon" />
          </div>
        </q-card-section>

        <q-card-section>
          <div><strong>ID:</strong> {{ selectedPothole.id }}</div>
          <div><strong>Coordinates:</strong> {{ selectedPothole.coordinates }}</div>
          <div><strong>Area:</strong> {{ selectedPothole.area == null ? "NA" : selectedPothole.area }}</div>
          <div><strong>Fixed On:</strong> {{ selectedPothole.FixedOn == null ? "NOT FIXED" : selectedPothole.FixedOn }}</div>
          <div><strong>Constituency:</strong> {{ selectedPothole.constituency }}</div>
          <div><strong>PWD Verified On:</strong> {{ selectedPothole.PWDVerifiedOn == null ? "NA" : selectedPothole.PWDVerifiedOn }}</div>
          <div><strong>Complaint Received:</strong> {{ selectedPothole.ComplaintReceived }}</div>
          <div><strong>Assigned To Contractor:</strong> {{ selectedPothole.AssignedToContractor == null ? "NA" : selectedPothole.AssignedToContractor }}</div>
        </q-card-section>
        <q-card-actions>
          <q-btn @click="goToMapPage" style="background:#2a2185;color:white;" label="View on Map" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>


<script>
import * as d3 from "d3";
import { QDialog, QCard, QCardSection, QCardActions, QBtn } from 'quasar';
import { useRouter } from 'vue-router';

export default {
  components: {
    QDialog,
    QCard,
    QCardSection,
    QCardActions,
    QBtn
  },
  data() {
    return {
      data: [],
      cards: [
        { numbers: "0", name: "No of Constituencies", icon: "ion-map" },
        { numbers: "0", name: "Potholes Not Fixed", icon: "ion-alert" },
        { numbers: "4", name: "Flowmeters", icon: "ion-chatbubbles" },
        { numbers: "0", name: "Estimated Area Pending", icon: "ion-square" },
      ],
      recentPotholes: [],
      isModalVisible: false,
      isConstituencyDialogVisible: false,
      selectedPothole: {},
      constituencyList: [],
      router: useRouter()
    };
  },
  async mounted() {
    const response = await fetch("/potholeData.json");
    const jsonData = await response.json();

    const potholeCounts = {};
    let totalPotholesNotFixed = 0;
    let totalAreaFixed=0;
    jsonData.features.forEach((feature) => {
      const constituency = feature.properties.constituency;
      if (potholeCounts[constituency]) {
        potholeCounts[constituency]++;
      } else {
        potholeCounts[constituency] = 1;
      }

      if (!feature.properties.FixedOn) {
        totalPotholesNotFixed++;
        totalAreaFixed+=feature.properties.area;
      }
    });
    console.log(totalAreaFixed)
    this.data = Object.entries(potholeCounts).map(([key, value]) => ({
      constituency: key,
      count: value,
    }));

    this.cards[0].numbers = Object.keys(potholeCounts).length;
    this.cards[1].numbers = totalPotholesNotFixed;
let estimatedArea = this.calculateEstimatedArea(); // Replace with your calculation logic
  this.cards[3].numbers = `${totalAreaFixed} sq.ft`;
    this.constituencyList = this.data.map(d => ({
      name: d.constituency,
      pendingPotholes: d.count
    })).sort((a, b) => a.pendingPotholes - b.pendingPotholes);;

    this.recentPotholes = jsonData.features
      .sort((a, b) => new Date(b.properties.ComplaintReceived) - new Date(a.properties.ComplaintReceived))
      .slice(0, 5)
      .map(feature => ({
        id: feature.properties.id,
        coordinates: feature.geometry.coordinates.join(", "),
        area: feature.properties.area,
        constituency: feature.properties.constituency,
        ComplaintReceived: feature.properties.ComplaintReceived,
        FixedOn: feature.properties.FixedOn,
        PWDVerifiedOn: feature.properties.PWDVerifiedOn,
        AssignedToContractor: feature.properties.AssignedToContractor
      }));

    this.renderChart();
  },
  methods: {
    calculateEstimatedArea() {
    // Example logic to calculate area (replace with your logic)
    let totalArea = 0;
    this.recentPotholes.forEach(pothole => {
      if (pothole.area) {
        totalArea += pothole.area;
      }
    });
    return totalArea;
  },
    handleCardClick(index) {
      if (index === 0) {
        this.isConstituencyDialogVisible = true;
      } else if (index === 1) {
        this.router.push('/dashboard/notfixed');
      }
    },
    showPotholeDetails(pothole) {
      this.selectedPothole = pothole;
      this.isModalVisible = true;
    },
    goToMapPage() {
      if (this.selectedPothole && this.selectedPothole.id) {
      this.router.push({ 
        path: '/dashboard/maps', 
        query: { id: this.selectedPothole.id } 
      });
    } else {
      console.error('No pothole selected or pothole ID missing');
    }
  },
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
      .scaleBand()
      .domain(this.data.map((d) => d.constituency))
      .range([0, width])
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(this.data, (d) => d.count)])
      .nice()
      .range([height, 0]);

    // Add x-axis
    svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("transform", "rotate(-45)");

    // Add y-axis
    svg
      .append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y))
      .append("text")
      .attr("x", -height / 2)
      .attr("y", -margin.left + 15)
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

    // Add tooltip
    const tooltip = d3
      .select(this.$refs.chart)
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute');

    // Add bars with transition
    svg
      .selectAll(".bar")
      .data(this.data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.constituency))
      .attr("y", height)  // Initial y position at the bottom
      .attr("width", x.bandwidth())
      .attr("height", 0)  // Initial height of 0
      .attr("fill", "#2a2185")
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
      })
      .transition()
      .duration(2000)  // Animation duration of 1000ms (1 second)
      .attr("y", (d) => y(d.count))  // Final y position
      .attr("height", (d) => height - y(d.count));  // Final height
  },
},

};
</script>

<style scoped>

/* ======================= Cards ====================== */


.constituency-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.constituency-table td {
  padding: 10px;
  border-bottom: 1px solid #ddd;
  font-size: 1rem;
}

.constituency-table td:first-child {
  font-weight: bold;
}

.constituency-table tr:hover {
  background-color: #f5f5f5;
}

.custom-dialog .q-card {
  max-width: 500px;
  margin: auto;
  background-color: #ffffff; /* White background for clarity */
  border-radius: 12px; /* Slightly more rounded corners */
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3); /* Slightly deeper shadow for more emphasis */
  padding: 20px;
  position: relative;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #2a2185; /* Dark blue separator line */
  padding-bottom: 15px;
  margin-bottom: 20px;
}

.text-h6 {
  color: #2a2185; /* Dark blue color for header text */
  font-size: 1.5rem; /* Larger font size for prominence */
  font-weight: 600; /* Slightly bolder text */
}

.close-icon {
  cursor: pointer;
  color: #2a2185; /* Dark blue color */
  font-size: 2rem; /* Larger icon size for better visibility */
  transition: color 0.3s, transform 0.3s; /* Smooth transition for color and scale */
}

.close-icon:hover {
  color: #4f46b4; /* Red color on hover for visual feedback */
  transform: scale(1.1); /* Slightly increase size on hover */
}

.q-card-section {
  padding: 15px 20px;
}

.q-card-section div {
  margin: 12px 0px; /* Increased spacing for better readability */
  font-size: 1rem; /* Standard font size */
  color: #333; /* Dark grey text color */
}

.q-card-section div strong {
  color: #2a2185; /* Dark blue for labels */
}

.q-card-section div:last-child {
  margin-bottom: 0; /* Remove margin from the last item */
}
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
