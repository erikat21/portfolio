import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line), // or just +row.line
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: 'https://github.com/vis-society/lab-7/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
        lines : lines
      };

      Object.defineProperty(ret, 'propertyName', {
        value: lines, 
        writable: true,       
        enumerable: false,    
        configurable: true   
    });
      return ret;
    });
}

function renderCommitInfo(data, commits) {
  // Create the dl element
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  // Add total LOC
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  // Add total commits
  dl.append('dt').text('Total Commits');
  dl.append('dd').text(commits.length);

  const numFiles = d3.groups(data, d => d.file).length
  dl.append('dt').text('Total Files');
  dl.append('dd').text(numFiles);

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const commitsByDay = d3.groups(commits, d => weekdays[d.datetime.getDay()]);
  const dayCounts = commitsByDay.map(([day, commits]) => ({
    day,
    count: commits.length
}));
  const mostActiveDay = d3.greatest(dayCounts, d => d.count)?.day;
  dl.append('dt').text('Day Most Work is Done');
  dl.append('dd').text(mostActiveDay);


  const avgLineLength = d3.mean(data, d => d.length);
  dl.append('dt').text('Avg Line Length');
  dl.append('dd').text(avgLineLength.toFixed(2));

  const longestLineLength = d3.max(data, d => d.length);
  dl.append('dt').text('Longest Line Length');
  dl.append('dd').text(longestLineLength);
}


// let data = await loadData();
// let commits = processCommits(data);
// console.log(commits);
let xScale, yScale; // global
let xAxis, yAxis;


function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };

  const usableWidth = width - margin.left - margin.right;
  const usableHeight = height - margin.top - margin.bottom;

  // Sort commits by total lines
  const sortedCommits = d3.sort(commits, d => -d.totalLines);

  // Scales
  xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([margin.left, margin.left + usableWidth]);

  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([margin.top + usableHeight, margin.top]); // invert y-axis

  const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);
  const rScale = d3.scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]);

  // SVG
  const svg = d3.select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  // Gridlines
  svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale).tickSize(-usableWidth).tickFormat(''));

  // Axes
  xAxis = d3.axisBottom(xScale);
  yAxis = d3.axisLeft(yScale)
    .tickFormat(d => String(d).padStart(2,'0') + ':00');

  svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${margin.top + usableHeight})`)
    .call(xAxis);

  svg.append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${margin.left},0)`)
    .call(yAxis);

  // Dots
  const dots = svg.append('g')
    .attr('class', 'dots');

  dots.selectAll('circle')
    .data(sortedCommits, (d) => d.id)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', 'var(--color-accent)')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  // Brush
  const brush = d3.brush()
  .extent([[margin.left, margin.top], [margin.left + usableWidth, margin.top + usableHeight]])
  .on('start brush end', (event) => brushed(event, d3.select('#chart').selectAll('circle').data()));



  svg.call(brush);

  // Raise dots above overlay
  svg.selectAll('.dots, .overlay ~ *').raise();
}


let data = await loadData();
let commits = processCommits(data);

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);

function updateScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select('#chart').select('svg');

  xScale = xScale.domain(d3.extent(commits, (d) => d.datetime));

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const xAxisGroup = svg.select('g.x-axis');
  xAxisGroup.selectAll('*').remove();
  xAxisGroup.call(xAxis);

  // CHANGE: we should clear out the existing xAxis and then create a new one.
  // svg
  //   .append('g')
  //   .attr('transform', `translate(0, ${usableArea.bottom})`)
  //   .call(xAxis);

  const dots = svg.select('g.dots');

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'var(--color-accent)')
    .style('fill-opacity', 0.7) // Add transparency for overlapping dots
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
  // svg.select('.brush')
  //   .call(d3.brush().extent([[margin.left, margin.top], [margin.left + usableWidth, margin.top + usableHeight]])
  //   .on('start brush end', (event) => brushed(event, filteredCommits)));
}

function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');

  // Make visible temporarily to measure size
  tooltip.hidden = false;

  // Reset width so it recalculates for small screens
  tooltip.style.width = 'auto';

  const tooltipRect = tooltip.getBoundingClientRect();
  const padding = 5;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let x = event.clientX + 10;
  let y = event.clientY + 10;

  // Clamp within viewport
  if (x + tooltipRect.width > viewportWidth - padding) {
    x = Math.max(padding, viewportWidth - tooltipRect.width - padding);
  }
  if (y + tooltipRect.height > viewportHeight - padding) {
    y = Math.max(padding, viewportHeight - tooltipRect.height - padding);
  }

  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

function brushed(event, commits) {
  const selection = event.selection;
  d3.selectAll('circle').classed('selected', (d) =>
    isCommitSelected(selection, d),
  );
  renderSelectionCount(selection, commits);
  renderLanguageBreakdown(selection, commits);
}


function isCommitSelected(selection, commit) {
  if (!selection) return false;
  
  const [[x0, y0], [x1, y1]] = selection;
  const cx = xScale(commit.datetime);
  const cy = yScale(commit.hourFrac);
  
  return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
}

