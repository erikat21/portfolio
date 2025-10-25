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
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

let data = [1, 2, 3, 4, 5, 5];
let total = 0;

for (let d of data) {
  total += d;
}
let angle = 0;
let arcData = [];

for (let d of data) {
  let endAngle = angle + (d / total) * 2 * Math.PI;
  arcData.push({ startAngle: angle, endAngle });
  angle = endAngle;
}
let colors = d3.scaleOrdinal(d3.schemeTableau10);
let arcs = arcData.map((d) => arcGenerator(d));
arcs.forEach((arc, idx) => {
  d3.select('svg').append('path').attr('d', arc).attr('fill', colors(idx));
});
