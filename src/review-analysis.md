---
theme: dashboard
title: Steam review analysis
toc: false
---

# Steam review analysis

This page analyzes the frequency of word compounds (adjective + noun) in reviews.

```js
// Import CSV loader from d3
import {csv} from "d3-fetch";

// Load reviews directly from data directory
const reviews = FileAttachment("data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/steam/reviews.csv").csv({typed: true});
//reviews[0] // Show a sample review
```

```js
function getTotalWordCount() {
  // Get all review texts
  const reviewTexts = reviews
    .map(d => d["review"] || "")
    .filter(text => text.length > 0);
  
  // Count total words (split by spaces)
  let totalWords = 0;
  
  for (let i = 0; i < reviewTexts.length; i++) {
    const text = reviewTexts[i];
    const words = text.split(/\s+/).filter(w => w.length > 0);
    totalWords += words.length;
  }
  
  return totalWords;
}

// Process reviews to find only adjective+noun compounds
function getWordCounts() {
  // Extract all review text
  const reviewTexts = reviews
    .map(d => d["review"] || "")
    .filter(text => text.length > 0);

  const gameAdjectives = new Set([
    "good", "great", "amazing", "awesome", "beautiful", "excellent", "fantastic", 
    "perfect", "brilliant", "impressive", "incredible", "outstanding", "superb", 
    "wonderful", "nice", "stunning", "gorgeous", "innovative", "immersive", "engaging",
    "addictive", "enjoyable", "fun", "exciting", "solid", "strong", "unique", "rich",
    "detailed", "polished", "smooth", "fluid", "responsive", "intuitive", "realistic",
    "interesting", "deep", "complex", "challenging", "rewarding", "satisfying", "fresh",
    "simple", "basic", "decent", "average", "standard", "okay", "fine", "fair",
    "different", "classic", "original", "traditional", "modern", "new", "old",
    "long", "short", "quick", "slow", "linear", "open", "big", "small", "high", "low",
    "bad", "poor", "terrible", "horrible", "awful", "weak", "disappointing", 
    "frustrating", "annoying", "boring", "repetitive", "tedious", "clunky", 
    "buggy", "glitchy", "broken", "unfinished", "unpolished", "mediocre", "generic",
    "dull", "shallow", "difficult", "hard", "confusing", "complicated", "overpriced",
    "unbalanced", "unfair", "ugly", "outdated", "unresponsive", "laggy", "slow",
    "cinematic", "atmospheric", "tactical", "strategic", "epic", "vast", "seamless",
    "arcade", "retro", "indie", "AAA", "hardcore", "casual", "realistic", "intense",
    "competitive", "cooperative", "endless", "procedural", "dynamic", "innovative",
    "nostalgic", "refreshing", "surprising", "clever", "minimalist", "stylish", "artistic",
    "charming", "cute", "dark", "gritty", "mature", "scary", "thrilling", "relaxing",
    "peaceful", "colorful", "vibrant", "crisp", "clean", "photo", "clear", "blurry",
    "detailed", "expansive", "massive", "huge", "tiny", "compact", "streamlined", 
    "elegant", "quirky", "unique", "diverse", "varied", "limited", "restrictive",
    "expensive", "cheap", "free", "premium", "worthwhile", "worth", "terrible", 
    "awful", "amazing", "wonderful", "meh", "alright", "okay", "brilliant", "perfect",
    "optimized", "stable", "balanced", "consistent", "random", "reliable", "secure",
    "persistent", "online", "offline", "singleplayer", "multiplayer", "local", "coop",
    "fast", "slow", "quick", "delayed", "smooth", "choppy", "steady", "unstable",
    "compatible", "incompatible", "customizable", "adjustable", "modded", "improved",
    "enhanced", "upgraded", "downgraded", "nerfed", "buffed", "patched", "updated",
    "playable", "unplayable", "beatable", "unbeatable", "gripping", "entertaining",
    "working", "functioning", "bugged", "glitched", "hacked", "modded", "running",
    "loading", "saving", "crashing", "playing", "fighting", "shooting", "driving",
    "racing", "building", "crafting", "gathering", "exploring", "surviving"
  ]);

  const gameNouns = new Set([
    "graphics", "gameplay", "story", "plot", "narrative", "characters", "dialogue",
    "experience", "controls", "mechanics", "physics", "design", "level", "levels",
    "music", "sound", "audio", "soundtrack", "effects", "value", "price", "content",
    "combat", "action", "fighting", "shooting", "puzzles", "missions", "quests",
    "visuals", "world", "universe", "environment", "map", "maps", "landscape", "scenery",
    "performance", "framerate", "optimization", "multiplayer", "singleplayer", "campaign",
    "mode", "replayability", "balance", "difficulty", "challenge", "progression", "system",
    "animations", "cutscenes", "interface", "menu", "camera", "movement", "pacing",
    "voice", "acting", "writing", "atmosphere", "immersion", "AI", "enemies", "bosses",
    "characters", "protagonist", "antagonist", "hero", "villain", "NPCs", "weapons",
    "items", "gear", "inventory", "crafting", "leveling", "skills", "abilities", "powers",
    "art", "style", "direction", "decisions", "choices", "community", "developers",
    "updates", "support", "customization", "features", "ending", "beginners", "veterans",
    "players", "accessibility", "servers", "matchmaking", "economy", "microtransactions",
    "achievements", "trophies", "unlocks", "leaderboards", "ranking", "cosmetics", 
    "skins", "avatars", "costumes", "DLC", "expansion", "update", "patch", "mod",
    "workshop", "creator", "editor", "controller", "keyboard", "mouse", "settings",
    "options", "menu", "HUD", "UI", "tutorial", "guide", "hints", "tips", "tricks",
    "cheats", "exploits", "glitches", "bugs", "crashes", "errors", "loading", "saving",
    "checkpoint", "autosave", "install", "download", "update", "uninstall", "purchase",
    "transaction", "subscription", "season", "pass", "premium", "free", "paid",
    "RPG", "FPS", "RTS", "MOBA", "MMO", "platformer", "roguelike", "roguelite", 
    "simulator", "simulation", "strategy", "puzzle", "adventure", "action", "horror", 
    "survival", "sandbox", "open", "linear", "story", "narrative", "dungeon", "crawler",
    "shooter", "battle", "royale", "mmorpg", "rpg", "sports", "racing", "driving",
    "flying", "arcade", "indie", "AAA", "mobile", "console", "pc", "game", "gaming",
    "esports", "competitive", "casual", "hardcore", "speedrun", "challenge",
    "textures", "models", "animation", "rigging", "netcode", "engine", "lighting",
    "shadows", "reflections", "physics", "collision", "detection", "particle", "effects",
    "draw", "distance", "pop", "aliasing", "resolution", "frame", "rate", "fps",
    "refresh", "rate", "input", "lag", "latency", "ping", "connection", "server",
    "client", "host", "p2p", "dedicated", "browser", "matchmaking", "lobby",
    "chat", "voice", "text", "communication", "crossplay", "compatibility",
    "area", "zone", "region", "location", "dungeon", "raid", "instance", "open",
    "world", "hub", "city", "town", "village", "castle", "fortress", "base", "camp",
    "post", "outpost", "settlement", "building", "structure", "house", "shop", "store",
    "vendor", "trader", "merchant", "auction", "bank", "storage", "chest", "locker",
    "battlefield", "arena", "stadium", "track", "circuit", "course", "route", "path",
    "trail", "road", "river", "lake", "ocean", "sea", "mountain", "hill", "forest",
    "jungle", "desert", "tundra", "plains", "cave", "mine", "ruins", "temple", "shrine"
  ]);

  // Only collect phrases, no individual words
  let phrases = [];
  
  // Process a limited number of reviews
  const sampleSize = reviewTexts.length; // INCREASED sample for better coverage
  console.log(`Processing ${sampleSize} reviews out of ${reviewTexts.length} total`);
  
  for (let i = 0; i < sampleSize; i++) {
    const text = reviewTexts[i];
    
    // Clean text
    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, "");
    const tokens = cleanText.split(/\s+/);
    
    // Extract key phrases (adjective + noun combinations)
    for (let j = 0; j < tokens.length - 1; j++) {
      const firstWord = tokens[j];
      const secondWord = tokens[j+1];
      
      if (gameAdjectives.has(firstWord) && gameNouns.has(secondWord)) {
        phrases.push(firstWord + " " + secondWord);
      }
    }
  }

  // Since we're only using phrases, we don't need to combine with words
  // Count occurrences
  return d3.rollup(phrases, v => v.length, w => w);
}

// Convert to array for plotting
const wordCounts = Array.from(getWordCounts(), ([word, count]) => ({word, count}))
  .sort((a, b) => b.count - a.count)
  .slice(0, 100);
```

