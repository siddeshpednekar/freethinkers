<template>
  <div>
  <div class="heading">
    <span class="title">Flowmeter Data Analysis</span>
    </div>
    <div v-if="error" class="error">
      <p>Error: {{ error }}</p>
    </div>
    <div v-else-if="!data.length" class="loading">
      <p>Loading data...</p>
    </div>
    <div v-else>
      <div class="knob-container">
        <div class="knob-wrapper">
          <q-knob
            v-model="exceedCount"
            :min="0"
            :max="totalCount"
            color="red-10"
            track-color="grey-5"
            size="150px"
            class="knob"
            :disable="!knobEnabled"
          />
          <div class="knob-label">Exceeded</div>
          <div class="knob-value">{{ exceedCount }}</div>
        </div>
        <div class="knob-wrapper">
          <q-knob
            v-model="belowCount"
            :min="0"
            :max="totalCount"
            color="yellow-10"
            track-color="grey-5"
            size="150px"
            class="knob"
            :disable="!knobEnabled"
          />
          <div class="knob-label">Below</div>
          <div class="knob-value">{{ belowCount }}</div>
        </div>
        <div class="knob-wrapper">
          <q-knob
            v-model="averageCount"
            :min="0"
            :max="totalCount"
            color="green-10"
            track-color="grey-5"
            size="150px"
            class="knob"
            :disable="!knobEnabled"
          />
          <div class="knob-label">Average</div>
          <div class="knob-value">{{ averageCount }}</div>
        </div>
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
        <h2 style="font-size:2rem;">Threshold Information</h2>
        <p tyle="color:#999;padding-left:1rem;">Flowmeter {{ selectedFlowmeter }}</p>
        <p tyle="color:#999;padding-left:1rem;">Average: {{ thresholds[selectedFlowmeter].average.toFixed(2) }}</p>
        <p tyle="color:#999;padding-left:1rem;">Maximum: {{ thresholds[selectedFlowmeter].max.toFixed(2) }}</p>
        <p tyle="color:#999;padding-left:1rem;">Minimum: {{ thresholds[selectedFlowmeter].min.toFixed(2) }}</p>
        <p tyle="color:#999;padding-left:1rem;">Formula Used:</p>
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
            <tr v-for="(item, index) in filteredData" :key="index" :class="getRowClass(item.status)">
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
import axios from 'axios';
import { QKnob as VueKnob } from 'vue-knob';

export default {
  components: { QKnob },
  data() {
    return {
      rawData: [],
      data: [],
      error: null,
      selectedColor: null,
      selectedFlowmeter: '1',
      selectedMonth: '',
      thresholds: {
        1: { max: null, min: null, average: null },
        2: { max: null, min: null, average: null },
        3: { max: null, min: null, average: null },
        4: { max: null, min: null, average: null },
      },
      exceedCount: 0,
      belowCount: 0,
      averageCount: 0,
      knobEnabled: true,
      showInfo: false,
      months: []
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
            this.updateData();
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
            const month = parts[1];
            months.add(month);
          } else {
            console.warn(`Date format issue: ${item[`Flowmeter ${this.selectedFlowmeter}`]}`);
          }
        }
      });
      this.months = Array.from(months).sort();
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
      this.knobEnabled = false;
    },
    getStatusLabel(status) {
      switch (status) {
        case 'exceed': return 'Exceeded maximum threshold';
        case 'below': return 'Below minimum threshold';
        default: return 'Within average range';
      }
    },
    getRowClass(status) {
      switch (status) {
        case 'exceed': return 'exceed-row';
        case 'below': return 'below-row';
        case 'average': return 'average-row';
        default: return '';
      }
    },
    toggleInfo() {
      this.showInfo = !this.showInfo;
    },
    getMonthName(month) {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return monthNames[parseInt(month, 10) - 1] || '';
    },
    showDropdown(color) {
      this.selectedColor = color;
    }
  },
  mounted() {
    this.fetchData();
  }
};
</script>
<style scoped>
.knob-container {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.knob-wrapper {
  position: relative;
  text-align: center;
  padding: 10px;
  margin:1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease;
}

.knob-wrapper:hover {
  transform: scale(1.05);
}

.knob {
  margin: 0;
  border-radius: 50%;
  box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.3), 0 4px 10px rgba(0, 0, 0, 0.2);
}

.knob-label, .knob-value {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.4em;
  color: black;
}

.knob-label {
  top: 35%;
  font-weight: bold;
  letter-spacing: 1px;
}

.knob-value {
  bottom: 20%;
  font-size: 1.6em;
  color: #0c0b0b;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
}
/* Navigation Button Styles */
.dropdowns {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  margin-top: 10%;
}

.dropdowns button {
  background-color: white;
  color: #2a2185;
  border: 2px solid #2a2185;
  border-radius: 5px;
  padding: 8px 16px;
  margin: 0 10px;
  font-size: 1.1em;
  cursor: pointer;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.dropdowns button:hover {
  background-color: #2a2185;
  color: white;
}

/* Info Button Styles */


.dropdown-content {
  margin-top: 20px;
}

.flowmeter-info-container {
  display: flex;
  margin-bottom: 20px;
  margin-top: 0;
  justify-content: center;
  align-content: center;
  
}

.flowmeter-selector, .month-selector {
  margin: 10px;
  
}

.flowmeter-selector select, .month-selector select {
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  background-color: #f9f9f9;
  font-size: 1em;
}

.flowmeter-selector select:focus, .month-selector select:focus {
  outline: none;
  border-color: #7a7a7a;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
}
.info-button {
  background-color: #2a2185;
  color: white;
  border: 2px solid white;
  border-radius: 5px;
  padding: 0 2rem;
  cursor: pointer;
  transition: background-color 0.3s ease, color 0.3s ease;
  height: 50px;
  margin-top: 10px;
}

.info-button:hover {
  background-color: #544caa;
  color: #fff;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}


.data-table th, .data-table td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: center;
}

.data-table tr {
  color: #000;
}

.data-table .exceed-row {
  background-color: #ff4c4c;
  color: white;
}

.data-table .below-row {
  background-color: #fff176;
  color: black;
}

.data-table .average-row {
  background-color: #66bb6a;
  color: white;
}

.error {
  color: red;
  font-weight: bold;
  text-align: center;
}

.loading {
  font-style: italic;
  text-align: center;
}

.heading{
  display:flex;
  align-items:center;
  justify-content:center;
}
.title{
  font-size:1.5rem;
  background:#fff;
  margin:1rem;
  color:#222;
  box-shadow: 0 7px 25px rgba(0, 0, 0, 0.1);
  padding:1rem;
  border-radius:5rem;
}
.threshold-info{
  background:#fff;
  margin:2rem;
  border-radius:2rem;
  padding:2rem;
  box-shadow: 0 7px 25px rgba(0, 0, 0, 0.1);
  color:#222;
}

</style>