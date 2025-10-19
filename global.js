console.log('IT’S ALIVE!');

const BASE_PATH =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "/"                    // local dev server
    : "/portfolio/";         // 🔸 replace with your GitHub repo name

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// // Step 2.1: Get an array of all nav links
// const navLinks = $$("nav a");
// console.log(navLinks);

// // Step 2.2: Find the link to the current page
// let currentLink = navLinks.find(
//     (a) => a.host === location.host && a.pathname === location.pathname
//   );
  
//   console.log("Current link:", currentLink);

// currentLink?.classList.add("current");

// Step 3.1: Build the navigation menu automatically
let pages = [
    { url: "index.html", title: "Portfolio" },
    { url: "projects/", title: "Projects" },
    { url: "contact/", title: "Contact" },
    { url: "resume/", title: "Resume" },
    { url: "https://github.com/jimmywootton", title: "GitHub" },
  ];

  
  // Create a new <nav> element and add it at the top of <body>
  let nav = document.createElement("nav");
  document.body.prepend(nav);
  
  // Loop through all pages and insert links into the <nav>
  for (let p of pages) {
    let url = p.url;
    let title = p.title;
    url = !url.startsWith("http") ? BASE_PATH + url : url;
  
    // Create link and add it to nav
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;

    a.classList.toggle(
        "current",
        a.host === location.host && a.pathname === location.pathname
    );
    
    a.toggleAttribute("target", a.host !== location.host);
    if (a.hasAttribute("target")) {
      a.target = "_blank";
      a.rel = "noopener";
    }



    nav.append(a);
  }


  document.body.insertAdjacentHTML(
    "afterbegin",
    `
    <label class="color-scheme">
      Theme:
      <select>
        <option value="light dark">Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
    `
  );

// Step 4.4 – Make the color-scheme switcher work
const select = document.querySelector('.color-scheme select');

select.addEventListener('input', (event) => {
  document.documentElement.style.setProperty(
    'color-scheme',
    event.target.value
  );
});

// Step 4.5 – Save and restore color-scheme preference

// Restore saved preference (if any)
if ('colorScheme' in localStorage) {
  const saved = localStorage.colorScheme;
  document.documentElement.style.setProperty('color-scheme', saved);
  select.value = saved;
}

// Save new preference when user changes selection
select.addEventListener('input', (event) => {
  const value = event.target.value;
  document.documentElement.style.setProperty('color-scheme', value);
  localStorage.colorScheme = value;
});

