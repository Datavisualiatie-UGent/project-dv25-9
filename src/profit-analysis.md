---
theme: dashboard
title: Introduction
toc: false
---

<!-- All the data & functions related to interpreting genres. -->
```js
const gamesCSVPlaystation           = await FileAttachment(
    "./data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/playstation/games.csv"
).csv();
const purchasedGamesCSVPlaystation  = await FileAttachment(
    "./data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/playstation/purchased_games.csv"
).csv();
const pricesCSVPlaystation          = await FileAttachment(
    "./data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/playstation/prices.csv"
).csv();

const gamesCSVSteam           = await FileAttachment(
    "./data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/steam/games.csv"
).csv();
const purchasedGamesCSVSteam  = await FileAttachment(
    "./data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/steam/purchased_games.csv"
).csv();
const pricesCSVSteam          = await FileAttachment(
    "./data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/steam/prices.csv"
).csv();

const gamesCSVXbox           = await FileAttachment(
    "./data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/xbox/games.csv"
).csv();
const purchasedGamesCSVXbox  = await FileAttachment(
    "./data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/xbox/purchased_games.csv"
).csv();
const pricesCSVXbox          = await FileAttachment(
    "./data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/xbox/prices.csv"
).csv();

function platformSpecificData(platforms) {
  let allGames = [];
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  let meanProfit = 0;
  
  // Iterate over each platform
  platforms.forEach(platform => {
    let gamesCSV;
    let purchasedGamesCSV;
    let pricesCSV;

    if (platform == "Playstation") {
      gamesCSV = gamesCSVPlaystation;
      purchasedGamesCSV = purchasedGamesCSVPlaystation;
      pricesCSV = pricesCSVPlaystation;
    } else if (platform == "Steam") {
      gamesCSV = gamesCSVSteam;
      purchasedGamesCSV = purchasedGamesCSVSteam;
      pricesCSV = pricesCSVSteam;
    } else if (platform == "Xbox") {
      gamesCSV = gamesCSVXbox;
      purchasedGamesCSV = purchasedGamesCSVXbox;
      pricesCSV = pricesCSVXbox;
    }

    const downloadsMap = new Map();
    for (const row of purchasedGamesCSV) {
      if (!row.library || !row.library.trim()) continue;

      let library;
      try {
        library = JSON.parse(row.library);
      } catch (err) {
        console.warn("Skipping invalid library JSON:", row.library, err);
        continue;
      }

      for (const gameid of library) {
        const id = Number(gameid);
        downloadsMap.set(id, (downloadsMap.get(id) || 0) + 1);
      }
    }

    const priceMap = new Map();
    for (const row of pricesCSV) {
      const existing = priceMap.get(row.gameid);
      priceMap.set(parseInt(row.gameid), parseFloat(row.eur));
    }

    const platformGames = gamesCSV
      .map((game) => {
        const id = parseInt(game.gameid);
        const gamePrice = priceMap.get(id);
        const gameDownloads = downloadsMap.get(id);
        return {
          title: game.title,
          price: gamePrice,
          downloads: gameDownloads,
          profit: gamePrice * gameDownloads,
          developers: parseRawList(game.developers),
          publishers: parseRawList(game.publishers),
        };
      })
      .filter((e) => e.price != null && e.downloads != null)
      .filter((e) => e.price < 80)
      .sort((a, b) => b.profit - a.profit);

    // Combine the results from all platforms
    allGames = allGames.concat(platformGames);
  });

  // Calculate the minPrice, maxPrice, and meanProfit across all platforms
  const profits = allGames.map(d => d.profit);
  meanProfit = d3.mean(profits);
  [minPrice, maxPrice] = d3.extent(allGames, d => d.price);

  return [allGames, minPrice, maxPrice, meanProfit];
}

const platformSpecificDataMap = {
  Playstation: platformSpecificData(["Playstation"]),
  Steam:       platformSpecificData(["Steam"]),
  XBox:        platformSpecificData(["Xbox"]),
  All:         platformSpecificData(["Playstation", "Steam", "Xbox"])
};

function parseRawList(raw) {
  try {
    return JSON.parse(raw.replace(/'/g, '"'));
  } catch {
    return [];
  }
}
```