<!-- Get basic info about the data -->
<div class="grid grid-cols-2"> 
  <div class="card"> 
    <h2>Total number of reviews</h2> 
    <span class="big">${reviews.length.toLocaleString("en-US")}</span> 
  </div> 
  <div class="card"> 
    <h2>Total number of words in reviews</h2> 
    <span class="big">${getTotalWordCount().toLocaleString("en-US")}</span> 
  </div> 
</div>

<!-- Game selector - currently non-functional -->
<div class="grid grid-cols-1">
  <div class="card">
    <h3>Select a game to analyze reviews:</h3>
    <select style="width: 100%; padding: 8px; margin-top: 8px; border-radius: 4px; border: 1px solid #ccc;">
      <option value="all" selected>All Games</option>
      <option value="elden-ring">Elden Ring</option>
      <option value="cyberpunk">Cyberpunk 2077</option>
      <option value="baldurs-gate">Baldur's Gate 3</option>
      <option value="starfield">Starfield</option>
      <option value="half-life">Half-Life: Alyx</option>
      <option value="minecraft">Minecraft</option>
      <option value="fortnite">Fortnite</option>
      <option value="counter-strike">Counter-Strike 2</option>
      <option value="red-dead">Red Dead Redemption 2</option>
      <option value="witcher">The Witcher 3</option>
    </select>
  </div>
