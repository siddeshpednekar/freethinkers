<template>
  <div>
    <h1>Flowmeter Data Analysis</h1>
    <div v-if="error" class="error">
      <p>Error: {{ error }}</p>
    </div>
    <div v-else-if="!data.length" class="loading">
      <p>Loading data...</p>
    </div>
    <div v-else>
      <div class="knob-container">
        <q-knob
          v-model="exceedCount"
          :min="0"
          :max="totalCount"
          label="Exceeded"
          color="red"
          size="150px"
          class="knob"
          :disable="!knobEnabled"
        >
          <template #label>
            <div class="knob-label">Exceeded</div>
          </template>
        </q-knob>
        <q-knob
          v-model="belowCount"
          :min="0"
          :max="totalCount"
          label="Below"
          color="yellow"
          size="150px"
          class="knob"
          :disable="!knobEnabled"
        >
          <template #label>
            <div class="knob-label">Below</div>
          </template>
        </q-knob>
        <q-knob
          v-model="averageCount"
          :min="0"
          :max="totalCount"
          label="Average"
          color="green"
          size="150px"
          class="knob"
          :disable="!knobEnabled"
        >
          <template #label>
            <div class="knob-label">Average</div>
          </template>
        </q-knob>
      </div>
      <div class="dropdowns">
        <button @click="showDropdown('exceed')">Exceed</button>
        <button @click="showDropdown('below')">Below</button>
        <button @click="showDropdown('average')">Average</button>
        <button @click="showDropdown('all')">All Data</button>
      </div>
      <div class="flowmeter-info-container">
        <div class="flowmeter-selector">
          <select v-model="selectedFlowmeter" @change="updateData">
            <option value="1">Flowmeter 1</option>
            <option value="2">Flowmeter 2</option>
            <option value="3">Flowmeter 3</option>
            <option value="4">Flowmeter 4</option>
          </select>
        </div>
        <div class="month-selector">
          <select v-model="selectedMonth" @change="updateData">
            <option value="">Select Month</option>
            <option v-for="month in months" :key="month" :value="month">
              {{ getMonthName(month) }}
            </option>
          </select>
        </div>
        <button @click="toggleInfo" class="info-button">Info</button>
      </div>
      <div v-if="showInfo" class="threshold-info">
        <h2>Threshold Information</h2>
        <p>Flowmeter {{ selectedFlowmeter }}</p>
        <p>Average: {{ thresholds[selectedFlowmeter].average.toFixed(2) }}</p>
        <p>Maximum: {{ thresholds[selectedFlowmeter].max.toFixed(2) }}</p>
        <p>Minimum: {{ thresholds[selectedFlowmeter].min.toFixed(2) }}</p>
        <p>Formula Used:</p>
        <ul>
          <li>Maximum = Average * 1.1</li>
          <li>Minimum = Average * 0.9</li>
        </ul>
      </div>
      <div v-if="selectedColor || selectedMonth" class="dropdown-content">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in filteredData" :key="index" :class="item.status">
              <td>{{ item.date }}</td>
              <td>{{ item.value.toFixed(2) }}</td>
              <td>{{ getStatusLabel(item.status) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'; // Import axios
import { QKnob as VueKnob } from 'vue-knob'; // Import QKnob with a different name

export default {
  components: { QKnob },
  data() {
    return {
      rawData: [],
      data: [],
      error: null,
      selectedColor: null,
      selectedFlowmeter: '1', // Default to Flowmeter 1
      selectedMonth: '', // Use an empty string for no month selected
      thresholds: {
        1: { max: null, min: null, average: null },
        2: { max: null, min: null, average: null },
        3: { max: null, min: null, average: null },
        4: { max: null, min: null, average: null },
      },
      exceedCount: 0,
      belowCount: 0,
      averageCount: 0,
      knobEnabled: true, // Add knobEnabled to control knob interactivity
      showInfo: false, // Toggle for showing/hiding info
      months: [] // Array to hold months for dropdown
    };
  },
  computed: {
    filteredData() {
      let data = this.data;
      if (this.selectedColor && this.selectedColor !== 'all') {
        data = data.filter(item => item.status === this.selectedColor);
      }
      if (this.selectedMonth) {
        data = data.filter(item => item.date && item.date.split('-')[1] === this.selectedMonth);
      }
      return data;
    },
    totalCount() {
      return this.data.length;
    }
  },
  methods: {
    async fetchData() {
      try {
        const response = await axios.get('/data.json', { headers: { 'Accept': 'application/json' } });

        if (response.headers['content-type'].includes('application/json')) {
          if (response.data && Array.isArray(response.data)) {
            this.rawData = response.data.slice(0, 1500);
            this.extractMonths();
            this.calculateThresholds();
            this.updateData(); // Ensure data is updated on fetch
          } else {
            this.error = "Fetched data is not in the expected format.";
          }
        } else {
          this.error = "Fetched data is not in JSON format.";
        }
      } catch (error) {
        this.error = `Error fetching data: ${error.message}`;
      }
    },
    extractMonths() {
      const months = new Set();
      this.rawData.forEach(item => {
        if (item[`Flowmeter ${this.selectedFlowmeter}`]) {
          const date = item[`Flowmeter ${this.selectedFlowmeter}`].split(' ')[0];
          const parts = date.split('-');
          if (parts.length === 3) {
            const month = parts[1]; // Extract month from date
            months.add(month);
          } else {
            console.warn(`Date format issue: ${item[`Flowmeter ${this.selectedFlowmeter}`]}`);
          }
        }
      });
      this.months = Array.from(months).sort(); // Sort months for dropdown
    },
    calculateThresholds() {
      for (let i = 1; i <= 4; i++) {
        const flowmeterField = `field${i * 2}`;
        const values = this.rawData.map(item => parseFloat(item[flowmeterField])).filter(value => !isNaN(value));

        if (values.length > 0) {
          const sum = values.reduce((acc, value) => acc + value, 0);
          const average = sum / values.length;

          this.thresholds[i].average = average;
          this.thresholds[i].max = average * 1.1;
          this.thresholds[i].min = average * 0.9;
        }
      }
    },
    updateData() {
      const flowmeterField = `field${this.selectedFlowmeter * 2}`;
      const selectedThresholds = this.thresholds[this.selectedFlowmeter];

      this.data = this.rawData.map(item => {
        const value = parseFloat(item[flowmeterField]);
        let status = 'average';

        if (value > selectedThresholds.max) {
          status = 'exceed';
        } else if (value < selectedThresholds.min) {
          status = 'below';
        }

        return {
          date: item[`Flowmeter ${this.selectedFlowmeter}`],
          value,
          status
        };
      });

      this.updateKnobs();
    },
    updateKnobs() {
      this.exceedCount = this.data.filter(item => item.status === 'exceed').length;
      this.belowCount = this.data.filter(item => item.status === 'below').length;
      this.averageCount = this.data.filter(item => item.status === 'average').length;
      this.knobEnabled = false; // Disable knob interaction after updating
    },
    getStatusLabel(status) {
      switch (status) {
        case 'exceed': return 'Exceeded maximum threshold';
        case 'below': return 'Below minimum threshold';
        default: return 'Within average range';
      }
    },
    showDropdown(color) {
      this.selectedColor = color;
      this.updateData(); // Refresh data when filter changes
    },
    toggleInfo() {
      this.showInfo = !this.showInfo;
    },
    getMonthName(month) {
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return months[parseInt(month, 10) - 1];
    }
  },
  mounted() {
    this.fetchData(); // Fetch data on mount
    this.selectedFlowmeter = '1'; // Ensure Flowmeter 1 is selected by default
    this.updateData(); // Update data to show Flowmeter 1's data
  }
};
</script>




<style>
h1 {
  font-size: 28px;
  margin-bottom: 20px;
  color: #333;
}

.error {
  color: #e74c3c;
  font-weight: bold;
}

.loading {
  color: #3498db;
}

.filters {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.dropdowns button {
  background-color: #2a2185;
  border: 1px solid #ddd;
  padding: 10px;
  margin-right: 10px;
  cursor: pointer;
  border-radius: 5px;
  font-size: 16px;
  color: white;
}

.dropdowns button:hover {
  background-color: #e0e0e0;
}

.month-filter select {
  padding: 10px;
  font-size: 16px;
  border-radius: 5px;
}

.flowmeter-info-container {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.flowmeter-selector {
  margin-right: 10px;
}

.flowmeter-selector select {
  padding: 10px;
  font-size: 16px;
  border-radius: 5px;
}

.info-button {
  background-color: #2a2185; /* Match the dropdown color */
  color: white;
  border: none;
  padding: 10px;
  cursor: pointer;
  border-radius: 5px;
  font-size: 16px;
}

.info-button:hover {
  background-color: #2980b9;
}

.dropdown-content {
  display: block;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.data-table th, .data-table td {
  padding: 10px;
  border: 1px solid #ddd;
  text-align: left;
}

.data-table th {
  background-color: #f4f4f4;
  font-weight: bold;
}

.data-table .exceed {
  background-color: #ffcccc; /* Light red */
}

.data-table .below {
  background-color: #fff3cd; /* Light yellow */
}

.data-table .average {
  background-color: #d4edda; /* Light green */
}

.threshold-info {
  margin-top: 20px;
  padding: 10px;
  border: 1px solid #ddd;
  background-color: #2a2185; /* Updated color */
  color: #fff; /* Text color inside threshold-info */
}

.threshold-info h2 {
  font-size: 20px;
  margin-bottom: 10px;
}

.threshold-info p {
  margin: 5px 0;
}

.threshold-info ul {
  margin: 0;
  padding-left: 20px;
  list-style-type: disc;
}

.knob-container {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px; /* Space below the knobs */
}

.q-knob {
  position: relative;
  width: 150px; /* Adjust width */
  height: 150px; /* Adjust height */
}

.knob-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 18px; /* Adjust font size */
  color: #fff; /* Adjust text color */
  text-align: center;
  width: 100%; /* Ensure the label fits within the knob */
  line-height: 1.2; /* Adjust line height for better spacing */
}
</style>