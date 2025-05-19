//import {csv} from "d3-fetch";
//
//// Load reviews from external location
//export async function loadReviews() {
//  try {
//    // Path to reach data from datavis-project/src/data to project-dv25-9/data
//    const reviews = await csv("../../../data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/steam/reviews.csv");
//    return reviews;
//  } catch (error) {
//    console.error("Error loading reviews:", error);
//    return [];
//  }
//}


import { csv } from "d3-fetch";

const csvParts = [
  "../../../data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/steam/reviews_part_1.csv",
  "../../../data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/steam/reviews_part_2.csv",
  "../../../data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/steam/reviews_part_3.csv",
  "../../../data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/steam/reviews_part_4.csv",
  "../../../data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/steam/reviews_part_5.csv",
  "../../../data/datasets/artyomkruglov/gaming-profiles-2025-steam-playstation-xbox/versions/1/steam/reviews_part_6.csv",
];

export async function loadReviews() {
  try {
    const allParts = await Promise.all(csvParts.map(path => csv(path)));
    const combined = allParts.flat(); // Flatten arrays into one
    return combined;
  } catch (error) {
    console.error("Error loading review chunks:", error);
    return [];
  }
}
