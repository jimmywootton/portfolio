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
  
        Object.defineProperty(ret, 'lines', {
          value: lines,
          enumerable: false,
          writable: false,
          configurable: false,
        });
  
        return ret;
      });
}




function bucketPeriod(dt) {
    const h = dt.getHours();
    if (h >= 5 && h < 12) return 'morning';
    if (h >= 12 && h < 17) return 'afternoon';
    if (h >= 17 && h < 21) return 'evening';
    return 'night';
}
  
function computeStats(data, commits) {
    // Number of files (distinct)
    const numFiles = d3.group(data, d => d.file).size;
  
    // File lengths (max line index per file)
    const fileLengths = d3.rollups(
      data,
      v => d3.max(v, d => d.line),
      d => d.file
    );
    const maxFileLen = d3.max(fileLengths, d => d[1]);
    const longestFile = d3.greatest(fileLengths, d => d[1])?.[0] ?? null;
    const avgFileLen = d3.mean(fileLengths, d => d[1]);
  
    // Depth stats
    const maxDepth = d3.max(data, d => d.depth);
    const deepestLine = d3.greatest(data, d => d.depth);
  
    // Time-of-day bucket with most work (counts rows/lines touched)
    const byPeriod = d3.rollups(data, v => v.length, d => bucketPeriod(d.datetime));
    const peakPeriod = d3.greatest(byPeriod, d => d[1])?.[0] ?? null;
  
    // Day of week with most work
    const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const byWeekday = d3.rollups(
      data,
      v => v.length,
      d => dayName[d.datetime.getDay()]
    );
    const peakWeekday = d3.greatest(byWeekday, d => d[1])?.[0] ?? null;
  
    return {
      totalLOC: data.length,
      totalCommits: commits.length,
      numFiles,
      maxFileLen,
      longestFile,
      avgFileLen,
      maxDepth,
      deepestLine,   // full row (file, line, etc.)
      peakPeriod,
      peakWeekday
    };
}
  
function renderCommitInfo(data, commits) {
    const s = computeStats(data, commits);
  
    const wrapper = d3.select('#stats')
        .append('section')
        .attr('id', 'profile-stats');

    const dl = wrapper.append('dl').attr('class', 'stats-grid');  
    // Required examples
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(s.totalLOC);
  
    dl.append('dt').text('Total commits');
    dl.append('dd').text(s.totalCommits);
  
    // Pick ~3–4 additional stats (feel free to remove or swap)
    dl.append('dt').text('Files');
    dl.append('dd').text(s.numFiles);
  
    dl.append('dt').text('Average file length');
    dl.append('dd').text(Math.round(s.avgFileLen ?? 0));
  
    dl.append('dt').text('Longest file (lines)');
    dl.append('dd').text(`${s.longestFile ?? '—'}${s.maxFileLen ? ` (${s.maxFileLen})` : ''}`);
  
    dl.append('dt').text('Max depth');
    dl.append('dd').text(s.maxDepth ?? '—');
  
    dl.append('dt').text('Most active period');
    dl.append('dd').text(s.peakPeriod ?? '—');
  
    dl.append('dt').text('Busiest weekday');
    dl.append('dd').text(s.peakWeekday ?? '—');
}


function createBrushSelector(svg) {
    // Basic brush with default handlers (we’ll hook events later)
    const brush = d3.brush();
    svg.call(brush);
}

function isCommitSelected(selection, commit, xScale, yScale) {
	if (!selection) return false;
	const [[x0, y0], [x1, y1]] = selection;
	const cx = xScale(commit.datetime);
	const cy = yScale(commit.hourFrac);
	return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
  }

  
