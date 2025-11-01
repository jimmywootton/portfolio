// import { fetchJSON, renderProjects } from '../global.js';
// import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// async function loadProjects() {
//     try {
//         // Fetch project data
//         const projects = await fetchJSON('../lib/projects.json');

//         // Select the container for the projects
//         const projectsContainer = document.querySelector('.projects');

//         // Render the projects with an <h2> heading
//         renderProjects(projects, projectsContainer, 'h2');

//         const titleElement = document.querySelector('.projects-title');
//         if (titleElement) {
//             titleElement.textContent = projects.length;
//         }
//     } catch (error) {
//         console.error('Error loading projects:', error);
//     }
// }

// loadProjects();

// let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

// let arc = arcGenerator({
//     startAngle: 0,
//     endAngle: 2 * Math.PI,
//   });

// d3.select('#projects-pie-plot')
// .append('path')
// .attr('d', arc)
// .attr('fill', 'red');

// let projects = await fetchJSON('../lib/projects.json');

// let rolledData = d3.rollups(
//     projects,
//     (v) => v.length,
//     (d) => d.year,
//   );

// let data = rolledData.map(([year, count]) => {
//     return { value: count, label: year };
//   });

// let sliceGenerator = d3.pie().value((d) => d.value);

// const arcData = sliceGenerator(data);


// let arcs = arcData.map((d) => arcGenerator(d));

// const colors = d3.scaleOrdinal(d3.schemeTableau10);


// arcs.forEach((arc, idx) => {
//     d3.select('#projects-pie-plot').append('path')
//         .attr('d', arc)
//         .attr('fill', colors(idx))
// });

// let legend = d3.select('.legend');
// data.forEach((d, idx) => {
//   legend
//     .append('li')
//     .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
//     .attr('class', 'legend-item')      
//     .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
// });


// import { fetchJSON, renderProjects } from '../global.js';
// import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// // --- DOM hooks
// const projectsContainer = document.querySelector('.projects');
// const titleElement = document.querySelector('.projects-title');
// const searchInput = document.querySelector('.searchBar');
// const svg = d3.select('#projects-pie-plot');     // <svg id="projects-pie-plot">
// const legend = d3.select('.legend');             // <ul class="legend">

// // --- State
// let projects = [];
// let query = '';

// // --- Helpers
// function getFilteredProjects() {
//     if (!query) return projects;
//     const q = query.toLowerCase();
//     return projects.filter(p => {
//         // Search across all values (title, year, tags, etc.)
//         const values = Object.values(p).join('\n').toLowerCase();
//         return values.includes(q);
//     });
// }

// function renderCounts(filtered) {
//     if (titleElement) titleElement.textContent = filtered.length;
// }

// // --- Pie chart renderer (reactive)
// function renderPieChart(projectsGiven) {
//     // clear previous drawing
//     svg.selectAll('*').remove();
//     legend.selectAll('*').remove();

//     // guard: nothing to show
//     if (!projectsGiven.length) return;

//     // roll up per year → [{label: year, value: count}]
//     const rolled = d3.rollups(projectsGiven, v => v.length, d => d.year)
//         .sort((a, b) => d3.ascending(a[0], b[0]));
//     const data = rolled.map(([year, count]) => ({ label: year, value: count }));

//     // pie + arcs
//     const pie = d3.pie().value(d => d.value);
//     const arcs = pie(data);
//     const radius = 60;
//     const arcGen = d3.arc().innerRadius(0).outerRadius(radius);
//     const colors = d3.scaleOrdinal(d3.schemeTableau10);

//     // ensure an SVG viewBox (so it shows up nicely)
//     svg.attr('viewBox', `${-radius - 4} ${-radius - 4} ${2 * (radius + 4)} ${2 * (radius + 4)}`);

//     svg.selectAll('path')
//         .data(arcs)
//         .join('path')
//         .attr('d', arcGen)
//         .attr('fill', (_, i) => colors(i))
//         .append('title')
//         .text(d => `${d.data.label}: ${d.data.value}`);

//     // legend
//     legend.selectAll('li')
//         .data(data)
//         .join('li')
//         .attr('class', 'legend-item')
//         .style('--color', (_, i) => colors(i))
//         .html(d => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
// }

// // --- Main
// async function init() {
//     try {
//         projects = await fetchJSON('../lib/projects.json');

//         const initial = getFilteredProjects();
//         renderProjects(initial, projectsContainer, 'h2');
//         renderCounts(initial);
//         renderPieChart(initial);
//     } catch (err) {
//         console.error('Error loading projects:', err);
//     }
// }

