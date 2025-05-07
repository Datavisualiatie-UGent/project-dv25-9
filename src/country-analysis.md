---
theme: dashboard
title: Gaming country analysis
toc: false
---

# Gaming country distribution analysis

This visualization shows the distribution of game downloads and player activity across different countries for Steam, PlayStation, and Xbox platforms.

```js
// Load and process the country data
async function loadCountryData() {
  // Load player data for each platform
  const playstationPlayers = await FileAttachment("./data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/playstation/players.csv").csv();
  const steamPlayers = await FileAttachment("./data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/steam/players.csv").csv();
  const xboxPlayers = await FileAttachment("./data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/xbox/players.csv").csv();
  
  // Load world map data
  const worldTopoJson = await FileAttachment("./data/countries-110m.json").json();

  // Convert TopoJSON to GeoJSON
  const geoJsonObject = topojson.feature(worldTopoJson, worldTopoJson.objects.countries || Object.values(worldTopoJson.objects)[0]);
  const worldGeojson = {
    type: "FeatureCollection", 
    features: geoJsonObject.features
  };
  
  // Process and count players by country and platform
  function countPlayersByCountry(playerData, platformName) {
    // Create a map to store counts by country
    const countryCounts = new Map();
    
    // Process players
    playerData.forEach(player => {
      if (player.country) {
        const country = player.country;
        countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
      }
    });
    
    // Convert to array format for visualization
    return Array.from(countryCounts, ([country, count]) => ({
      country,
      count: count,
      platform: platformName
    })).sort((a, b) => b.count - a.count);
  }
  
  // Generate counts for each platform
  const playstationByCountry = countPlayersByCountry(playstationPlayers, "PlayStation");
  const steamByCountry = countPlayersByCountry(steamPlayers, "Steam");
  const xboxByCountry = countPlayersByCountry(xboxPlayers, "Xbox");
  
  // Generate combined country counts
  function combineCountryData(countryDataSets) {
    const combinedMap = new Map();
    
    countryDataSets.forEach(dataset => {
      dataset.forEach(({country, count}) => {
        combinedMap.set(country, (combinedMap.get(country) || 0) + count);
      });
    });
    
    return Array.from(combinedMap, ([country, count]) => ({
      country,
      count: count,
      platform: "All Platforms"
    })).sort((a, b) => b.count - a.count);
  }
  
  const allPlatformsByCountry = combineCountryData([
    playstationByCountry,
    steamByCountry,
    xboxByCountry
  ]);
  
  // Calculate statistics
  const totalCountries = new Set(allPlatformsByCountry.map(d => d.country)).size;
  const totalPlayers = allPlatformsByCountry.reduce((sum, d) => sum + d.count, 0);
  
  // Country name mapping for the visualization
  const countryNameMapping = {
    "Russia": "Russian Federation",
    "W. Sahara": "Western Sahara",
    "Dem. Rep. Congo": "Congo, The Democratic Republic of the",
    "Dominican Rep.": "Dominican Republic",
    "Falkland Is.": "Falkland Islands (Malvinas)",
    "Fr. S. Antarctic Lands": "French Southern Territories",
    "Bolivia": "Bolivia, Plurinational State of",
    "Venezuela": "Venezuela, Bolivarian Republic of",
    "Central African Rep.": "Central African Republic",
    "Eq. Guinea": "Equatorial Guinea",
    "eSwatini": "Eswatini",
    "Palestine": "Palestine, State of",
    "Laos": "Lao People's Democratic Republic",
    "Vietnam": "Viet Nam",
    "North Korea": "Korea, Democratic People's Republic of",
    "South Korea": "Korea, Republic of",
    "Iran": "Iran, Islamic Republic of",
    "Syria": "Syrian Arab Republic",
    "Moldova": "Moldova, Republic of",
    "Turkey": "Türkiye",
    "Solomon Is.": "Solomon Islands",
    "Taiwan": "Taiwan, Province of China",
    "Brunei": "Brunei Darussalam",
    "Bosnia and Herz.": "Bosnia and Herzegovina",
    "Macedonia": "North Macedonia",
    "S. Sudan": "South Sudan",
    "Tanzania": "Tanzania, United Republic of",
    "United States of America": "United States"
  };
  
  return {
    allPlatformsByCountry,
    playstationByCountry,
    steamByCountry,
    xboxByCountry,
    worldGeojson,
    totalCountries,
    totalPlayers,
    countryNameMapping
  };
}

// Load the data
const countryData = await loadCountryData();

// Create a stats card that displays key metrics
function createStatsCards() {
  const container = document.createElement("div");
  container.className = "grid grid-cols-1 md:grid-cols-2 gap-4 mb-4";
  
  const countryCard = document.createElement("div");
  countryCard.className = "card p-4";
  countryCard.innerHTML = `
    <h2 style="font-size: 16px; margin-bottom: 8px;">Total Countries</h2>
    <span style="font-size: 28px; font-weight: bold;">${countryData.totalCountries.toLocaleString("en-US")}</span>
  `;
  
  const playerCard = document.createElement("div");
  playerCard.className = "card p-4";
  playerCard.innerHTML = `
    <h2 style="font-size: 16px; margin-bottom: 8px;">Total Players</h2>
    <span style="font-size: 28px; font-weight: bold;">${countryData.totalPlayers.toLocaleString("en-US")}</span>
  `;
  
  container.appendChild(countryCard);
  container.appendChild(playerCard);
  return container;
}

// Create genre filter component (similar to genre filter in genre-analysis)
function createGenreFilter() {
  const filterContainer = document.createElement("div");
  filterContainer.className = "card mb-4";
  
  const filterContent = document.createElement("div");
  filterContent.className = "filter-controls p-3 d-flex align-items-center";
  
  // Create label
  const label = document.createElement("label");
  label.htmlFor = "genre-select";
  label.textContent = "Filter by genre: ";
  label.className = "mb-0 me-3 fw-bold"; //mss extra margin aan rechterkant
  
  // Create dropdown with genres
  const select = document.createElement("select");
  select.id = "genre-select";
  select.className = "form-select";
  select.style.width = "220px";
  
  // Add genre options
  const genres = [
    "All genres",
    "Action",
    "Adventure", 
    "First Person Shooter",
    "RPG",
    "Platformer",
    "Puzzle",
    "Racing",
    "Simulation",
    "Sports",
    "Strategy"
  ];
  
  genres.forEach(genre => {
    const option = document.createElement("option");
    option.value = genre === "All genres" ? "" : genre.toLowerCase();
    option.textContent = genre;
    select.appendChild(option);
  });
  
  filterContent.appendChild(label);
  filterContent.appendChild(select);
  filterContainer.appendChild(filterContent);
  
  return filterContainer;
}

// World map chart function
function worldMapChart(width) {
  // Create a color scale for the choropleth
  const colorScale = d3.scaleSqrt()
    .domain([1, d3.max(countryData.allPlatformsByCountry, d => d.count)])
    .range(["#c6dbef", "#08519c"]); // Lighter blue to dark blue
    
  // Create a lookup map for faster access
  const countryLookup = new Map(countryData.allPlatformsByCountry.map(d => [d.country, d.count]));

  // Create the plot
  return Plot.plot({
    width,
    height: width * 0.6,
    projection: {
      type: "mercator",
      domain: {
        type: "MultiPoint", 
        coordinates: [[-180, -50], [180, 75]]  // Limit latitude range from -50° to 75°
      }
    },
    style: {
      backgroundColor: "transparent",
      color: "black",
      fontFamily: "system-ui, sans-serif"
    },
    color: {
      type: "sqrt",
      domain: [1, d3.max(countryData.allPlatformsByCountry, d => d.count)],
      range: ["#c6dbef", "#08519c"],
      legend: true,
      tickFormat: "~s",
      label: "Players"
    },
    marks: [
      // Draw the countries with colors based on player counts
      Plot.geo(countryData.worldGeojson.features, {
        fill: d => {
          const countryName = d.properties.name || d.properties.NAME || d.properties.ADMIN;
          const mappedName = countryData.countryNameMapping[countryName];
          let count = null;
          
          if (mappedName) {
            count = countryLookup.get(mappedName);
          }
          
          if (!count) {
            count = countryLookup.get(countryName);
          }
          
          return count ? colorScale(count) : "#f0f0f0"; // Gray for countries with no data
        },
        stroke: "white",
        strokeWidth: 0.5,
        title: d => {
          const countryName = d.properties.name || d.properties.NAME || d.properties.ADMIN;
          const mappedName = countryData.countryNameMapping[countryName];
          
          let count = null;
          if (mappedName) {
            count = countryLookup.get(mappedName);
          }
          
          if (!count) {
            count = countryLookup.get(countryName);
          }
          
          return count 
            ? `${countryName}: ${count.toLocaleString()} players` 
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

// Top countries bar chart function
function countryBarChart(width) {
  // Take only top 15 countries
  const topCountries = countryData.allPlatformsByCountry.slice(0, 15);
  
  return Plot.plot({
    width,
    height: 450,
    marginLeft: 150,
    title: "Top countries by player count",
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
        x: "count",
        fill: "steelblue",
        sort: {y: "-x"}
      }),
      Plot.ruleX([0]),
      Plot.text(topCountries, {
        x: d => d.count / 2, // Position text in middle of bars
        y: "country",
        text: d => d.count.toLocaleString(),
        textAnchor: "middle", // Center text horizontally
        fill: "white", // White text for better contrast on blue bars
        fontWeight: "bold" // Make text stand out better
      })
    ]
  });
}
```

${createStatsCards()}

${createGenreFilter()}

# Global player distribution

${resize(worldMapChart)}

# Most popular gaming countries

${resize(countryBarChart)}