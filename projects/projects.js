import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let selectedYear = null;
let query = '';
let projects = [];
let projectsContainer;

document.addEventListener('DOMContentLoaded', async () => {
  projects = await fetchJSON('../lib/projects.json');
  projectsContainer = document.querySelector('.projects');
  renderProjects(projects, projectsContainer, 'h2');

  renderPieChart(projects);

  const searchInput = document.querySelector('.searchBar');
  searchInput.addEventListener('input', (event) => {
    query = event.target.value.toLowerCase();
    applyCombinedFilter();
  });
});

function renderPieChart(allProjects) {
  const svg = d3.select('#projects-plot');
  const legend = d3.select('.legend');

  // Clear legend
  legend.selectAll('li').remove();

  // Group projects by year
  const rolledData = d3.rollups(allProjects, v => v.length, d => d.year);
  const data = rolledData.map(([year, count]) => ({ label: year, value: count }));

  const colors = d3.scaleOrdinal(d3.schemeTableau10);
  const pie = d3.pie().value(d => d.value);
  const arc = d3.arc().innerRadius(0).outerRadius(50);

  const arcsData = pie(data);

  // Bind data to paths
  const paths = svg.selectAll('path').data(arcsData, d => d.data.label);

  // ENTER
  paths.enter()
    .append('path')
    .attr('transform', 'translate(50,50)')
    .attr('fill', (_, i) => colors(i))
    .attr('class', d => d.data.label === selectedYear ? 'selected' : '')
    .each(function(d) { this._current = d; })
    .on('click', function(event, d) {
      const clickedYear = d.data.label;
      selectedYear = selectedYear === clickedYear ? null : clickedYear;
      applyCombinedFilter();
    })
    // initial small slice for transition
    .transition()
    .duration(500)
    .attrTween('d', function(d) {
      const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
      return t => arc(i(t));
    });

  // UPDATE
  paths.transition()
    .duration(500)
    .attrTween('d', function(d) {
      const i = d3.interpolate(this._current, d);
      this._current = i(1);
      return t => arc(i(t));
    })
    .attr('class', d => d.data.label === selectedYear ? 'selected' : '')
    .attr('fill', (_, i) => colors(i))
    .attr('transform', 'translate(50,50)');

  // EXIT
  paths.exit().remove();

  // Draw legend
  data.forEach((d, i) => {
    legend.append('li')
      .attr('class', `legend-item${d.label === selectedYear ? ' selected' : ''}`)
      .attr('style', `--color:${colors(i)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}



function updateHighlight(svg, legend, data, colors) {
  // update which slice is highlighted
  svg.selectAll('path')
    .attr('class', d => (d.data.label === selectedYear ? 'selected' : ''));

  legend.selectAll('li')
    .attr('class', (d, i) => {
      const label = data[i].label;
      return label === selectedYear ? 'legend-item selected' : 'legend-item';
    });
}

function applyCombinedFilter() {
  let filtered = projects.filter(p => {
    const matchesQuery =
      p.title.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query);
    const matchesYear = !selectedYear || p.year === selectedYear;
    return matchesQuery && matchesYear;
  });

  renderProjects(filtered, projectsContainer, 'h2');
  renderPieChart(
    query
      ? projects.filter(p =>
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
        )
      : projects
  );
}
