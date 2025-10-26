import { fetchJSON, renderProjects } from '../global.js';

async function loadProjects() {
    try {
        // Fetch project data
        const projects = await fetchJSON('../lib/projects.json');

        // Select the container for the projects
        const projectsContainer = document.querySelector('.projects');

        // Render the projects with an <h2> heading
        renderProjects(projects, projectsContainer, 'h2');

        const titleElement = document.querySelector('.projects-title');
        if (titleElement) {
            titleElement.textContent = projects.length;
        }
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

loadProjects();
