```js
function scatterPlot(games, { width } = {}) {
  const meanLinePoints = d3.range(minPrice, maxPrice, 0.5).map(price => ({
    x: price,
    y: meanProfit / price
  }));

  const plot = Plot.plot({
    width,
    height: 500,
    x: {
      label: "Price",
      grid: true
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
  //const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  //rect.setAttribute('x', 0);
  //rect.setAttribute('y', 0);
  //rect.setAttribute('width', 70);
  //rect.setAttribute('height', 30);
  //rect.setAttribute('rx', 6);
  //rect.setAttribute('ry', 6);
  //rect.setAttribute('stroke', "#ccc");
  //svg.appendChild(rect);
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute('x1', 10);
  line.setAttribute('y1', 15);
  line.setAttribute('x2', 30);
  line.setAttribute('y2', 15);
  line.setAttribute('stroke', "red");
  line.setAttribute('stroke-width', 2);
  svg.appendChild(line);
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute('x', 40);
  text.setAttribute('y', 19);
  text.setAttribute('font-size', 12);
  text.setAttribute('fill', 'white');
  text.textContent = "Mean profit";
  svg.appendChild(text);

  // Container div
  const containerDiv = document.createElement('div');
  containerDiv.style.position = 'relative';
  containerDiv.style.width = `${width}px`;
  containerDiv.style.height = '500px';
  containerDiv.appendChild(plot);
  containerDiv.appendChild(svg);

  return containerDiv;
}

const gamesCSV           = await FileAttachment(
    "./data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/playstation/games.csv"
).csv();
const purchasedGamesCSV  = await FileAttachment(
    "./data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/playstation/purchased_games.csv"
).csv();
const pricesCSV          = await FileAttachment(
    "./data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/playstation/prices.csv"
).csv();


const downloadsMap = new Map();
for (const row of purchasedGamesCSV) {
  const library = JSON.parse(row.library);
  for (const gameid of library) {
    downloadsMap.set(parseInt(gameid), (downloadsMap.get(gameid) || 0) + 1);
  }
}

const priceMap = new Map();
for (const row of pricesCSV) {
  const existing = priceMap.get(row.gameid);
  priceMap.set(parseInt(row.gameid), parseFloat(row.eur));
}

const games = gamesCSV
  .map((game) => {
    const id = parseInt(game.gameid)
    const gamePrice = priceMap.get(id);
    const gameDownloads = downloadsMap.get(id);
    return {
      title: game.title,
      price: gamePrice,
      downloads: gameDownloads,
      profit: gamePrice * gameDownloads,
    };
  })
  .filter((e) => e.price != null && e.downloads != null);

const meanProfit = d3.mean(games, (d) => d.price * d.downloads);
const [minPrice, maxPrice] = d3.extent(games, d => d.price);

```

<div class="grid">
  <div class="card">
    <h2>Game Price (€) vs Downloads</h2>
    ${resize((width) => scatterPlot(games, { width }))}
  </div>
</div>