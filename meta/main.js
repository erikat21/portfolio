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

  // Array of weekday names
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Count commits per weekday
  const weekdayCounts = commits.reduce((acc, c) => {
  const day = weekdays[c.datetime.getDay()]; // getDay() returns 0 (Sun) to 6 (Sat)
  acc[day] = (acc[day] || 0) + 1;
  return acc;
}, {});
  let mostCommonDay = null;
  let maxCount = 0;

  for (const [day, count] of Object.entries(weekdayCounts)) {
    if (count > maxCount) {
      mostCommonDay = day;
      maxCount = count;
  }
}
  dl.append('dt').text('Day Most Work is Done');
  dl.append('dd').text(`${mostCommonDay}`);

  const avgLineLength = d3.mean(data, d => d.length);
  dl.append('dt').text('Avg Line Length');
  dl.append('dd').text(avgLineLength.toFixed(2));

  const longestLineLength = d3.max(data, d => d.length);
  dl.append('dt').text('Longest Line Length');
  dl.append('dd').text(longestLineLength);
}


let data = await loadData();
let commits = processCommits(data);
console.log(commits);
renderCommitInfo(data, commits);