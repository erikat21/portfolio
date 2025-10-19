import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';
(async function loadLatestProjects() {
    try {
        const projects = await fetchJSON('./lib/projects.json');
        const latestProjects = projects.slice(0, 3);
        const projectsContainer = document.querySelector('.projects');
        renderProjects(latestProjects, projectsContainer, 'h3');
    } catch (err) {
    console.error('Error loading latest projects:', err);
    }
})();

(async function loadHomepage() {
    try {
        const githubData = await fetchGitHubData('erikat21');
        console.log('GitHub data loaded:', githubData);
        const profileStats = document.querySelector('#profile-stats');
        if (profileStats) {
            profileStats.innerHTML = `
            <dl>
                <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
                <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
                <dt>Followers:</dt><dd>${githubData.followers}</dd>
                <dt>Following:</dt><dd>${githubData.following}</dd>
            </dl>
        `;
        }
    }  catch (err) {
        console.error('Error loading GitHub data:', err);
    }
})();
