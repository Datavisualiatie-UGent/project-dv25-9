```js
const gamesCSV           = await FileAttachment(
    "./data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/playstation/games.csv"
).csv();
function parseGenres(raw) {
  try {
    return JSON.parse(raw.replace(/'/g, '"'));
  } catch {
    return [];
  }
}
```

```js 
//===================================================================================================================================================
//===================================================================================================================================================
```

```js
function heatmap(coOccurrence, names, { width } = {}) {
  const cells = names.flatMap(nameX =>
    names.map(nameY => {
      const row = coOccurrence.get(nameX);
      const value = row.has(nameY) ? row.get(nameY) : 0;
      return { x: nameX, y: nameY, value, fill: value };
    })
  );
  return Plot.plot({
    width,
    height: 500,
    x: {
      label: "Genre",
      domain: names,
      tickSize: 0
    },
    y: {
      label: "Genre",
      domain: names,
      tickSize: 0
    },
    color: {
      legend: true,
      type: "sequential",
    scheme: "blues",
      domain: [0, d3.max(cells, d => d.value)]
    },
    marks: [
      Plot.rect(cells, {
        x: "x",
        y: "y",
        fill: "fill",
        title: d => `${d.x} & ${d.y}: ${d.value}`,
        stroke: "white"
      })
    ]
  });
}
```

```js
const coOccurrence = new Map();
gamesCSV.forEach(game => {
  const genres = parseGenres(game.genres);
  genres.forEach((genre1, i) => {
    genres.slice(i + 1).forEach(genre2 => {
      if (!coOccurrence.has(genre1)) coOccurrence.set(genre1, new Map());
      if (!coOccurrence.has(genre2)) coOccurrence.set(genre2, new Map());
      const m1 = coOccurrence.get(genre1);
      m1.set(genre2, (m1.get(genre2) || 0) + 1);
      const m2 = coOccurrence.get(genre2);
      m2.set(genre1, (m2.get(genre1) || 0) + 1);
    });
  });
});
const names = Array.from(coOccurrence.keys());
const totals = Array.from(coOccurrence.entries()).map(([genre, innerMap]) => {
  const sum = Array.from(innerMap.values()).reduce((a, b) => a + b, 0);
  return [genre, sum];
});
const topNames = totals
  .sort(([, a], [, b]) => b - a)
  .slice(0, 10)
  .map(([genre]) => genre);
for (const nameX of topNames) {
  for (const nameY of topNames) {
    if (!coOccurrence.get(nameX).get(nameY)) {
      coOccurrence.get(nameX).set(nameY, 0);
    }
  }
}
const heatmapData = new Map(
  topNames.map(nameX => {
    // grab the original row (a Map<string,number>), or empty if missing
    const originalRow = coOccurrence.get(nameX) || new Map();
    // build a new inner Map with only topNames keys (filling 0 if absent)
    const prunedRow = new Map(
      topNames.map(nameY => [nameY, originalRow.get(nameY) || 0])
    );
    return [nameX, prunedRow];
  })
);
```

<div class="grid">
  <div class="card">
    <h2>Most change in download per genre (2023-2024).</h2>
    ${resize((width) => heatmap(heatmapData, topNames, { width }))}
  </div>
</div>

```js 
//===================================================================================================================================================
//===================================================================================================================================================
```

```js
const genreData = [];
const yearTotals = { 2023: 0, 2024: 0 };
for (const game of gamesCSV) {
  const year = new Date(game.release_date).getFullYear();
  if (year !== 2023 && year !== 2024) continue;
  yearTotals[year]++;
  const genres = parseGenres(game.genres);
  for (const genre of genres) {
    genreData.push({ genre, year });
  }
}
const counts = d3.rollups(
  genreData,
  v => v.length,
  d => d.genre,
  d => d.year
);
const allData = counts.map(([genre, yearMap]) => {
  const y2023 = yearMap.find(([y]) => y === 2023)?.[1] || 0;
  const y2024 = yearMap.find(([y]) => y === 2024)?.[1] || 0;
  const year1 = (y2023 / yearTotals[2023] * 100).toFixed(1);
  const year2 = (y2024 / yearTotals[2024] * 100).toFixed(1);
  return {
    name: genre,
    year1: +year1,
    year2: +year2,
    change: +(year2 - year1).toFixed(1)
  };
});
const sortedByChange = allData.sort((a, b) => b.change - a.change);
const topIncrease = sortedByChange.slice(0, 3);
const topDecrease = sortedByChange.slice(-3);
const slopeData = [...topIncrease, ...topDecrease];
```

```js
function slopeGraph(data, { width } = {}) {
  const tidy = data.flatMap(d => [
    { name: d.name, year: "Year 1", value: d.year1 },
    { name: d.name, year: "Year 2", value: d.year2 }
  ]);
  return Plot.plot({
    width,
    height: 500,
    x: {
      label: null,
      domain: ["Year 1", "Year 2"],
      tickSize: 0
    },
    y: {
      grid: true,
      label: "Value"
    },
    marks: [
      Plot.line(tidy, {
        x: "year",
        y: "value",
        z: "name",
        stroke: "name",
        strokeOpacity: 0.7
      }),
      Plot.text(tidy.filter(d => d.year === "Year 1"), {
        x: "year",
        y: "value",
        text: d => `${d.name} (${d.value})`,
        textAnchor: "end",
        dx: -6
      }),
      Plot.text(tidy.filter(d => d.year === "Year 2"), {
        x: "year",
        y: "value",
        text: d => `${d.name} (${d.value})`,
        textAnchor: "start",
        dx: 6
      })
    ]
  });
}
```

<div class="grid">
  <div class="card">
    <h2>Most change in download per genre (2023-2024).</h2>
    ${resize((width) => slopeGraph(slopeData, { width }))}
  </div>
</div>