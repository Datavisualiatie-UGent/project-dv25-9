---
theme: dashboard
title: Genre analysis
toc: true
---

# Which genres do gamers play?
</br>

<!-- All the data & functions related to interpreting genres. -->
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

function parseRawGenreList(raw) {
  try {
    return JSON.parse(raw.replace(/'/g, '"'));
  } catch {
    return [];
  }
}

const lowercaseLetters = Array.from('abcdefghijklmnopqrstuvwxyz');
const uppercaseLetters = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
const specialCharacters = Array.from(' &/-+');
const allowedChars = [...lowercaseLetters, ...uppercaseLetters, ...specialCharacters];
const specialRenamings = [
      [["Party!"], "Party"],
      [["Education", "Educational"], "Educational & Trivia"],
      [["Music/Rhythm", "Music+"], "Music & Rhythm"],
      [["Action Horror", "Action-Adventure", "Action-RPG"], "Action"],
      [["Survival Horror"], "Survival"],
      [["Video Production"], "Video"],
      [["Fps"], "First Person Shooter"],
      [["Multi-Player Online Battle Arena"], "Mmo Battle"],
      [["FPS"], "First Person Shooter"],
    ]

function postProcessGenreName(genre) {
    // Only allow certain characters.
    genre = Array.from(genre).filter(char => allowedChars.includes(char)).join('');

    // Capitalize words
    let sentence = [];
    let previousSpecial = true;
    for (let char of Array.from(genre)) {
      if (specialCharacters.includes(char)) {
        previousSpecial = true;
        sentence.push(char);
        continue;
      }
      if (previousSpecial) {
        previousSpecial = false;
        sentence.push(char.toUpperCase());
        continue;
      }
      sentence.push(char.toLowerCase());
      
    }
    genre = sentence.join('');

    // Trim whitespace before and after.
    genre = genre.trim();

    // Some special renamings. 
    for (const [list, rename] of specialRenamings) {
      if (list.includes(genre)) return rename;
    }

    // Finally return the new genre.
    return genre;
}
```

<!-- Data transform functions -->
```js
function buildMaps(platformCSVs) {
  const genreGameCountsMap = new Map();   // For each genre how many games there are.
  const genreCoOccurrenceMap = new Map(); // For each genre G1 a map of genres G2. The amount of G1 games that are also G2 games.  
  const genreYearCountMap = new Map();    //
  const yearGamesMap = new Map()

  platformCSVs.forEach((platformCSV) => {
    platformCSV.forEach((game) => {
      const releaseDate = game.release_date;
      const releaseYear = new Date(releaseDate).getFullYear();

      const gameGenres = parseRawGenreList(game.genres).map(postProcessGenreName);
      gameGenres.forEach((G1) => {

        // build yearGamesMap (technically not really correct; but count for each genre the game has)
        yearGamesMap.set(releaseYear, (yearGamesMap.get(releaseYear) || 0) + 1);

        // build genreGameCountsMap
        genreGameCountsMap.set(G1, (genreGameCountsMap.get(G1) || 0) + 1);

        // build genreCoOccurrenceMap
        if (!genreCoOccurrenceMap.has(G1)) genreCoOccurrenceMap.set(G1, new Map());
        gameGenres.forEach((G2) => {
          if (!genreCoOccurrenceMap.has(G2)) genreCoOccurrenceMap.set(G2, new Map());

          genreCoOccurrenceMap.get(G1).set(G2, (genreCoOccurrenceMap.get(G1).get(G2) || 0) + 1);
          genreCoOccurrenceMap.get(G2).set(G1, (genreCoOccurrenceMap.get(G2).get(G1) || 0) + 1);
        
        });

        // build genreYearCountMap
        if (!genreYearCountMap.has(G1)) genreYearCountMap.set(G1, new Map());
        genreYearCountMap.get(G1).set(releaseYear, (genreYearCountMap.get(G1).get(releaseYear) || 0) + 1);

      });
    });
  });

  // for later processing in case of Correlation Matrix, see buildMatrix
  return [ genreGameCountsMap, genreCoOccurrenceMap, genreYearCountMap, yearGamesMap ];
}

const mapsByPlatform = {
  Playstation: buildMaps([gamesCSVPlaystation]),
  Steam:       buildMaps([gamesCSVSteam]),
  XBox:        buildMaps([gamesCSVXbox]),
  All:         buildMaps([gamesCSVPlaystation, gamesCSVSteam, gamesCSVXbox])
};

function genresAboveMinGamesAmount(min, platform) {
  const [genreGameCountsMap, , , ] = mapsByPlatform[platform];
  return Array.from(genreGameCountsMap.entries())
    .filter(([, count]) => count >= min)
    .map(([genre, ]) => genre)
    .sort();
}
```

<!-- ============================================================================================================== -->
<!-- ============================================================================================================== -->

<!-- Correlation Matrix data postprocessing -->
```js
function buildMatrix(genres, genreGameCountsMap, genreCoOccurrenceMap) {
  // initialize matrix
  const N = genres.length;
  const matrix = Array.from({ length: N }, () => Array(N).fill(0));

  // fill matrix
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      let element = genreCoOccurrenceMap.get(genres[i]).get(genres[j]) || 0;  // set the basic element value
      element = element / 2;                                                  // divide by 2 to because we counted every game double (G1 -> G2 & G2 -> G1)
      element = element / genreGameCountsMap.get(genres[i]);                  // normalize between [0, 1] by dividing with the total game count for that genre
      element = element * 100;                                                // transform to percentages
      matrix[i][j] = element;
    }
  }

  return matrix;
}
```

<!-- Correlation Matrix plot -->
```js
function heatmap(matrix, genres, { width } = {}) {

  // define the cells to be use in the heatmap as a list
  const cells = [];
  for (let i = 0; i < genres.length; i++) {
    for (let j = 0; j < genres.length; j++) {
      let value = matrix[i][j]; // can't use matrix[i][j] directly, or will break
      cells.push({
        x: genres[i],
        y: genres[j],
        value,
        fill: value
      });
    }
  }

  // the actual heatmap with cells as markpoints
  return Plot.plot({
    width,
    height: 500,
    marginBottom: 90, // manually determined so that genre names don't go out of bounds
    marginLeft: 110,  // manually determined so that genre names don't go out of bounds
    x: {
      domain: genres,
      tickSize: 0,
      tickRotate: -45
    },
    y: {
      domain: genres,
      tickSize: 0,
    },
    color: {
      legend: true,
      type: "sequential",
      scheme: "blues",
      domain: [0, d3.max(cells, c => c.value)],
      label: "Overlap between genres (%)"
    },
    marks: [
      Plot.rect(cells, {
        x: "y",         // cell property "x"
        y: "x",         // cell property "y"
        fill: "fill",   // cell property "fill"
        stroke: "gray",
        title: c => `${c.x} games that are also ${c.y}: ${c.value.toFixed(1)}%`,
      })
    ]
  });
}
```

<!-- Correlation Matrix adaptive selectors -->
```js
const selectedPlatform = Inputs.radio(
  Object.keys(mapsByPlatform), {
    label: "Platform:",
    multiple: false,
    value: "Steam", // default
  });
