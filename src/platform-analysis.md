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
  
  // Create lookup maps for game release dates
  const playstationGameMap = new Map(playstationGames.map(game => [game.gameid, game.release_date]));
  const steamGameMap = new Map(steamGames.map(game => [game.gameid, game.release_date]));
  const xboxGameMap = new Map(xboxGames.map(game => [game.gameid, game.release_date]));
  
  // Process purchase data and count downloads by month
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
    const monthlyDownloads = {};
    
    gameDownloads.forEach((downloads, gameId) => {
      const releaseDate = gameMap.get(gameId);
      if (!releaseDate) return; // Skip if no release date
      
      const date = new Date(releaseDate);
      if (isNaN(date.getTime())) return; // Skip if invalid date
      
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyDownloads[yearMonth]) {
        monthlyDownloads[yearMonth] = 0;
      }
      
      monthlyDownloads[yearMonth] += downloads;
    });
    
    // Convert to array of objects for plotting
    return Object.entries(monthlyDownloads).map(([yearMonth, count]) => {
      const [year, month] = yearMonth.split('-');
      return {
        date: new Date(parseInt(year), parseInt(month) - 1, 1),
        count,
        platform
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
        platform: d.platform
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
```

<div class="grid grid-cols-1"> 
  <div class="card"> 
    <h2>Cumulative Game Downloads by Platform</h2> 
    <p class="text-sm text-gray-500">Total number of downloads over time</p>
    ${resize((width) => Plot.plot({ 
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
        range: ["#1b2838", "#006FCD", "#107C10"], 
        legend: true 
      }, 
      marks: [ 
        Plot.line(platformData.cumulativeData, { 
          x: "date", 
          y: "count", 
          stroke: "platform", 
          strokeWidth: 3, 
          curve: "cardinal"
        }), 
        Plot.text(platformData.cumulativeData.filter(d => 
          d.date.getTime() === d3.max(platformData.cumulativeData.filter(x => x.platform === d.platform), 
          d => d.date.getTime())), { 
          x: "date", 
          y: "count", 
          text: "platform", 
          dx: 12, 
          textAnchor: "start", 
          fill: "platform", 
          fontWeight: "bold" 
        }) 
      ] 
    }))}
  </div> 
</div>

<div class="grid grid-cols-1">
  <div class="card">
    <h2>Monthly Game Downloads by Platform (Last 10 Years)</h2>
    <p class="text-sm text-gray-500">Number of downloads each month (attributed to release date)</p>
    ${resize((width) => Plot.plot({
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
        range: ["#1b2838", "#006FCD", "#107C10"],
        legend: true
      },
      marks: [
        Plot.dot(platformData.monthlyData, {
          x: "date",
          y: "count",
          stroke: "platform",
          fill: "platform",
          fillOpacity: 0.2,
          r: 3
        }),
        Plot.line(platformData.monthlyData, {
          x: "date",
          y: "count",
          stroke: "platform",
          strokeWidth: 1.5,
          curve: "basis"
        })
      ]
    }))}
  </div>
</div>

<div class="grid grid-cols-1"> <div class="card"> <h2>Platform Analysis Insights</h2> <ul class="list-disc ml-6 mt-4 space-y-2"> <li><strong>Download Volume:</strong> Steam consistently shows the highest number of downloads, indicating a larger active user base.</li> <li><strong>Download Patterns:</strong> PlayStation and Xbox show steadier download patterns, while Steam shows higher variability with larger download spikes.</li> <li><strong>Platform Growth:</strong> All three platforms show download growth, with Steam's download rate growing most rapidly.</li> <li><strong>Market Potential:</strong> For indie developers, Steam offers the greatest potential for high download volumes due to its larger user base.</li> </ul> </div> </div> <div class="grid grid-cols-1"> <div class="card"> <h2>Recommendation</h2> <p class="mt-4">Based on the download trends analysis:</p> <ul class="list-disc ml-6 mt-2 space-y-2"> <li>For indie developers with limited resources: <strong>Focus on Steam</strong> first due to the higher download numbers and larger potential audience.</li> <li>For established studios: Consider a <strong>multi-platform approach</strong>, launching on all three platforms to maximize market reach.</li> <li>For games with monetization focus: <strong>Balance between platforms</strong> as PlayStation and Xbox users may have higher average spending per download.</li> </ul> </div> </div>