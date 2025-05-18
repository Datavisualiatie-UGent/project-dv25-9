// See https://observablehq.com/framework/config for documentation.
export default {
  // The app’s title; used in the sidebar and webpage titles.
  title: "Who are gamers?",

  // The pages and sections in the sidebar. If you don’t specify this option,
  // all pages will be listed in alphabetical order. Listing pages explicitly
  // lets you organize them into sections and have unlisted pages.
  pages: [
    {name: "What do gamers play on?", path: "/platform-analysis"},
    {name: "Where are gamers?", path: "/country-analysis"},
    {name: "What do gamers think?",   path: "/review-analysis"},
    {name: "Which genres do gamers play?", path: "/genre-analyse"},
    {name: "How do gamers spend?", path: "/profit-analysis"},
  ],

  // Content to add to the head of the page, e.g. for a favicon:
  head: '<link rel="icon" href="icon.png" type="image/png" sizes="32x32">',

  // The path to the source root.
  root: "src",

  style: "main-style.css",

  // Some additional configuration options and their defaults:
  theme: "glacier", // try "light", "dark", "slate", etc.
  // header: "", // what to show in the header (HTML)
  // footer: "Built with Observable.", // what to show in the footer (HTML)
  // sidebar: true, // whether to show the sidebar
  // toc: true, // whether to show the table of contents
  // pager: true, // whether to show previous & next links in the footer
  // output: "dist", // path to the output root for build
  // search: true, // activate search
  // linkify: true, // convert URLs in Markdown to links
  // typographer: false, // smart quotes and other typographic improvements
  // preserveExtension: false, // drop .html from URLs
  // preserveIndex: false, // drop /index from URLs

  imports: [
    "@observablehq/plot",
    "d3",
    "d3-cloud",
    "compromise",
    "@observablehq/htl",
    "vega",
    "vega-lite",
    "vega-embed",
    "./src/dataloader.js"
  ],

  runtime: {
    // Add the d3, htl, and Plot to the global namespace
    observeAlso: ["d3", "Plot", "htl"]
  }
};
