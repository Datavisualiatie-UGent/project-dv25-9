```js
const gamesCSVPlaystation     = await FileAttachment(
    "./data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/playstation/games.csv"
).csv();
const gamesCSVSteam           = await FileAttachment(
    "./data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/steam/games.csv"
).csv();
const gamesCSVXbox            = await FileAttachment(
    "./data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/xbox/games.csv"
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
function heatmap(matrix, names, { width } = {}) {
  const cells = names.flatMap((nameX, i) =>
    names.map((nameY, j) => {
      let value = matrix[i][j];
      if (value > 100) {value = 100;}
      return { x: nameX, y: nameY, value, fill: value };
    })
  );
  return Plot.plot({
    width,
    height: 500,
    marginBottom: 90,
    marginLeft: 110,
    x: {
      label: "",
      domain: names,
      tickSize: 0,
      tickRotate: -45
    },
    y: {
      label: "",
      domain: names,
      tickSize: 0,
      tickRotate: 0
    },
    color: {
      legend: true,
      type: "sequential",
      scheme: "blues",
      domain: [0, d3.max(cells, d => d.value)],
      label: "Overlap between genres (%)"
    },
    marks: [
      Plot.rect(cells, {
        x: "y",
        y: "x",
        fill: "fill",
        title: d => `${d.x} games that are also ${d.y}: ${d.value.toFixed(1)}%`,
        stroke: "gray",
      })
    ]
  });
}
```

```js
function transformGenre(genre) {
    const allowedChars = [
    ...'abcdefghijklmnopqrstuvwxyz',
    ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    ...' &/-+',
    ];
    genre = Array.from(genre)
        .filter(char => allowedChars.includes(char))
        .join('');
    genre = genre.trim();
    genre = genre.charAt(0).toUpperCase() + genre.slice(1);
    if (["Party!"].includes(genre)) return "Party";
    if (["Education", "Educational"].includes(genre)) return "Educational & Trivia";
    if (["MUSIC/RHYTHM", "Music+"].includes(genre)) return "Music & Rhythm";
    if (["Action Horror", "Action-Adventure", "Action-RPG"].includes(genre)) return "Action";
    if (["Survival Horror"].includes(genre)) return "Survival";
    if (["Video Production"].includes(genre)) return "Video";
    if (["FPS"].includes(genre)) return "First Person Shooter";
    if (["Multi-player Online Battle Arena"].includes(genre)) return "MMO Battle";
    if (["FPS"].includes(genre)) return "First Person Shooter";
    //if (genre.length < 20) return "X";
    return genre;
}

const coOccurrence = new Map();
const namesCounts = new Map();

function addGenres(csv) {
    csv.forEach(game => {
        const gameGenres = parseGenres(game.genres);
        gameGenres.forEach((G) => {
            G = transformGenre(G);
            // add genre G to the set
            namesCounts.set(G, (namesCounts.get(G) || 0) + 1);
            // for each other genre g in the list, increase the co-occurence with G
            gameGenres.forEach(g => {
            g = transformGenre(g);
            if (!coOccurrence.has(G)) coOccurrence.set(G, new Map());
            if (!coOccurrence.has(g)) coOccurrence.set(g, new Map());
            const m1 = coOccurrence.get(G);
            m1.set(g, (m1.get(g) || 0) + 1);
            const m2 = coOccurrence.get(g);
            m2.set(G, (m2.get(G) || 0) + 1);
            });
        });
    });
}
addGenres(gamesCSVPlaystation);
addGenres(gamesCSVSteam);
addGenres(gamesCSVXbox);

const names = Array.from(namesCounts)
    .filter(([_, count]) => count > 300)
    .map(([name, _]) => name)
    .sort();
const N = names.length;

const matrix = Array.from({ length: N }, () => Array(N).fill(0));
for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
        matrix[i][j] = coOccurrence.get(names[i]).get(names[j]) || 0
        matrix[i][j] = matrix[i][j] / namesCounts.get(names[i]) 
        matrix[i][j] = matrix[i][j] / 2
        matrix[i][j] = matrix[i][j] * 100
    }
}

```

```js
const selectedNames = Inputs.checkbox(names, {
    label: "Select genres to include",
    multiple: true,
    value: names
});
let viewSelectedNames = view(selectedNames)
```

```js
const selectedPlatform = Inputs.radio(
    ["Playstation", "Steam", "XBox", "All"], {
    label: "Select genres to include",
    multiple: false,
    value: "Playstation"
});
let viewSelectedPlatform = view(selectedPlatform)
```

```js
const selectedMinimumAmount = Inputs.range([0, 1000], {step: 1, value: 300})
let viewSelectedMinimumAmount = view(selectedMinimumAmount)
```

<div class="grid">
  <div class="card">
    <h2>Correlation matrix of genres.</h2>
    ${selectedPlatform}
    ${selectedMinimumAmount}
    ${selectedNames}
    ${resize((width) => {
      const idx = viewSelectedNames
        .map(n => names.indexOf(n))
        .filter(i => i >= 0);
      const filteredMatrix = idx.map(i =>
        idx.map(j => matrix[i][j])
      );
      return heatmap(filteredMatrix, viewSelectedNames, { width });
    })}
  </div>
</div>

```js   
//===================================================================================================================================================
//===================================================================================================================================================
```

```js
/*
const genreData = [];
const yearTotals = { 2023: 0, 2024: 0 };
for (const game of gamesCSV) {
  const year = new Date(game.release_date).getFullYear();
  if (year !== 2023 && year !== 2024) continue;
  yearTotals[year]++;
  const gameGenres = parseGenres(game.gameGenres);
  for (const genre of gameGenres) {
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
*/
```

```js
/*
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
*/
```

```js
/*
<div class="grid">
  <div class="card">
    <h2>Most change in download per genre (2023-2024).</h2>
    ${resize((width) => slopeGraph(slopeData, { width }))}
  </div>
</div>
*/
```