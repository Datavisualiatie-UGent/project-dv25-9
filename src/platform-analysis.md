---
theme: dashboard
title: Gaming Platform Analysis
toc: false
---

# Gaming Platform Download Trends

This visualization tracks game downloads on Steam, PlayStation, and Xbox platforms over time, based on game purchases attributed to release dates.

```js
// Load and process the platform data
async function loadPlatformData() {
  // Load game data for each platform
  const playstationGames = await FileAttachment("./data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/playstation/games.csv").csv();
  const steamGames = await FileAttachment("./data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/steam/games.csv").csv();
  const xboxGames = await FileAttachment("./data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/xbox/games.csv").csv();
  
  // Load purchase data
  const playstationPurchases = await FileAttachment("./data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/playstation/purchased_games.csv").csv();
  const steamPurchases = await FileAttachment("./data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/steam/purchased_games.csv").csv();
  const xboxPurchases = await FileAttachment("./data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/xbox/purchased_games.csv").csv();
  
  // Create lookup maps for game release dates and titles
  const playstationGameMap = new Map(playstationGames.map(game => [game.gameid, { release_date: game.release_date, title: game.title }]));
  const steamGameMap = new Map(steamGames.map(game => [game.gameid, { release_date: game.release_date, title: game.title }]));
  const xboxGameMap = new Map(xboxGames.map(game => [game.gameid, { release_date: game.release_date, title: game.title }]));
  
  // Process purchase data and count downloads by month, tracking top games
  function countDownloadsByMonth(purchases, gameMap, platform) {
    // Count downloads per game
    const gameDownloads = new Map();
    
    purchases.forEach(purchase => {
      // Parse the library JSON string to get array of game IDs
      let library;
      try {
        // Handle the Python-style array representation
        library = JSON.parse(purchase.library.replace(/'/g, '"'));
      } catch (e) {
        console.error("Error parsing library:", e);
        return; // Skip if parsing fails
      }
      
      // Count each game as a download
      library.forEach(gameId => {
        const gameIdStr = gameId.toString();
        if (!gameDownloads.has(gameIdStr)) {
          gameDownloads.set(gameIdStr, 0);
        }
        gameDownloads.set(gameIdStr, gameDownloads.get(gameIdStr) + 1);
      });
    });
    
    // Aggregate downloads by month based on release dates
    const monthlyData = {};
    
    gameDownloads.forEach((downloads, gameId) => {
      const gameInfo = gameMap.get(gameId);
      if (!gameInfo || !gameInfo.release_date) return; // Skip if no release date
      
      const date = new Date(gameInfo.release_date);
      if (isNaN(date.getTime())) return; // Skip if invalid date
      
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[yearMonth]) {
        monthlyData[yearMonth] = {
          totalDownloads: 0,
          games: []
        };
      }
      
      // Add game to the month's data
      monthlyData[yearMonth].games.push({
        title: gameInfo.title || `Game #${gameId}`,
        downloads: downloads
      });
      monthlyData[yearMonth].totalDownloads += downloads;
    });
    
    // Process each month's data to get top games and format for plotting
    return Object.entries(monthlyData).map(([yearMonth, data]) => {
      const [year, month] = yearMonth.split('-');
      
      // Sort games by downloads and take top 3
      const topGames = data.games
        .sort((a, b) => b.downloads - a.downloads)
        .slice(0, 3);
        
      return {
        date: new Date(parseInt(year), parseInt(month) - 1, 1),
        count: data.totalDownloads,
        platform,
        topGames: topGames
      };
    }).sort((a, b) => a.date - b.date);
  }
  
  // Process download data for each platform
  const steamDownloads = countDownloadsByMonth(steamPurchases, steamGameMap, "Steam");
  const playstationDownloads = countDownloadsByMonth(playstationPurchases, playstationGameMap, "PlayStation");
  const xboxDownloads = countDownloadsByMonth(xboxPurchases, xboxGameMap, "Xbox");
  
  // Calculate cumulative totals
  function calculateCumulative(data) {
    let cumulative = 0;
    return data.map(d => {
      cumulative += d.count;
      return {
        date: d.date,
        count: cumulative,
        platform: d.platform,
        topGames: d.topGames // Pass through the top games
      };
    });
  }
  
  const steamCumulative = calculateCumulative(steamDownloads);
  const playstationCumulative = calculateCumulative(playstationDownloads);
  const xboxCumulative = calculateCumulative(xboxDownloads);
  
  // Combine all data for the visualization
  const allMonthlyData = [...steamDownloads, ...playstationDownloads, ...xboxDownloads];
  const allCumulativeData = [...steamCumulative, ...playstationCumulative, ...xboxCumulative];

  // Pre-filter for the 10-year view
  const mostRecentDate = d3.max(allMonthlyData, d => d.date);
  const tenYearsAgo = new Date(mostRecentDate);
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
  const recentMonthlyData = allMonthlyData.filter(d => d.date >= tenYearsAgo);
  
  // Return the processed data
  return {
    monthlyData: recentMonthlyData,
    cumulativeData: allCumulativeData
  };
}

