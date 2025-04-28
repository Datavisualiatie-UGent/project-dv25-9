---
theme: dashboard
title: Game downloads by country
toc: false
---

# Game downloads by country

This visualization shows the distribution of game downloads across different countries.

<!-- Load and process the country data -->

```js
// Load and process the country data asynchronously
async function loadData() {
  const vegaEmbed = await import("vega-embed").then(m => m.default);
  const topojsonModule = await import("topojson-client");
  const feature = topojsonModule.feature;
  // Load player location data from both platforms - await the promises
  const playstationPlayers = await FileAttachment("./data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/playstation/players.csv").csv();
  const steamPlayers = await FileAttachment("./data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/steam/players.csv").csv();
  const worldTopoJson = await FileAttachment("./data/countries-110m.json").json();

  // Convert TopoJSON to GeoJSON
  const geoJsonObject = topojson.feature(worldTopoJson, worldTopoJson.objects.countries || Object.values(worldTopoJson.objects)[0]);
  const worldGeojson = {
    type: "FeatureCollection", 
    features: geoJsonObject.features
  };
  
  // Process and count players by country
  function countPlayersByCountry() {
    // Create a map to store counts by country
    const countryCounts = new Map();
    
    // Process PlayStation players
    playstationPlayers.forEach(player => {
      if (player.country) {
        const country = player.country;
        countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
      }
    });
    
    // Process Steam players
    steamPlayers.forEach(player => {
      if (player.country) {
        const country = player.country;
        countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
      }
    });
    
    // Convert to array format for visualization
    return Array.from(countryCounts, ([country, count]) => ({
      country,
      downloads: count
    })).sort((a, b) => b.downloads - a.downloads);
  }
  
  // Generate country download counts
  const downloadsByCountry = countPlayersByCountry();
  
  // Create a lookup map for faster access in visualization
  const downloadData = new Map(downloadsByCountry.map(d => [d.country, d.downloads]));
  
  // Calculate total downloads across all countries
  const totalDownloads = downloadsByCountry.reduce((sum, d) => sum + d.downloads, 0);
  
  // Calculate total unique countries
  const totalCountries = downloadsByCountry.length;
  
  return {
    downloadsByCountry,
    downloadData,
    totalDownloads,
    totalCountries,
    worldGeojson
  };
}

// Load the data and initialize the visualizations
const data = await loadData();

// Make the data available to the rest of the code
const { downloadsByCountry, downloadData, totalDownloads, totalCountries, worldGeojson } = data;
```

<!-- Basic stats about the data -->
<div class="grid grid-cols-2"> <div class="card"> <h2>Total Countries</h2> <span class="big">${totalCountries.toLocaleString("en-US")}</span> </div> <div class="card"> <h2>Total Players</h2> <span class="big">${totalDownloads.toLocaleString("en-US")}</span> </div> </div> <!-- Game platform selector - currently non-functional --> <div class="grid grid-cols-1"> <div class="card"> <h3>Select platform to analyze:</h3> <select style="width: 100%; padding: 8px; margin-top: 8px; border-radius: 4px; border: 1px solid #ccc;"> <option value="all" selected>All Platforms</option> <option value="steam">Steam</option> <option value="playstation">PlayStation</option> <option value="xbox">Xbox</option> </select> </div> </div>

<!-- Choropleth map -->

```js
// Create a choropleth map using Plot instead of Vega-Lite
function worldMap(data, {width} = {}) {
  // Check if we have valid GeoJSON data
  if (!worldGeojson || !worldGeojson.features) {
    console.error("Invalid GeoJSON format:", worldGeojson);
    return document.createElement("div");
  }
  
  // Create a color scale for the choropleth
  const colorScale = d3.scaleSequential(d3.interpolateBlues)
    .domain([0, d3.max(data, d => d.downloads) * 0.7]); // Using 0.7 to make colors more visible
  
  // Create a lookup map for faster access
  const countryLookup = new Map(data.map(d => [d.country, d.downloads]));
  
  return Plot.plot({
    width,
    height: width * 0.6,
    projection: "equal-earth", // Use equal-earth projection for better area representation
    style: {
      backgroundColor: "#f9f9f9",
      color: "black",
      fontFamily: "system-ui, sans-serif"
    },
    marks: [
      // Draw the countries with colors based on player counts
      Plot.geo(worldGeojson.features, {
        fill: d => {
          const countryName = d.properties.name || d.properties.NAME || d.properties.ADMIN;
          const downloads = countryLookup.get(countryName);
          return downloads ? colorScale(downloads) : "#f0f0f0"; // Gray for countries with no data
        },
        stroke: "white",
        strokeWidth: 0.5,
        title: d => {
          const countryName = d.properties.name || d.properties.NAME || d.properties.ADMIN;
          const downloads = countryLookup.get(countryName);
          return downloads 
            ? `${countryName}: ${downloads.toLocaleString()} players` 
            : `${countryName}: No data`;
        }
      }),
      // Add graticules for visual reference
      Plot.graticule({
        stroke: "#ddd",
        strokeOpacity: 0.5
      }),
      // Draw the sphere (outline of the earth)
      Plot.sphere({
        stroke: "#aaa",
        strokeOpacity: 0.5
      })
    ]
  });
}
```

<div class="grid grid-cols-1"> <div class="card"> <h2>Global Player Distribution</h2> ${resize((width) => worldMap(downloadsByCountry, {width}))} </div> </div>

<!-- Top 10 countries by downloads -->

```js
// Create bar chart for top countries
function countryBarChart(data, {width} = {}) {
  // Take only top 15 countries
  const topCountries = data.slice(0, 15);
  
  return Plot.plot({
    width,
    height: 400,
    marginLeft: 150,
    title: "Top 15 Countries by Player Count",
    x: {
      label: "Players",
      grid: true
    },
    y: {
      label: null,
      domain: topCountries.map(d => d.country)
    },
    marks: [
      Plot.barX(topCountries, {
        y: "country",
        x: "downloads",
        fill: "steelblue",
        sort: {y: "-x"}
      }),
      Plot.ruleX([0])
    ]
  });
}
```

<div class="grid grid-cols-1"> <div class="card"> ${resize((width) => countryBarChart(downloadsByCountry, {width}))} </div> </div> 