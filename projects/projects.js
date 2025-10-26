import { fetchJSON, renderProjects } from '../global.js';
// (async function loadProjects() {
//     const projects = await fetchJSON('../lib/projects.json');
//     const projectsContainer = document.querySelector('.projects');
//     renderProjects(projects, projectsContainer, 'h2');
//     const titleElement = document.querySelector('.projects-title');
//     if (titleElement) {
//         titleElement.textContent = `${projects.length} Projects`;
//     }
// })();
document.addEventListener('DOMContentLoaded', async () => {
  const projects = await fetchJSON('../lib/projects.json');
  const projectsContainer = document.querySelector('.projects');
  renderProjects(projects, projectsContainer, 'h2');

  const titleElement = document.querySelector('.projects-title');
  if (titleElement) {
      titleElement.textContent = `${projects.length} Projects`;
  }

  const searchInput = document.querySelector('.searchBar');

  // Add search functionality
  searchInput.addEventListener('input', (event) => {
    const query = event.target.value.toLowerCase();
    const filteredProjects = projects.filter(p =>
      p.title.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    );

    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects);
  });

  // render initial chart
  renderPieChart(projects);
});


import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let projects = await fetchJSON('../lib/projects.json');

let rolledData = d3.rollups(
  projects,
  (v) => v.length,   // count projects in each year
  (d) => d.year      // group by year
);

let data = rolledData.map(([year, count]) => {
  return { label: year, value: count };
});


let sliceGenerator = d3.pie().value((d) => d.value);
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);
let arcData = sliceGenerator(data);
let arcs = arcData.map((d) => arcGenerator(d));
d3.select('svg')
        .selectAll('path')
        .data(arcData)
        .join('path')
        .attr('d', d => arcGenerator(d))
        .attr('fill', (d, i) => colors(i))
        .attr('transform', 'translate(50, 50)');

let legend = d3.select('.legend');
data.forEach((d, idx) => {
  legend
    .append('li')
    .attr('class', 'legend-item')
    .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
    .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
});

// let query = '';

// let searchInput = document.querySelector('.searchBar');

// searchInput.addEventListener('input', (event) => {
//   // update query value
//   query = event.target.value;
//   // TODO: filter the projects
//   // 
//   let filteredProjects = projects.filter((project) =>
//     project.title.includes(query),);
//   // TODO: render updated projects!
//   renderProjects(filteredProjects, document.querySelector('.projects'), 'h2');
// });

// function renderPieChart(projectsGiven) {
//   // 1. Clear previous SVG paths and legend items
//   let svg = d3.select('#projects-plot');
//   svg.selectAll('path').remove();
//   let legend = d3.select('.legend');
//   legend.selectAll('li').remove();

//   // 2. Group projects by year and count
//   let rolledData = d3.rollups(
//     projectsGiven,
//     v => v.length,
//     d => d.year
//   );

//   // 3. Convert to {label, value} objects
//   let data = rolledData.map(([year, count]) => ({ label: year, value: count }));

//   // 4. Set up D3 generators
//   let sliceGenerator = d3.pie().value(d => d.value);
//   let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
//   let colors = d3.scaleOrdinal(d3.schemeTableau10);

//   // 5. Draw paths
//   let arcData = sliceGenerator(data);
//   svg.selectAll('path')
//     .data(arcData)
//     .join('path')
//     .attr('d', d => arcGenerator(d))
//     .attr('fill', (d, i) => colors(i))
//     .attr('transform', 'translate(50, 50)');

//   // 6. Draw legend
//   data.forEach((d, idx) => {
//     legend
//       .append('li')
//       .attr('class', 'legend-item')
//       .attr('style', `--color:${colors(idx)}`)
//       .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
//   });
//   let selectedIndex = -1;
//   svg.selectAll('path')
//   .data(arcData)
//   .join('path')
//   .attr('d', d => arcGenerator(d))
//   .attr('fill', (_, i) => colors(i))
//   .attr('transform', 'translate(50, 50)')
//   .attr('class', (_, i) => i === selectedIndex ? 'selected' : '')
//   .on('click', function(event, d) {
//   const index = svg.selectAll('path').nodes().indexOf(this);

//   selectedIndex = selectedIndex === index ? -1 : index;

//   svg.selectAll('path')
//     .attr('class', (_, i) => i === selectedIndex ? 'selected' : '');

//   legend.selectAll('li')
//     .attr('class', (_, i) => i === selectedIndex ? 'legend-item selected' : 'legend-item');

//   let filteredProjects;
//   if (selectedIndex === -1) {
//     filteredProjects = projects;
//   } else {
//     const selectedYear = Number(data[selectedIndex].label); // convert to number
//     filteredProjects = projects.filter(p => p.year === selectedYear);
//   }

//   renderProjects(filteredProjects, projectsContainer, 'h2');
// });

// }

let selectedIndex = -1; // keep global

function renderPieChart(projectsGiven) {
  const svg = d3.select('#projects-plot');
  const legend = d3.select('.legend');

  // Clear previous chart and legend
  svg.selectAll('path').remove();
  legend.selectAll('li').remove();

  // Group projects by year and count
  const rolledData = d3.rollups(
    projectsGiven,
    v => v.length,
    d => d.year
  );

  // Convert to {label, value} objects
  const data = rolledData.map(([year, count]) => ({ label: year, value: count }));

  // D3 generators
  const sliceGenerator = d3.pie().value(d => d.value);
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  // Compute arcs
  const arcData = sliceGenerator(data);

  // Draw wedges
  let selectedIndex = -1; // no selection initially
  svg.selectAll('path')
    .data(arcData)
    .join('path')
    .attr('d', d => arcGenerator(d))
    .attr('fill', (_, i) => colors(i))
    .attr('transform', 'translate(50,50)')
    .attr('class', (_, i) => i === selectedIndex ? 'selected' : '')
    .on('click', function(event, d) {
      const index = arcData.indexOf(d);

      // Toggle selection
      selectedIndex = selectedIndex === index ? -1 : index;

      // Update wedge highlight
      svg.selectAll('path')
        .attr('class', (_, i) => i === selectedIndex ? 'selected' : '');

      // Update legend highlight
      legend.selectAll('li')
        .attr('class', (_, i) => i === selectedIndex ? 'legend-item selected' : 'legend-item');

      // Filter projects based on selected wedge
      let filteredProjects;
      if (selectedIndex === -1) {
        filteredProjects = projectsGiven; // show all if no selection
      } else {
        const selectedYear = data[selectedIndex].label;
        filteredProjects = projectsGiven.filter(p => p.year === selectedYear);
      }

      // Render filtered projects
      renderProjects(filteredProjects, document.querySelector('.projects'), 'h2');
    });

  // Draw legend
  data.forEach((d, idx) => {
    legend.append('li')
      .attr('class', 'legend-item')
      .attr('style', `--color:${colors(idx)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}




  