let viewSelectedPlatform = view(selectedPlatform);
```

```js
const selectedMinGamesAmount = Inputs.range(
  [0, 1000], {
    label: "Minimum # games per genre:",
    step: 1, 
    value: 100, // default
  });
let viewSelectedMinGamesAmount = view(selectedMinGamesAmount);
```

```js
const selectedGenres = Inputs.checkbox(genresAboveMinGamesAmount(viewSelectedMinGamesAmount, viewSelectedPlatform), {
    label: "Included genres:",
    multiple: true,
    value: genresAboveMinGamesAmount(viewSelectedMinGamesAmount, viewSelectedPlatform), // default
});
let viewSelectedGenres = view(selectedGenres);
```

<!-- Stat card -->
```js
function statCard(selectedPlatform, selectedMinGamesAmount) {
  /* ALSO USED BY LINE CHART */
  const [genreGameCountsMap, , , yearGamesMap] = mapsByPlatform[selectedPlatform];

  // Total games
  const totalGames = Array.from(yearGamesMap.values()).reduce((total, count) => total + count, 0);

  // Selected games
  let selectedGamesCount = 0;
  genresAboveMinGamesAmount(selectedMinGamesAmount, selectedPlatform).forEach((genre) => {
    selectedGamesCount += genreGameCountsMap.get(genre) || 0;
  });

  // Calculate percentage
  const percentage = (selectedGamesCount / totalGames) * 100;

  const name = "Percentage games included:";
  const number = percentage.toFixed(2)

  const container = document.createElement("div");
  container.className = "grid grid-cols-1 md:grid-cols-2 gap-4 mb-4";
  
  const card = document.createElement("div");
  card.className = "card p-4";
  card.innerHTML = `
    <h2 style="font-size: 16px; margin-bottom: 8px;">${name}</h2>
    <span style="font-size: 28px; font-weight: bold;">${number.toLocaleString("en-US")}%</span>
  `;
  
  container.appendChild(card);
  return container;
}
```

<!-- Correlation Matrix adaptive plot -->
```js
function displayHeatmap(width) {
  const [ genreGameCountsMap, genreCoOccurrenceMap, , ] = mapsByPlatform[viewSelectedPlatform];
  const matrix = buildMatrix(viewSelectedGenres, genreGameCountsMap, genreCoOccurrenceMap);
  return heatmap(matrix, viewSelectedGenres, { width });
}
```

<!-- Correlation Matrix display -->
## Correlation between genres

<div class="card">
  ${selectedPlatform}
  ${selectedMinGamesAmount}
  ${selectedGenres}
</div>

<div class="card">
  ${resize((width) => displayHeatmap(width))}
  ${statCard(viewSelectedPlatform, viewSelectedMinGamesAmount)}
</div>

The darkness of a square represents (in %) how many games that have the genre on the y-axis, also have the genre on the x-axis. For example, if we want to know the correlation between Action games and Violent games, we can look at it in two ways:
1. Action (y-axis)  & Violent (x-axis) -> 0.8% of Action games are also Violent.
2. Violent (y-axis) & Action  (x-axis) -> 71.8% of Violent games are also Action.

Some observations:
- Almost all Gore games are also marked Violent, which makes sense.
- About 75% of all games are Indie. An outlier is Massively Multiplayer games. This is probably because they are harder to develop and require more funding and programming.
- Some of the games are not actual games, but rather utility applications.

<!-- ============================================================================================================== -->
<br></br>
<!-- ============================================================================================================== -->

<!-- Line Chart plot -->
```js
import iwanthue from "iwanthue";