// init();

// // live search (use 'input' for real-time updates)
// if (searchInput) {
//     searchInput.addEventListener('input', (e) => {
//         query = e.target.value || '';
//         const filtered = getFilteredProjects();
//         renderProjects(filtered, projectsContainer, 'h2');
//         renderCounts(filtered);
//         renderPieChart(filtered);
//     });
// }


import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// --- DOM hooks
const projectsContainer = document.querySelector('.projects');
const titleElement = document.querySelector('.projects-title');
const searchInput = document.querySelector('.searchBar');
const svg = d3.select('#projects-pie-plot'); // <svg id="projects-pie-plot">
const legend = d3.select('.legend');         // <ul class="legend">

// --- State
let projects = [];
let query = '';
let selectedIndex = -1;            // -1 means no selection
let lastPieData = [];              // [{label: year, value: count}], kept for legend clicks

// --- Helpers
function getQueryFiltered() {
    if (!query) return projects;
    const q = query.toLowerCase();
    return projects.filter(p => {
        const values = Object.values(p).join('\n').toLowerCase();
        return values.includes(q);
    });
}

// Projects visible given BOTH the search and (optional) pie selection
function getVisibleProjects() {
    const base = getQueryFiltered();
    if (selectedIndex === -1) return base;
    const chosenYear = lastPieData[selectedIndex]?.label;
    if (chosenYear == null) return base;
    return base.filter(p => String(p.year) === String(chosenYear));
}

function renderCounts(filtered) {
    if (titleElement) titleElement.textContent = filtered.length;
}

// --- Pie chart renderer (reactive + selectable)
function renderPieChart(projectsGiven) {
    // clear previous drawing
    svg.selectAll('*').remove();
    legend.selectAll('*').remove();

    if (!projectsGiven.length) return;

    // Roll up by year
    const rolled = d3.rollups(projectsGiven, v => v.length, d => d.year)
        .sort((a, b) => d3.ascending(a[0], b[0]));
    const data = rolled.map(([year, count]) => ({ label: year, value: count }));
    lastPieData = data; // keep for legend click + filter

    // Build pie
    const pie = d3.pie().value(d => d.value);
    const arcs = pie(data);
    const radius = 60;
    const arcGen = d3.arc().innerRadius(0).outerRadius(radius);
    const colors = d3.scaleOrdinal(d3.schemeTableau10);
    svg.attr('viewBox', `${-radius - 4} ${-radius - 4} ${2 * (radius + 4)} ${2 * (radius + 4)}`);

    // Draw arcs
    svg.selectAll('path')
        .data(arcs)
        .join('path')
        .attr('d', arcGen)
        .attr('fill', (_, i) => colors(i))
        .attr('class', d => (d.index === selectedIndex ? 'selected' : null))
        .on('click', (event, d) => {
            const i = d.index;
            selectedIndex = (selectedIndex === i ? -1 : i);
            // Re-render everything with new selection
            const visible = getVisibleProjects();
            renderProjects(visible, projectsContainer, 'h2');
            renderCounts(visible);
            renderPieChart(getQueryFiltered()); // re-draw pie & legend from query-filtered set
        })
        .append('title')
        .text(d => `${d.data.label}: ${d.data.value}`);

    // Legend (clickable, mirrors selection)
    legend.selectAll('li')
        .data(data)
        .join('li')
        .attr('class', (d, i) => (i === selectedIndex ? 'legend-item selected' : 'legend-item'))
        .style('--color', (_, i) => colors(i))
        .html(d => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
        .on('click', (_, d) => {
            const i = arcs.find(a => a.data.label === d.label)?.index ?? -1;
            selectedIndex = (selectedIndex === i ? -1 : i);
            const visible = getVisibleProjects();
            renderProjects(visible, projectsContainer, 'h2');
            renderCounts(visible);
            renderPieChart(getQueryFiltered());
        });
}

// --- Main render (called on load and on search input)
function renderAll() {
    const visible = getVisibleProjects();
    renderProjects(visible, projectsContainer, 'h2');
    renderCounts(visible);
    // Pie/legend are based on search results only (NOT post-year-filter),
    // so you can always pick another year from the same search result set.
    renderPieChart(getQueryFiltered());
}

async function init() {
    try {
        projects = await fetchJSON('../lib/projects.json');
        renderAll();
    } catch (err) {
        console.error('Error loading projects:', err);
    }
}

init();

// Live search
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        query = e.target.value || '';
        // Keep current selectedIndex, but it will be ignored if that year isn't present
        renderAll();
    });
}