<!-- ============================================================================================================== -->
<!-- ============================================================================================================== -->

```js
function downsampleFirstBiased(list) {
  const N = list.length;
  if (N === 0) return [];

  // 1) Compute base target size = floor(N/10)
  // 2) Ensure at least 20 slots (so first 20 always fit)
  const target = Math.max(20, Math.floor(N / 10));

  // 3) Pick indices by quadratic mapping (k/(target-1))^2 * (N-1)
  const idxSet = new Set();
  for (let k = 0; k < target; k++) {
    // t runs from 0 to 1
    const t = target === 1 ? 0 : k / (target - 1);
    // square to bias toward t=0 (start of list)
    const i = Math.floor(t * t * (N - 1));
    idxSet.add(i);
  }

  // 4) Ensure first 20 always included
  for (let i = 0; i < 20 && i < N; i++) {
    idxSet.add(i);
  }

  // 5) Build final array in original order
  const indices = Array.from(idxSet).sort((a, b) => a - b);
  return indices.map(i => list[i]);
}
```

<!-- Scatter Plot -->
```js
function scatterPlot(games, minPrice, maxPrice, meanProfit, { width } = {}) {
  const meanLinePoints = d3.range(minPrice, maxPrice, 0.5).map(price => ({
    x: price,
    y: meanProfit / price
  }));

  const top5 = games.slice(0, 5);

  games = downsampleFirstBiased(games);

  const plot = Plot.plot({
    width,
    height: 500,
    marginRight: 53,
    x: {
      label: "Price",
      grid: true,
      labelAnchor: "center",
    },
    y: {
      label: "Downloads",
      grid: true,
    },
    color: {
      type: "linear",
      domain: [0, d3.max(games, d => d.profit)],
      range: ["lightblue", "red"],
      legend: true,
      label: "Total Profit"
    },
    marks: [
      Plot.dot(games, {
        x: "price",
        y: "downloads",
        title: "title",
        r: 5,
        fill: g => g.profit,
        fillOpacity: 0.8,
      }),
      Plot.text(top5.filter((_, i) => i % 2 === 0), {
        x: "price",
        y: "downloads",
        text: "title",
        dx: -8,
        dy: -4,
        fill: "white",
        fontSize: 12,
        textAnchor: "end"
      }),
      Plot.text(top5.filter((_, i) => i % 2 === 1), {
        x: "price",
        y: "downloads",
        text: "title",
        dx: 8,
        dy: 4,
        fill: "white",
        fontSize: 12,
        textAnchor: "start"
      }),
      Plot.line(meanLinePoints, {
        x: "x",
        y: "y",
        stroke: "red",
        strokeWidth: 2,
      })
    ]
  });

  // Create the SVG container
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const svgWidth = 1;
  const svgHeight = 30;
  const marginRight = -117;
  svg.setAttribute('width', svgWidth);
  svg.setAttribute('height', svgHeight);
  svg.style.position = 'absolute';
  svg.style.top = '0px';
  svg.style.right = `${svgWidth - marginRight}px`;
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute('x1', 10);
  line.setAttribute('y1', 15);
  line.setAttribute('x2', 30);
  line.setAttribute('y2', 15);
  line.setAttribute('stroke', "red");
  line.setAttribute('stroke-width', 2);
  svg.appendChild(line);

  // Container div
  const containerDiv = document.createElement('div');
  containerDiv.style.position = 'relative';
  containerDiv.style.width = `${width}px`;
  containerDiv.style.height = '550px';
  containerDiv.appendChild(plot);
  containerDiv.appendChild(svg);

  return containerDiv;
}
```

