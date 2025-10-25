import { fetchJSON, renderProjects } from '../global.js';
(async function loadProjects() {
    const projects = await fetchJSON('../lib/projects.json');
    const projectsContainer = document.querySelector('.projects');
    renderProjects(projects, projectsContainer, 'h2');
    const titleElement = document.querySelector('.projects-title');
    if (titleElement) {
        titleElement.textContent = `${projects.length} Projects`;
    }
})();

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let data = [
  { value: 1, label: 'apples' },
  { value: 2, label: 'oranges' },
  { value: 3, label: 'mangos' },
  { value: 4, label: 'pears' },
  { value: 5, label: 'limes' },
  { value: 5, label: 'cherries' },
];
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