function renderSelectionCount(selection, commits) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  const countElement = document.querySelector('#selection-count');
  countElement.textContent = `${selectedCommits.length || 'No'} commits selected`;
  return selectedCommits;
}

function renderLanguageBreakdown(selection, commits) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  const container = document.getElementById('language-breakdown');
  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }

  const lines = selectedCommits.flatMap((d) => d.lines);
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type
  );

  container.innerHTML = '';
  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `<dt>${language}</dt><dd>${count} lines (${formatted})</dd>`;
  }
}

function updateCommitStats(filteredCommits) {
  const lines = filteredCommits.flatMap(d => d.lines);

  const dl = d3.select('#stats dl');

  // Use existing <dd> elements by index
  const dds = dl.selectAll('dd');

  dds.nodes()[0].textContent = lines.length;                      // Total LOC
  dds.nodes()[1].textContent = filteredCommits.length;           // Total commits
  dds.nodes()[2].textContent = d3.groups(lines, d => d.file).length; // Total files

  const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const commitsByDay = d3.groups(filteredCommits, d => weekdays[d.datetime.getDay()]);
  const dayCounts = commitsByDay.map(([day, commits]) => ({ day, count: commits.length }));
  const mostActiveDay = d3.greatest(dayCounts, d => d.count)?.day || 'N/A';
  dds.nodes()[3].textContent = mostActiveDay;                   // Day most work

  const avgLineLength = d3.mean(lines, d => d.length) || 0;
  dds.nodes()[4].textContent = avgLineLength.toFixed(2);        // Avg line length

  const longestLineLength = d3.max(lines, d => d.length) || 0;
  dds.nodes()[5].textContent = longestLineLength;               // Longest line
}

let commitProgress = 100;
let timeScale = d3
  .scaleTime()
  .domain([
    d3.min(commits, (d) => d.datetime),
    d3.max(commits, (d) => d.datetime),
  ])
  .range([0, 100]);
let commitMaxTime = timeScale.invert(commitProgress);
let filteredCommits = commits;

function updateSliderDisplay() {
  const slider = document.getElementById("commit-progress");
  commitProgress = +slider.value;
  commitMaxTime = timeScale.invert(commitProgress);
  const timeEl = document.getElementById("commit-time");
  timeEl.textContent = commitMaxTime.toLocaleString();
  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
  updateScatterPlot(data, filteredCommits);
  updateFileDisplay(filteredCommits);
  updateCommitStats(filteredCommits);
}

let colors = d3.scaleOrdinal(d3.schemeTableau10);

function updateFileDisplay(filteredCommits){
  let lines = filteredCommits.flatMap((d) => d.lines);
  let files = d3
  .groups(lines, (d) => d.file)
  .map(([name, lines]) => {
    return { name, lines };
  })
  .sort((a, b) => b.lines.length - a.lines.length);
  let filesContainer = d3
  .select('#files')
  .selectAll('div')
  .data(files, (d) => d.name)
  .join(
    // This code only runs when the div is initially rendered
    (enter) =>
      enter.append('div').call((div) => {
        div.append('dt').append('code');
        div.select('dt').append('small')
        div.append('dd');
      }),
  );

  // This code updates the div info
  filesContainer.select('dt > code').text((d) => d.name);
  filesContainer.select('dt > small')
    .text(d => `${d.lines.length} lines`)
    .style('display', 'block')
    .style('opacity', 0.6)
    .style('font-size', '0.8em');
  filesContainer.select('dd')
    .selectAll('div.loc')
    .data(d => d.lines)
    .join('div')
    .attr('class', 'loc')
    .style('background-color', d => colors(d.type));
}

const timeSlider = document.getElementById("commit-progress");

timeSlider.addEventListener('input', updateSliderDisplay)
updateSliderDisplay();

d3.select('#scatter-story')
  .selectAll('.step')
  .data(commits)
  .join('div')
  .attr('class', 'step')
  .html(
    (d, i) => `
		On ${d.datetime.toLocaleString('en', {
      dateStyle: 'full',
      timeStyle: 'short',
    })},
		I made <a href="${d.url}" target="_blank">${
      i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'
    }</a>.
		I edited ${d.totalLines} lines across ${
      d3.rollups(
        d.lines,
        (D) => D.length,
        (d) => d.file,
      ).length
    } files.
		Then I looked over all I had made, and I saw that it was very good.
	`,
  );

  import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

const scroller = scrollama();

function onStepEnter(response) {
  const commit = response.element.__data__;
  
  // Filter commits to only show those up to the current one
  const filteredCommits = commits.filter(d => d.datetime <= commit.datetime);

  // Update scatter plot
  updateScatterPlot(data, filteredCommits);

  // Update files display and stats if you want
  updateFileDisplay(filteredCommits);
  updateCommitStats(filteredCommits); // if you implemented stats updating
}

scroller
  .setup({
    container: '#scrolly-1',
    step: '#scrolly-1 .step',
  })
  .onStepEnter(onStepEnter);
