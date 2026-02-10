import GroceryItems from "./groceries.ts";
import { NonFoodItems, InglesReceipt, FoodLionReceipt } from "./groceries.ts";
import Fuse from "fuse.js";
// import Fuse from 'https://deno.land/x/fuse@v7.1.0/dist/fuse.min.mjs'

// ingles specific
function check_first_letter(reciept_line: String) {
  const cleaned_line = reciept_line.trim().toLowerCase();
  switch (cleaned_line[0]) {
    case "a":
      return true;
    case "b":
      return false;
    default:
      return false;
  }
}

type Match = {
  match: String;
  confidence: number;
};

function get_potential_term(reciept_line: String) {
  let cleaned_line = reciept_line;

  let re = /\d/gi; // Remove digits
  cleaned_line = reciept_line.replaceAll(re, "");

  re = /\p{P}/gu; // Clean punctuation
  cleaned_line = cleaned_line.replaceAll(re, "");

  re = /(\s|^)\w(\s|$)/gi; // Remove single letter phrases
  cleaned_line = cleaned_line.replaceAll(re, "");

  return cleaned_line.trim().toLocaleLowerCase();
}

function calculate_confidence(score: number | undefined) {
  return 100 - (score ? score : 0) * 100;
}

function fuzzy_match_single_term(itemsList: string[], product_term: string) {
  const options = {
    includeScore: true,
    threshold: 0.8, // how forgiving the match is 0 = strict 1 = most forgiving
    distance: 1, // How far apart the characters are before score is affected.
    ignoreLocation: true, // removes preference for matches near start
    minMatchCharLength: 2,
  };
  const fuse = new Fuse(itemsList, options);
  // Given a term string
  const normalized_term = normalize(product_term.toLocaleLowerCase());
  const searchResult = fuse.search(normalized_term);
  if (searchResult.length === 0) {
    return { match: "", confidence: 0 };
  }
  const confidence = calculate_confidence(searchResult[0].score);
  return { match: searchResult[0].item, confidence: confidence };
}

function fuzzy_match_term_vowels_and_none(items: string[], term: string) {
  if (!term) return { match: "undefined", confidence: 0 };
  if (term && term.length < 3) return { match: "", confidence: 0 };

  const devoweled_items: string[] = items.map((item) => {
    return devowel(item);
  });

  const normal = fuzzy_match_single_term(items, normalize(term));
  const noVowels = fuzzy_match_single_term(
    devoweled_items,
    devowel(normalize(term)),
  );
  return noVowels.confidence > normal.confidence
    ? {
        match: items[devoweled_items.indexOf(noVowels.match)],
        confidence: noVowels.confidence,
      }
    : normal;
}

function devowel(word: string) {
  return word.replace(/[aeiou]/g, "");
}

function normalize(word: string) {
  return word.endsWith("es")
    ? word.slice(0, -2)
    : word.endsWith("s")
      ? word.slice(0, -1)
      : word;
}

function fuzzy_match_product_line(product_term: String, items: string[]) {
  // split the string
  const terms = product_term.split(/\s+/);
  // Start with the confidence of the first term
  let highest_confidence_match = fuzzy_match_term_vowels_and_none(
    items,
    terms[0],
  );
  // iterate and check the rest
  for (let i = 0; i < terms.length; i++) {
    const term_match = fuzzy_match_term_vowels_and_none(items, terms[i]);
    if (term_match.confidence > highest_confidence_match.confidence)
      highest_confidence_match = term_match;
  }
  return highest_confidence_match;
}

function find_grocery_item(reciept_line: String) {
  const potential_term = get_potential_term(reciept_line);
  const non_food_match = fuzzy_match_product_line(potential_term, NonFoodItems);
  const match = fuzzy_match_product_line(potential_term, GroceryItems);
  return { non_food_match: non_food_match, food_match: match };
}

function determine_if_food(non_food_match: Match, food_match: Match) {
  console.log(
    "non: " + non_food_match.confidence + "\t food: " + food_match.confidence,
  );
  console.log("non: " + non_food_match.match + "\t food: " + food_match.match);
  return non_food_match.confidence <= food_match.confidence;
}

function process_text(reciept_line: String) {
  const { non_food_match, food_match } = find_grocery_item(reciept_line);
  if (determine_if_food(non_food_match, food_match)) {
    console.log(
      "Your item has matched with: " +
        food_match.match +
        " with " +
        food_match.confidence.toFixed(2) +
        "% condidence",
    );
  } else {
    console.log(
      "This is not a food item (matched with " +
        non_food_match.match +
        "), confidence " +
        non_food_match.confidence.toFixed(2) +
        "%",
    );
  }
}

// 80% = high confidence

// for (const test_string of InglesReceipt) {
for (const test_string of FoodLionReceipt) {
  console.log(test_string);

  process_text(test_string);
  console.log("\n");
}
