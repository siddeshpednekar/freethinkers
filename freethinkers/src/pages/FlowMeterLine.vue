<template>
    <q-page>
      <!-- Filter Dropdown -->
      <q-select
        v-model="selectedPipeline"
        :options="pipelineOptions"
        label="Select Pipeline"
        emit-value
        map-options
      />
      <div id="flowchart" ref="flowchart"></div>
      <!-- Tooltip div -->
      <div id="tooltip" ref="tooltip" class="tooltip"></div>
    </q-page>
  </template>
  
  <script>
  import * as d3 from 'd3';
  import flowlineData from 'src/assets/Flowline.json';
  
  export default {
    name: 'FlowChart',
    data() {
      return {
        selectedPipeline: null,
        pipelineOptions: [],
        processedData: [],
      };
    },
    mounted() {
      this.processData();
      this.createFlowChart();
    },
    watch: {
      selectedPipeline() {
        this.createFlowChart();  // Re-render the chart when selection changes
      },
    },
    methods: {
      processData() {
        this.processedData = flowlineData.map(item => {
          const positionParts = item.position.split('.');
          return {
            ...item,
            parent: positionParts.slice(0, -1).join('.')
          };
        });
  
        // Get unique pipelines (root positions)
        this.pipelineOptions = [...new Set(this.processedData.map(item => item.position.split('.')[0]))]
          .map(position => ({ label: `Pipeline ${position}`, value: position }));
  
        // Set the first pipeline as selected by default
        if (this.pipelineOptions.length > 0) {
          this.selectedPipeline = this.pipelineOptions[0].value;
        }
      },
      createFlowChart() {
        const width = 800;
        const height = 800;
        const margin = { top: 20, right: 120, bottom: 20, left: 120 };
  
        const svg = d3.select(this.$refs.flowchart).html('')  // Clear existing content
          .append('svg')
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom);
  
        const tooltip = d3.select(this.$refs.tooltip);
  
        // Filter data based on the selected pipeline
        const filteredData = this.processedData.filter(item => item.position.startsWith(this.selectedPipeline));
  
        const nodes = {};
        filteredData.forEach(item => {
          nodes[item.position] = {
            ...item,
            children: []
          };
        });
  
        filteredData.forEach(item => {
          if (item.parent) {
            nodes[item.parent].children.push(nodes[item.position]);
          }
        });
  
        const rootNode = Object.values(nodes).find(node => node.position === this.selectedPipeline);
  
        const root = d3.hierarchy(rootNode);
        const treeLayout = d3.tree().size([height, width]);
  
        treeLayout(root);
  
        const group = svg.append('g')
          .attr('transform', `translate(${margin.left},${margin.top})`);
  
        group.selectAll('.link')
          .data(root.links())
          .enter()
          .append('line')
          .attr('class', 'link')
          .attr('x1', d => d.source.y)
          .attr('y1', d => d.source.x)
          .attr('x2', d => d.target.y)
          .attr('y2', d => d.target.x)
          .attr('stroke', 'black');
  
        const node = group.selectAll('.node')
          .data(root.descendants())
          .enter()
          .append('g')
          .attr('class', 'node')
          .attr('transform', d => `translate(${d.y},${d.x})`);
  
        node.append('circle')
          .attr('r', 10)
          .attr('fill', 'black')
          .on('mouseover', function (event, d) {
            tooltip
              .style('opacity', 1)
              .style('left', `${event.pageX + 10}px`)
              .style('top', `${event.pageY + 10}px`)
              .html(`Name: ${d.data.name}<br>Location: ${d.data.location}<br>Type: ${d.data.type}<br>Position: ${d.data.position}`);
          })
          .on('mousemove', function (event) {
            tooltip
              .style('left', `${event.pageX + 10}px`)
              .style('top', `${event.pageY + 10}px`);
          })
          .on('mouseout', function () {
            tooltip
              .style('opacity', 0);
          });
  
        node.append('text')
          .attr('dx', 15)
          .attr('dy', 5)
          .text(d => d.data.name)
          .attr('fill', 'black');
      }
    }
  };
  </script>
  
  <style scoped>
  #flowchart {
    background-color: #f4f4f4;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }
  
  .tooltip {
    position: absolute;
    text-align: left;
    width: auto;
    height: auto;
    padding: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    border-radius: 4px;
    pointer-events: none;
    font-size: 12px;
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  .q-page {
    padding: 20px;
  }
  </style>
  