function renderScatterPlot(data, commits) {
    const width = 1000, height = 600;
  
    let [minLines, maxLines] = d3.extent(commits, d => d.totalLines);
    if (minLines == null || maxLines == null) { minLines = 0; maxLines = 1; }
    if (minLines === maxLines) { minLines = 0; }
  
    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);
  
    if (!commits?.length) { d3.select('#chart').append('p').text('No commits to display.'); return; }
    if (!commits.every(d => d.datetime instanceof Date && !isNaN(d.datetime))) {
      d3.select('#chart').append('p').text('Commit datetimes are missing or invalid.'); return;
    }
  
    const svg = d3.select('#chart').append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('overflow', 'visible');
  
    const xScale = d3.scaleTime()
      .domain(d3.extent(commits, d => d.datetime))
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
  
    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);
  
    // Gridlines (before axes so axes render on top)
    svg.append('g')
      .attr('class', 'gridlines')
      .attr('transform', `translate(${usableArea.left},0)`)
      .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));
  
    // Dots
    const dots = svg.append('g').attr('class', 'dots');
    const sortedCommits = d3.sort(commits, d => -d.totalLines);
  
    dots.selectAll('circle')
      .data(sortedCommits)
      .join('circle')
      .attr('cx', d => xScale(d.datetime))
      .attr('cy', d => yScale(d.hourFrac))
      .attr('r', d => rScale(d.totalLines))
      .attr('fill', 'steelblue')
      .style('fill-opacity', 0.7)
      .attr('stroke', 'white')
      .attr('stroke-width', 0.5)
      .on('mouseenter', (event, commit) => {
        d3.select(event.currentTarget).style('fill-opacity', 1);
        renderTooltipContent(commit);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
      })
      .on('mousemove', (event) => updateTooltipPosition(event))
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget).style('fill-opacity', 0.7);
        updateTooltipVisibility(false);
      });
  
    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${usableArea.bottom})`)
      .call(d3.axisBottom(xScale));
  
    svg.append('g')
      .attr('transform', `translate(${usableArea.left},0)`)
      .call(d3.axisLeft(yScale).tickFormat(d => String(d % 24).padStart(2, '0') + ':00'));
  
	// Brush (after dots so handler can see `dots`)
	const brush = d3.brush()
	.extent([[usableArea.left, usableArea.top], [usableArea.right, usableArea.bottom]])
	.on('start brush end', brushed);

	svg.call(brush);

	// Make sure the brush overlay sits behind, and dots are on top
	svg.select('.overlay').lower();
	dots.raise();


	// --- Step 5.4: selection test (pixel space) ---
	function isCommitSelected(selection, commit) {
	if (!selection) return false;
	const [[x0, y0], [x1, y1]] = selection;
	const cx = xScale(commit.datetime);
	const cy = yScale(commit.hourFrac);
	return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
	}

	// --- Step 5.5: selection count ---
	function renderSelectionCount(selection) {
	const selectedCommits = selection ? commits.filter(d => isCommitSelected(selection, d)) : [];
	const el = document.querySelector('#selection-count');
	el.textContent = `${selectedCommits.length || 'No'} commits selected`;
	return selectedCommits;
	}

	// --- Step 5.6: language breakdown (uses hidden commit.lines) ---
	function renderLanguageBreakdown(selection) {
	const selectedCommits = selection ? commits.filter(d => isCommitSelected(selection, d)) : [];
	const container = document.getElementById('language-breakdown');

	if (selectedCommits.length === 0) {
		container.innerHTML = '';
		return;
	}

	// Flatten the line objects stored on each commit
	const lines = selectedCommits.flatMap(d => d.lines);

	// Count lines per language/type
	const breakdown = d3.rollup(
		lines,
		v => v.length,
		d => d.type
	);

	container.innerHTML = '';
	for (const [language, count] of breakdown) {
		const proportion = count / lines.length;
		const formatted = d3.format('.1~%')(proportion);
		container.innerHTML += `
		<dt>${language ?? 'Unknown'}</dt>
		<dd>${count} lines (${formatted})</dd>
		`;
	}
	}

	// --- Brush handler wires everything together ---
	function brushed(event) {
	const selection = event.selection;

	// limit to our dots group (don’t select unrelated circles)
	const circles = dots.selectAll('circle');
	circles.classed('selected', d => isCommitSelected(selection, d));

	// side readouts
	renderSelectionCount(selection);
	renderLanguageBreakdown(selection);
	}

	// (nice UX) click empty space to clear selection
	svg.on('click', (event) => {
	if (d3.brushSelection(svg.node())) return;
	svg.call(brush.move, null);
	});

	// Keep overlay behind interactive layers (tooltips still work)
	svg.selectAll('.dots, .overlay ~ *').raise();

}
  

  function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    if (!tooltip) return;
    tooltip.hidden = !isVisible;
  }
  
  function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    if (!tooltip) return;
    // Use clientX/Y (viewport coords) because tooltip is position: fixed
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
  }
  
  // Minimal content renderer for a commit
  function renderTooltipContent(commit) {
    const t = document.getElementById('commit-tooltip');
    if (!t) return;
    const time = commit.datetime
      ? commit.datetime.toLocaleString([], { hour: '2-digit', minute: '2-digit', year: 'numeric', month: 'short', day: '2-digit' })
      : `${commit.date ?? ''} ${commit.time ?? ''}`;
  
    t.innerHTML = `
      <dt>Commit</dt><dd><a href="${commit.url}" target="_blank" rel="noopener">${commit.id.slice(0, 7)}</a></dd>
      <dt>Author</dt><dd>${commit.author ?? '—'}</dd>
      <dt>Date</dt><dd>${time}</dd>
      <dt>Lines</dt><dd>${commit.totalLines}</dd>
    `;
  }
  


let data = await loadData();
let commits = processCommits(data);
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
