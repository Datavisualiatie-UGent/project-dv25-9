---
theme: dashboard
title: What do gamers play on?
toc: true
---

# What do gamers play on?

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

  // Platform launch dates
  const platformLaunches = [
    { platform: "Steam", date: new Date(2003, 8, 12), label: "Steam Launch (Sep 2003)" },
    { platform: "Xbox", date: new Date(2005, 10, 22), label: "Xbox Store Launch (Nov 2005)" },
    { platform: "PlayStation", date: new Date(2006, 10, 11), label: "PlayStation Store Launch (Nov 2006)" }
  ];
  
  // Process purchase data and count downloads by month, tracking top games
  function countDownloadsByMonth(purchases, gameMap, platform) {
    // Count downloads per game ID
    const gameDownloads = new Map();
    
    purchases.forEach(purchase => {
      // Parse the library JSON string to get array of game IDs
      let library;
      try {
        library = JSON.parse(purchase.library.replace(/'/g, '"'));
      } catch (e) {
        console.error("Error parsing library:", e);
        return;
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
    
    // Group games by title to handle duplicates
    const titleToDownloads = new Map();
    const titleToReleaseDate = new Map();
    
    // First pass: collect all titles, their downloads, and their release dates
    gameDownloads.forEach((downloads, gameId) => {
      const gameInfo = gameMap.get(gameId);
      if (!gameInfo || !gameInfo.release_date || !gameInfo.title) return;
      
      const title = gameInfo.title;
      const date = new Date(gameInfo.release_date);
      if (isNaN(date.getTime())) return;
      
      // Add downloads to title's total
      if (!titleToDownloads.has(title)) {
        titleToDownloads.set(title, 0);
        titleToReleaseDate.set(title, date);
      }
      titleToDownloads.set(title, titleToDownloads.get(title) + downloads);
    });
    
    // Aggregate downloads by month based on release dates
    const monthlyData = {};
    
    titleToDownloads.forEach((downloads, title) => {
      const date = titleToReleaseDate.get(title);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[yearMonth]) {
        monthlyData[yearMonth] = {
          totalDownloads: 0,
          games: []
        };
      }
      
      // Add game to the month's data
      monthlyData[yearMonth].games.push({
        title: title,
        downloads: downloads
      });
      monthlyData[yearMonth].totalDownloads += downloads;
    });
    
    // Rest of the function remains the same
    return Object.entries(monthlyData).map(([yearMonth, data]) => {
      const [year, month] = yearMonth.split('-');
      
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
  
  /*// Calculate cumulative totals
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
  const allCumulativeData = [...steamCumulative, ...playstationCumulative, ...xboxCumulative];*/
  
  // Process purchase data and count downloads by month, tracking releases and downloads
  function processGameData(purchases, gameMap, platform) {
    // Count downloads per game ID
    const gameDownloads = new Map();
    
    purchases.forEach(purchase => {
      // Parse the library JSON string to get array of game IDs
      let library;
      try {
        library = JSON.parse(purchase.library.replace(/'/g, '"'));
      } catch (e) {
        console.error("Error parsing library:", e);
        return;
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
    
    // Group games by release month & title
    const monthlyReleases = {};
    const monthlyDownloads = {};
    
    // Process each game with its download count
    gameDownloads.forEach((downloads, gameId) => {
      const gameInfo = gameMap.get(gameId);
      if (!gameInfo || !gameInfo.release_date || !gameInfo.title) return;
      
      const title = gameInfo.title;
      const date = new Date(gameInfo.release_date);
      if (isNaN(date.getTime())) return;
      
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // Process for release counts
      if (!monthlyReleases[yearMonth]) {
        monthlyReleases[yearMonth] = {
          releaseCount: 0,
          totalDownloads: 0,
          games: [],
          averageDownloadsPerGame: 0
        };
      }
      
      // Check if this game is already counted in this month
      const existingGameIndex = monthlyReleases[yearMonth].games.findIndex(g => g.title === title);
      
      if (existingGameIndex === -1) {
        // Add as a new game release for this month
        monthlyReleases[yearMonth].games.push({
          title: title,
          downloads: downloads
        });
        monthlyReleases[yearMonth].releaseCount++;
        monthlyReleases[yearMonth].totalDownloads += downloads;
      } else {
        // Update downloads for existing game
        monthlyReleases[yearMonth].games[existingGameIndex].downloads += downloads;
        monthlyReleases[yearMonth].totalDownloads += downloads;
      }
      
      // Process for download counts (by release month)
      if (!monthlyDownloads[yearMonth]) {
        monthlyDownloads[yearMonth] = {
          totalDownloads: 0,
          games: []
        };
      }
      
      // Check if this game is already counted for downloads
      const existingGameDownloadIndex = monthlyDownloads[yearMonth].games.findIndex(g => g.title === title);
      
      if (existingGameDownloadIndex === -1) {
        // Add as a new game download for this month
        monthlyDownloads[yearMonth].games.push({
          title: title,
          downloads: downloads
        });
        monthlyDownloads[yearMonth].totalDownloads += downloads;
      } else {
        // Update downloads for existing game
        monthlyDownloads[yearMonth].games[existingGameDownloadIndex].downloads += downloads;
        monthlyDownloads[yearMonth].totalDownloads += downloads;
      }
    });
    
    // Calculate average downloads per game for each month
    Object.values(monthlyReleases).forEach(data => {
      data.averageDownloadsPerGame = data.releaseCount > 0 
        ? data.totalDownloads / data.releaseCount 
        : 0;
      
      // Sort games by downloads
      data.games.sort((a, b) => b.downloads - a.downloads);
    });
    
    // Format monthly release data
    const releasesData = Object.entries(monthlyReleases).map(([yearMonth, data]) => {
      const [year, month] = yearMonth.split('-');
      
      return {
        date: new Date(parseInt(year), parseInt(month) - 1, 1),
        releaseCount: data.releaseCount,
        totalDownloads: data.totalDownloads,
        averageDownloadsPerGame: data.averageDownloadsPerGame,
        platform,
      };
    }).sort((a, b) => a.date - b.date);
    
    // Format monthly download data  
    const downloadsData = Object.entries(monthlyDownloads).map(([yearMonth, data]) => {
      const [year, month] = yearMonth.split('-');
      
      const topGames = data.games
        .sort((a, b) => b.downloads - a.downloads)
        .slice(0, 3);
        
      return {
        date: new Date(parseInt(year), parseInt(month) - 1, 1),
        count: data.totalDownloads,
        platform,
      };
    }).sort((a, b) => a.date - b.date);
    
    return {
      releases: releasesData,
      downloads: downloadsData
    };
  }
  
  // Process data for each platform
  const steamData = processGameData(steamPurchases, steamGameMap, "Steam");
  const playstationData = processGameData(playstationPurchases, playstationGameMap, "PlayStation");
  const xboxData = processGameData(xboxPurchases, xboxGameMap, "Xbox");
  
  // Combine all release and download data
  const allMonthlyReleases = [...steamData.releases, ...playstationData.releases, ...xboxData.releases];
  const allMonthlyDownloads = [...steamData.downloads, ...playstationData.downloads, ...xboxData.downloads];
  
  

  // Calculate cumulative totals
  function calculateCumulative(data) {
    let cumulative = 0;
    return data.map(d => {
      cumulative += d.count;
      return {
        date: d.date,
        count: cumulative,
        platform: d.platform,
        topGames: d.topGames
      };
    });
  }
  
  const steamCumulative = calculateCumulative(steamData.downloads);
  const playstationCumulative = calculateCumulative(playstationData.downloads);
  const xboxCumulative = calculateCumulative(xboxData.downloads);
  
  const allCumulativeData = [...steamCumulative, ...playstationCumulative, ...xboxCumulative];

  // Pre-filter for 5-year view (changed from 10 years)
  const mostRecentDate = d3.max([
    ...allMonthlyDownloads.map(d => d.date),
    ...allMonthlyReleases.map(d => d.date)
  ], d => d.getTime());
  
  const fiveYearsAgo = new Date(mostRecentDate);
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5); // Changed from 10 to 5
  
  const recentMonthlyDownloads = allMonthlyDownloads.filter(d => d.date >= fiveYearsAgo);
  const recentMonthlyReleases = allMonthlyReleases.filter(d => d.date >= fiveYearsAgo);

  // Return the processed data
  return {
    monthlyData: recentMonthlyDownloads,
    monthlyReleases: recentMonthlyReleases,
    cumulativeData: allCumulativeData,
    platformLaunches: platformLaunches
  };
}

// Load the data
const platformData = await loadPlatformData();

function createSummaryStats() {
  // Calculate total downloads (from the latest cumulative totals)
  const totalDownloads = platformData.cumulativeData
    .filter(d => {
      const platformPoints = platformData.cumulativeData.filter(x => x.platform === d.platform);
      const maxDate = d3.max(platformPoints, x => x.date.getTime());
      return d.date.getTime() === maxDate;
    })
    .reduce((sum, d) => sum + d.count, 0);
    
  // Calculate total game releases
  const totalReleases = platformData.monthlyReleases
    .reduce((sum, month) => sum + month.releaseCount, 0);
  
  // Create the widget with updated styling
  const statsContainer = document.createElement("div");
  statsContainer.className = "grid grid-cols-1 md:grid-cols-2 gap-4 mb-4";
  
  // Downloads card
  const downloadsCard = document.createElement("div");
  downloadsCard.className = "card p-4";
  downloadsCard.innerHTML = `
    <h2 style="font-size: 16px; margin-bottom: 8px;">Total game downloads</h2>
    <span style="font-size: 28px; font-weight: bold;">${totalDownloads.toLocaleString("en-US")}</span>
  `;
  
  // Releases card
  const releasesCard = document.createElement("div");
  releasesCard.className = "card p-4";
  releasesCard.innerHTML = `
    <h2 style="font-size: 16px; margin-bottom: 8px;">Unique game releases</h2>
    <span style="font-size: 28px; font-weight: bold;">${totalReleases.toLocaleString("en-US")}</span>
  `;
  
  statsContainer.appendChild(downloadsCard);
  statsContainer.appendChild(releasesCard);
  
  return statsContainer;
}

// Create chart functions that will be called from the HTML
function cumulativeChart(width) {
  return Plot.plot({
    width,
    height: 500,
    marginRight: 100,
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
      // Platform launch date markers (vertical rules)
      Plot.ruleX(platformData.platformLaunches, {
        x: "date",
        stroke: "platform",
        strokeWidth: 2,
        strokeDasharray: "5,3",
        y1: 0,
        y2: d => {
          // Get the maximum count across all platforms
          const maxOverallCount = d3.max(platformData.cumulativeData, pd => pd.count);
          
          // Set different heights for each platform
          switch(d.platform) {
            case "Steam": return maxOverallCount * 0.95; // Highest
            case "Xbox": return maxOverallCount * 0.9; // Medium
            case "PlayStation": return maxOverallCount * 0.85; // Lowest
            default: return maxOverallCount * 0.7;
          }
        }
      }),
      
      // Platform launch labels
      Plot.text(platformData.platformLaunches, {
        x: "date",
        y: d => {
          // Get the maximum count across all platforms
          const maxOverallCount = d3.max(platformData.cumulativeData, pd => pd.count);
          
          // Set different heights for each platform
          switch(d.platform) {
            case "Steam": return maxOverallCount * 0.95; // Highest
            case "Xbox": return maxOverallCount * 0.9; // Medium
            case "PlayStation": return maxOverallCount * 0.85; // Lowest
            default: return maxOverallCount * 0.7;
          }
        },
        text: "label",
        fill: "platform",
        fontSize: 10,
        dx: 10,
        textAnchor: "start"
      }),

      // Plot
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

function monthlyReleasesChart(width) {
  return Plot.plot({
    width,
    height: 400,
    marginRight: 40,
    marginLeft: 60,
    marginBottom: 50,
    x: {
      type: "time",
      label: "Release Month",
      tickFormat: "%b %Y",
      grid: true
    },
    y: {
      label: "Number of Game Releases",
      grid: true
    },
    color: {
      domain: ["Steam", "PlayStation", "Xbox"],
      range: ["#0066cc", "#e0e0e0", "#107C10"],
      legend: true
    },
    marks: [
      Plot.dot(platformData.monthlyReleases, {  // Use monthlyReleases instead of monthlyData
        x: "date",
        y: "releaseCount",
        stroke: "platform",
        fill: "platform",
        fillOpacity: 0.2,
        r: d => Math.sqrt(d.averageDownloadsPerGame) / 10, // Size based on average downloads
        title: d => {
          try {
            const formattedDate = d.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            let tooltip = `${d.platform}: ${d.releaseCount} games released (${formattedDate})`;
            tooltip += `\nTotal downloads: ${d.totalDownloads.toLocaleString()}`;
            tooltip += `\nAvg per game: ${Math.round(d.averageDownloadsPerGame).toLocaleString()}`;
            
            return tooltip;
          } catch (e) {
            return `${d.platform}: ${d.releaseCount} games released`;
          }
        }
      }),
      Plot.line(platformData.monthlyReleases, {  // Use monthlyReleases here too
        x: "date",
        y: "releaseCount",
        stroke: "platform",
        strokeWidth: 1.5,
        curve: "basis"
      })
    ]
  });
}
```

${createSummaryStats()}

In this section we show the total number of game downloads and releases across major platforms. The dataset includes over 30 million downloads and thousands of releases. This is likely a subset of the full picture as GTA V alone has sold over 200 million copies. This highlights that the data gives trends, not complete market coverage. It’s still useful for comparing platforms and identifying patterns. The potential skew of this dataset will be discussed later on.

# Cumulative game downloads

${resize(cumulativeChart)}

This graph shows the total number of downloads over time per platform. Xbox leads in total downloads, followed by Steam and PlayStation. Downloads only begin after each platform’s store launched. Interestingly, Xbox and Steam show some downloads before their official store releases. This happens because Microsoft and Valve published games before their platforms launched and later added them with their original release dates. Looking at this graph, it would seem interest in games is stagnating. However, this is due to this dataset not being fully updated with the newest games and thus not counting their downloads.

# Monthly game releases

${resize(monthlyReleasesChart)}

This chart shows the number of game releases per month, broken down by platform. The size of each point represents the average number of downloads per game that month. Steam has the highest volume of releases overall. However, PlayStation and Xbox games tend to receive more downloads per title. It also shows clearly that most games release during October of each year, as this is right before the holiday season. The final months show a downward trend in releases, again due to the dataset not being fully updated.