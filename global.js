console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// const navLinks = $$("nav a");

// let currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname,
// );

// currentLink?.classList.add('current');

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"                  // Local server
  : "/portfolio/";         // GitHub Pages repo name

let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'resume/', title: 'Resume' },
  { url: "https://github.com/erikat21", title: 'GitHub' },
];

let nav = document.createElement('nav');
document.body.prepend(nav);
for (let p of pages) {
    let url = !p.url.startsWith('http') ? BASE_PATH + p.url : p.url;
    let title = p.title;
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    // if (a.host === location.host && a.pathname === location.pathname) {
    //     a.classList.add('current');
    // }
    a.classList.toggle(
        'current',
        a.host === location.host && a.pathname === location.pathname,
    );
    if (new URL(a.href).host !== location.host) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
    }

    nav.append(a);  
}

document.body.insertAdjacentHTML(
  'afterbegin',
  `
<label class="color-scheme">
    Theme:
    <select id="theme-switch">
        <option value="light dark">Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
    </select>
</label>
`
);

const themeSelect = document.getElementById('theme-switch');

// Default to Automatic
document.documentElement.style.colorScheme = 'light dark';

let savedScheme = localStorage.colorScheme || 'light dark';
document.documentElement.style.colorScheme = savedScheme;
themeSelect.value = savedScheme;

// Change theme when user selects a different option
themeSelect.addEventListener('change', (event) => {
    document.documentElement.style.colorScheme = event.target.value;
    localStorage.colorScheme = event.target.value;
});

// Select the form (if it exists)
const form = document.querySelector('form');

form?.addEventListener('submit', (event) => {
    event.preventDefault(); // stop the default mail client submission

    const data = new FormData(form);
    let params = [];

    // Loop through each field
    for (let [name, value] of data) {
        // Encode the value so spaces become %20 instead of +
        params.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
    }

    // Build the final URL
    const url = form.action + '?' + params.join('&');

    console.log(url); // check the final URL in console

    // Open the URL
    location.href = url;
});

export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);
    console.log(response)
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  if (!containerElement || !(containerElement instanceof HTMLElement)) {
    console.error('Invalid container element provided to renderProjects.');
    return;
  }

  if (!Array.isArray(projects)){
    console.error('Projects parameter must be an array.');
    containerElement.innerHTML = '<p>No projects to display.</p>';
    return;
  }

  containerElement.innerHTML = ''; // Clear container before rendering
  
  const validHeadings = ['h1','h2','h3','h4','h5','h6'];
  const headingTag = validHeadings.includes(headingLevel.toLowerCase()) ? headingLevel : 'h2';
  
  projects.forEach(project => {
    const article = document.createElement('article');
    const title = project.title || 'Untitled Project';
    const description = project.description || '';
    const image = project.image || '';
    const year = project.year || '';

    article.innerHTML = `
      <${headingTag}>${title}</${headingTag}>
      ${image ? `<img src="${image}" alt="${title}">` : ''}
      <div class="description">${description}</div>
      <p class="year">c. ${year}</p>
    `;

    containerElement.appendChild(article);
  });
  }
  
export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}