function lineChart(genreYearCountMap, yearGamesMap, genres, years, relative, { width } = {}) {

  console.log(yearGamesMap)

  // do not use 2025 as it is not complete
  if (years[years.length-1] == 2025) {
    years = years.slice(0, -1); 
  }

  const allGenres = Array.from(genreYearCountMap.keys()).sort();
  const colorScale = d3.scaleOrdinal(allGenres, iwanthue(allGenres.length))

  const points = [];
  genres.forEach((genre) => {
    years.forEach((year) => {
      let count = genreYearCountMap.get(genre).get(year) || 0;

      // only show if there are at least 20 games, otherwise too discontinuous
      if (count > 20) {

        if (relative) {
          count = count / yearGamesMap.get(year);
        }

        points.push({
          genre: genre,
          year: year,
          count: count
        })

      }
    })
  })

  return Plot.plot({
    width,
    height: 500,
    x: {
      grid: true,
      tickFormat: d3.format("d")
    },
    y: {
      grid: true
    },
    color: {
      type: "categorical",
      domain: genres,
      range: genres.map(g => colorScale(g)),
      legend: true
    },
    marks: [
      // The main lines
      Plot.line(points, {
        x: "year",
        y: "count",
        z: "genre",
        stroke: "genre",
      }),

      // tooltip
      Plot.line(points, {
        x: "year",
        y: "count",
        z: "genre",
        title: "genre",
        strokeWidth: 15,
        strokeOpacity: 0,
        hover: {
          strokeOpacity: 0.2
        }
      }),
      Plot.dot(points, {
        x: "year",
        y: "count",
        z: "genre",
        title: "genre",
        strokeOpacity: 0,
        strokeWidth: 20
      }),

      // Crosshair lines (axis-aligned rules + labels)
      //Plot.crosshair(points, {
      //  x: "year",
      //  y: "count",
      //  z: 100,
      //})
    ]
  });
}
```

<!-- Line Chart adaptive selectors -->
```js
const selectedPlatform2 = Inputs.radio(
  Object.keys(mapsByPlatform), {
    label: "Platform:",
    multiple: false,
    value: "Steam", // default
  });
let viewSelectedPlatform2 = view(selectedPlatform2);
```

```js
const selectedMinGamesAmount2 = Inputs.range(
  [100, 1000], {
    label: "Minimum # games per genre:",
    step: 1, 
    value: 200, // default
  });
let viewSelectedMinGamesAmount2 = view(selectedMinGamesAmount2);
```

```js
const selectedGenres2 = Inputs.checkbox(genresAboveMinGamesAmount(viewSelectedMinGamesAmount2, viewSelectedPlatform2), {
    label: "Included genres:",
    multiple: true,
    value: ["Action", "Strategy", "Indie", "Free To Play"]
});
let viewSelectedGenres2 = view(selectedGenres2);
```

```js
const selectedRelative2 = Inputs.radio(["relative", "absolute"], {
    value: "relative", // default
});
let viewSelectedRelative2 = view(selectedRelative2);
```

<!-- Line Chart adaptive plot -->
```js
function displayLinechart(width) {
  const [ , , genreYearCountMap, yearGamesMap ] = mapsByPlatform[viewSelectedPlatform2];
  
  let allYears = new Set();
  for (const subMap of genreYearCountMap.values()) {
    for (const year of subMap.keys()) {
      allYears.add(year);
    }
  }
  allYears = Array.from(allYears).sort();

  const relative = viewSelectedRelative2 == "relative";

  return lineChart(genreYearCountMap, yearGamesMap, viewSelectedGenres2, allYears, relative, { width });
}
```

<!-- Line Chart display -->
## Genre release trend

<div class="card">
  ${selectedPlatform2}
  ${selectedMinGamesAmount2}
  ${selectedGenres2}
</div>

<div class="card">
  <p>Selecting relative will normalize the game count to the total # games for that year.</p>
  ${selectedRelative2}
</div>

<div class="card">
  ${resize((width) => displayLinechart(width))}
  ${statCard(viewSelectedPlatform2, viewSelectedMinGamesAmount2)}
</div>

Action and Strategy games were more popular in the early 2000's, compared to now.
This could be explained because as the amount of games increase, more specific sub-genres are being used.
The term Indie was not really in use at that time, but became mainstream quickly after.
It is difficult to predict which genres will become more popular in the future; most stay constant.
One genre that is seeing a slow but steady increase, however, is Free To Play games.