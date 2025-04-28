import {csv} from "d3-fetch";

// Load reviews from external location
export async function loadReviews() {
  try {
    // Path to reach data from datavis-project/src/data to project-dv25-9/data
    const reviews = await csv("../../../data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/steam/reviews.csv");
    console.log(`Loaded ${reviews.length} reviews`);
    return reviews;
  } catch (error) {
    console.error("Error loading reviews:", error);
    return [];
  }
}