<!-- Scatter Plot adaptive selectors -->
```js
const selectedPlatform = Inputs.radio(
  Object.keys(platformSpecificDataMap).slice(0, -1), {
    label: "Platform:",
    multiple: false,
    value: "Playstation", // default
  });
let viewSelectedPlatform = view(selectedPlatform);
```

<!-- Scatter Plot adaptive -->
```js
function displayScatterPlot(width) {
  const [games, minPrice, maxPrice, meanProfit] = platformSpecificDataMap[viewSelectedPlatform];
  return scatterPlot(games, minPrice, maxPrice, meanProfit, { width });
}
```

# Profit of games

<div class="card">
  ${selectedPlatform}
</div>

<div class="card">
  <h2>Game Price (€) vs Downloads</h2>
  ${resize((width) => displayScatterPlot(width))}
</div>

This scatter plot shows for each game the selling price on the x-axis and the amount of downloads, or amount of units sold, on the y-axis. The profit is calculated as the amount of downloads times the price. The mean profit of all games is shown as the red line. Games below this line have less profit than the average game. Games above the line have more. The color of a dot indicates the total profit; the redder, the higher.

<!-- ============================================================================================================== -->
<br></br>
<!-- ============================================================================================================== -->

<!-- Most Profitable adaptive selectors -->
```js
const selectedPlatform2 = Inputs.radio(
  Object.keys(platformSpecificDataMap), {
    label: "Platform:",
    multiple: false,
    value: "Playstation", // default
  });
let viewSelectedPlatform2 = view(selectedPlatform2);
```

```js
const selectedDevPub = Inputs.radio(
  ["Developers", "Publishers"], {
    label: "Type:",
    multiple: false,
    value: "Developers", // default
  });
let viewSelectedDevPub = view(selectedDevPub);
```

<!-- Most Profitable adaptive -->
```js
function displayMostProfitable(width) {
  const [games, , , ] = platformSpecificDataMap[viewSelectedPlatform2];
  
  const developersGames = [];
  for (const game of games) {
    if (viewSelectedDevPub == "Developers") {
      for (const dev of game.developers) {
        developersGames.push([dev, game.profit]);
      }
    } else {
      for (const dev of game.publishers) {
        developersGames.push([dev, game.profit]);
      }
    }
  }

  const agg = {};
  for (const [name, profit] of developersGames) {
    if (!agg[name]) {
      agg[name] = { count: 0, totalProfit: 0 };
    }
    agg[name].count += 1;
    agg[name].totalProfit += profit;
  }

  const sorted = Object.entries(agg)
    .map(([name, {count, totalProfit}]) => ({ name, count, totalProfit }))
    .sort((a, b) => b.totalProfit - a.totalProfit);

  const top3 = sorted.slice(0, 3); //  { name: "", count: 0, totalProfit: 0 },

  function prettyProfit(number) {
    return number.toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  return html`<table>
  <tr>
    <th></th>
    <th>${viewSelectedDevPub.slice(0,-1)}</th>
    <th>Profit</th>
  </tr>
  <tr>
    <td>1.</td>
    <td>${top3[0].name}</td>
    <td>${prettyProfit(top3[0].totalProfit)}€</td>
  </tr>
  <tr>
    <td>2.</td>
    <td>${top3[1].name}</td>
    <td>${prettyProfit(top3[1].totalProfit)}€</td>
  </tr>
  <tr>
    <td>3.</td>
    <td>${top3[2].name}</td>
    <td>${prettyProfit(top3[2].totalProfit)}€</td>
  </tr>
  </table>`;
}
```

# Most profitable developers and publishers

<div class="card">
  ${selectedPlatform2}
  ${selectedDevPub}
</div>

<div class="card">
  <h2>Top 3 most profitable developers:</h2>
  ${resize((width) => displayMostProfitable(width))}
</div>