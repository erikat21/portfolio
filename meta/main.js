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

function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;

  const svg = d3
  .select('#chart')
  .append('svg')
  .attr('viewBox', `0 0 ${width} ${height}`)
  .style('overflow', 'visible');

  const xScale = d3
  .scaleTime()
  .domain(d3.extent(commits, (d) => d.datetime))
  .range([0, width])
  .nice();

  const yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

  const margin = { top: 10, right: 10, bottom: 30, left: 20 };

  const usableArea = {
  top: margin.top,
  right: width - margin.right,
  bottom: height - margin.bottom,
  left: margin.left,
  width: width - margin.left - margin.right,
  height: height - margin.top - margin.bottom,
};

// Update scales with new ranges
xScale.range([usableArea.left, usableArea.right]);
yScale.range([usableArea.bottom, usableArea.top]);

  // Create the axes
const xAxis = d3.axisBottom(xScale);
const yAxis = d3
  .axisLeft(yScale)
  .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

// Add X axis
svg
  .append('g')
  .attr('transform', `translate(0, ${usableArea.bottom})`)
  .call(xAxis);

// Add Y axis
svg
  .append('g')
  .attr('transform', `translate(${usableArea.left}, 0)`)
  .call(yAxis);
  
// Add gridlines BEFORE the axes
const gridlines = svg
  .append('g')
  .attr('class', 'gridlines')
  .attr('transform', `translate(${usableArea.left}, 0)`);

// Create gridlines as an axis with no labels and full-width ticks
gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

const dots = svg.append('g').attr('class', 'dots');
const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
const rScale = d3
  .scaleSqrt() // Change only this line
  .domain([minLines, maxLines])
  .range([2, 30]);
dots
  .selectAll('circle')
  .data(sortedCommits)
  .join('circle')
  .attr('cx', (d) => xScale(d.datetime))
  .attr('cy', (d) => yScale(d.hourFrac))
  .attr('fill', 'var(--color-accent)')
  .attr('r', (d) => rScale(d.totalLines))
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


let data = await loadData();
let commits = processCommits(data);

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