</div>

<!-- Word cloud visualization -->

```js
// Import at the top level
import * as d3Cloud from "d3-cloud";

// Word cloud visualization function
function wordCloudChart(data, {width} = {}) {
  // Set dimensions based on available width
  const height = Math.min(600, width * 0.8);
  
  // Format the data for the word cloud - using proper log scaling for better sizing
  const words = data.slice(0, 40).map(d => ({
    text: d.word,
    size: Math.sqrt(d.count) * 0.9, // Better logarithmic scaling
    count: d.count
  }));
  
  // Create a container element for eventual output
  const container = d3.create("div").node();
  
  // Create the layout directly following the example pattern
  const layout = d3Cloud.default()
    .size([width, height])
    .words(words)
    .padding(1)
    .rotate(() => 0) // Either 0 or 90 degrees
    .font("Arial")
    .fontSize(d => d.size)
    .on("end", draw);
  
  // Create color scale for words
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
  
  // Start the layout calculation
  layout.start();
  
  // Draw function that will be called when layout calculation is complete
  function draw(cloudData) {
    // Create SVG
    const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");
    
    // Add the words
    svg.append("g")
      .attr("transform", `translate(${width/2},${height/2})`)
      .selectAll("text")
      .data(cloudData)
      .join("text")
      .style("font-size", d => `${d.size}px`)
      .style("font-family", "Arial")
      .attr("text-anchor", "middle")
      .attr("transform", d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
      .attr("fill", d => colorScale(d.text))
      .text(d => d.text)
      .append("title")
      .text(d => `${d.text}: ${d.count.toLocaleString()}`);
    
    // Add the SVG to container
    container.innerHTML = '';
    container.appendChild(svg.node());
  }
  
  // Return the container
  return container;
}
```

<div class="grid grid-cols-1"> <div class="card"> <h2>Word cloud visualization</h2> ${resize((width) => wordCloudChart(wordCounts, {width}))} </div> </div>

<!-- Word frequency chart function -->

```js
function wordFrequencyChart(data, {width} = {}) {
  return Plot.plot({
    title: "Most frequent word compounds in Steam game reviews",
    width,
    height: 500,
    marginLeft: 120,
    x: {grid: true, label: "Frequency"},
    y: {label: null},
    marks: [
      Plot.barX(data.slice(0, 30), {
        y: "word",
        x: "count",
        fill: "steelblue",
        sort: {y: "-x"}
      }),
      Plot.ruleX([0])
    ]
  });
}
```

<!-- Responsive chart -->
<div class="grid grid-cols-1"> <div class="card">
${resize((width) => wordFrequencyChart(wordCounts, {width}))}
</div> </div>