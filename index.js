import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';


// 3. Fetch and Filter Projects
const projects = await fetchJSON('./lib/projects.json');
const latestProjects = projects.slice(0, 3);

// 4. Select the Projects Container
const projectsContainer = document.querySelector('.projects');

// 5. Render the Latest Projects
renderProjects(latestProjects, projectsContainer, 'h2');

// Step 3: Parsing the Response in index.js
const githubData = await fetchGitHubData('jimmywootton');

// Step 4: Targeting the HTML Element in index.js
const profileStats = document.querySelector('#profile-stats');

if (profileStats) {
    profileStats.innerHTML = `
        <h2>GitHub Profile Stats</h2>
        <dl class="stats-grid">
            <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
            <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
            <dt>Followers:</dt><dd>${githubData.followers}</dd>
            <dt>Following:</dt><dd>${githubData.following}</dd>
        </dl>
    `;
}