// Load the data
const platformData = await loadPlatformData();

// Create chart functions that will be called from the HTML
function cumulativeChart(width) {
  return Plot.plot({
    width,
    height: 500,
    marginRight: 40,
    marginLeft: 60,
    marginBottom: 50,
    x: {
      type: "time",
      label: "Date",
      tickFormat: "%b %Y",
      grid: true
    },
    y: {
      label: "Total Downloads",
      grid: true
    },
    color: {
      domain: ["Steam", "PlayStation", "Xbox"],
      range: ["#0066cc", "#e0e0e0", "#107C10"],
      legend: true
    },
    marks: [
      Plot.line(platformData.cumulativeData, {
        x: "date",
        y: "count",
        stroke: "platform",
        strokeWidth: 3,
        title: d => {
          const formattedDate = d.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          return `${d.platform}: ${d.count.toLocaleString()} total downloads\n(${formattedDate})`;
        },
        curve: "cardinal"
      }),
      Plot.text(platformData.cumulativeData.filter(d => {
        const platformPoints = platformData.cumulativeData.filter(x => x.platform === d.platform);
        const maxDate = d3.max(platformPoints, x => x.date.getTime());
        return d.date.getTime() === maxDate;
      }), {
        x: "date",
        y: "count",
        text: "platform",
        dx: 12,
        textAnchor: "start",
        fill: "platform",
        fontWeight: "bold"
      })
    ]
  });
}

function monthlyChart(width) {
  return Plot.plot({
    width,
    height: 400,
    marginRight: 40,
    marginLeft: 60,
    marginBottom: 50,
    x: {
      type: "time",
      label: "Month",
      tickFormat: "%b %Y",
      grid: true
    },
    y: {
      label: "Downloads",
      grid: true
    },
    color: {
      domain: ["Steam", "PlayStation", "Xbox"],
      range: ["#0066cc", "#e0e0e0", "#107C10"],
      legend: true
    },
    marks: [
      Plot.dot(platformData.monthlyData, {
        x: "date",
        y: "count",
        stroke: "platform",
        fill: "platform",
        fillOpacity: 0.2,
        r: 3,
        title: d => {
          try {
            const formattedDate = d.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            let tooltip = `${d.platform}: ${d.count.toLocaleString()} downloads (${formattedDate})`;
            
            if (d.topGames && Array.isArray(d.topGames) && d.topGames.length > 0) {
              tooltip += "\n\nTop games:";
              d.topGames.forEach((game, i) => {
                if (game && game.title) {
                  tooltip += `\n${i+1}. ${game.title}: ${game.downloads.toLocaleString()}`;
                }
              });
            }
            return tooltip;
          } catch (e) {
            return `${d.platform}: ${d.count.toLocaleString()} downloads`;
          }
        }
      }),
      Plot.line(platformData.monthlyData, {
        x: "date",
        y: "count",
        stroke: "platform",
        strokeWidth: 1.5,
        curve: "basis"
      })
    ]
  });
}

function createGenreFilter() {
  const filterContainer = document.createElement("div");
  filterContainer.className = "card mb-4";
  
  const filterContent = document.createElement("div");
  filterContent.className = "filter-controls p-3 d-flex align-items-center";
  
  // Create label
  const label = document.createElement("label");
  label.htmlFor = "genre-select";
  label.textContent = "Filter by Genre: ";
  label.className = "mb-0 me-3 fw-bold";
  
  // Create dropdown with popular genres only
  const select = document.createElement("select");
  select.id = "genre-select";
  select.className = "form-select";
  select.style.width = "220px";
  //select.disabled = true;
  
  // Add options with just the most popular genres
  const popularGenres = [
    "All Genres",
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
  
  popularGenres.forEach(genre => {
    const option = document.createElement("option");
    option.value = genre === "All Genres" ? "" : genre.toLowerCase().replace(/\s+/g, "-");
    option.textContent = genre;
    select.appendChild(option);
  });
  
  // Add note about the non-functional state
  const note = document.createElement("span");
  note.className = "text-muted fst-italic small ms-3";
  note.textContent = "(For demonstration only)";
  
  filterContent.appendChild(label);
  filterContent.appendChild(select);
  filterContent.appendChild(note);
  filterContainer.appendChild(filterContent);
  
  return filterContainer;
}
```

${createGenreFilter()}

Cumulative Game Downloads by Platform
${resize(cumulativeChart)}

Monthly Game Downloads by Platform (Last 10 Years)
${resize(monthlyChart)}