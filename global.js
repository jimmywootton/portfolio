console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Step 2.1: Get an array of all nav links
// const navLinks = $$("nav a");
// console.log(navLinks);