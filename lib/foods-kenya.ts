/**
 * Kenyan & East African local foods database.
 * Per-100g values compiled from USDA FDC entries for traditional preparations
 * plus regional composition tables (Kenya FCT, Tanzania FCT).
 * Offline-first: search needs no network and no API keys.
 */
import type { FoodSearchResult } from "./types";

interface LocalFood {
  name: string;
  aka: string[];
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  servingGrams: number;
}

/** Flat, simple rows to keep the table easy to audit and extend. */
const KENYA_FOODS: LocalFood[] = [
  // Staples
  { name: "Ugali (maize, stiff porridge)", aka: ["sima", "posho", "kaunga", "ugali"], kcal: 118, protein: 2.6, carbs: 25, fat: 0.7, servingGrams: 250 },
  { name: "Ugali brown (whole maize + sorghum/millet)", aka: ["brown", "wimbi"], kcal: 112, protein: 3.4, carbs: 23, fat: 1, servingGrams: 250 },
  { name: "Chapati", aka: ["chapo"], kcal: 290, protein: 8, carbs: 46, fat: 8, servingGrams: 80 },
  { name: "Pilau (spiced rice)", aka: ["pilau"], kcal: 155, protein: 3.2, carbs: 30, fat: 2.6, servingGrams: 200 },
  { name: "Coconut rice (wali wa nazi)", aka: ["wali", "nazi"], kcal: 166, protein: 3, carbs: 28, fat: 4.5, servingGrams: 200 },
  { name: "Mukimo (mashed potatoes, maize, greens)", aka: ["irio", "mukimo"], kcal: 120, protein: 3, carbs: 22, fat: 2.4, servingGrams: 250 },
  { name: "Githeri (maize and beans)", aka: ["githeri"], kcal: 120, protein: 4.8, carbs: 21, fat: 1, servingGrams: 300 },
  { name: "Matoke (green bananas, cooked)", aka: ["matoke"], kcal: 108, protein: 1.3, carbs: 26, fat: 0.4, servingGrams: 200 },
  { name: "Sweet potatoes, boiled", aka: ["viazi", "vitamu"], kcal: 86, protein: 1.6, carbs: 20, fat: 0.1, servingGrams: 150 },
  { name: "Irish potatoes, boiled", aka: ["viazi", "waru"], kcal: 87, protein: 2, carbs: 20, fat: 0.1, servingGrams: 150 },
  { name: "Wimbi porridge (finger millet)", aka: ["uji", "wimbi", "millet"], kcal: 55, protein: 1.8, carbs: 11, fat: 1, servingGrams: 250 },
  { name: "Uji (thin porridge, unsweetened)", aka: ["uji"], kcal: 45, protein: 1.5, carbs: 9, fat: 0.8, servingGrams: 300 },
  { name: "Bread, white loaf", aka: ["bread", "mkate"], kcal: 265, protein: 9, carbs: 49, fat: 3.2, servingGrams: 56 },
  { name: "Mandazi", aka: ["maandazi", "half", "cakes"], kcal: 380, protein: 6, carbs: 50, fat: 17, servingGrams: 60 },
  { name: "Mahamri (coconut mandazi)", aka: ["mahamri"], kcal: 400, protein: 6, carbs: 46, fat: 21, servingGrams: 60 },
  { name: "Samosa, beef", aka: ["samosa", "sambusa"], kcal: 300, protein: 9, carbs: 27, fat: 17, servingGrams: 80 },
  { name: "Maize on the cob, boiled", aka: ["mahindi", "corn", "cob"], kcal: 96, protein: 3.3, carbs: 21, fat: 1.3, servingGrams: 90 },
  { name: "Roasted maize", aka: ["roasted", "maize"], kcal: 106, protein: 3.4, carbs: 23, fat: 1.4, servingGrams: 90 },
  // Proteins
  { name: "Nyama Choma (goat, roasted, lean)", aka: ["choma", "goat"], kcal: 196, protein: 27, carbs: 0, fat: 9, servingGrams: 200 },
  { name: "Nyama Choma (beef, roasted, lean)", aka: ["choma", "beef"], kcal: 232, protein: 27, carbs: 0, fat: 13, servingGrams: 200 },
  { name: "Nyama Choma (beef, with fat)", aka: ["choma", "fatty"], kcal: 290, protein: 25, carbs: 0, fat: 21, servingGrams: 200 },
  { name: "Tumbukiza (beef stew, broth-based)", aka: ["tumbukiza"], kcal: 115, protein: 11, carbs: 3, fat: 6, servingGrams: 300 },
  { name: "Chicken stew (kuku)", aka: ["kuku", "chicken", "stew"], kcal: 190, protein: 24, carbs: 2, fat: 9, servingGrams: 150 },
  { name: "Tilapia, fried", aka: ["tilapia", "fried"], kcal: 220, protein: 22, carbs: 6, fat: 12, servingGrams: 150 },
  { name: "Tilapia, grilled", aka: ["tilapia", "grilled", "choma"], kcal: 128, protein: 26, carbs: 0, fat: 1.7, servingGrams: 150 },
  { name: "Omena (dried sardines)", aka: ["omena", "dagaa", "sardines"], kcal: 330, protein: 45, carbs: 0, fat: 15, servingGrams: 30 },
  { name: "Beef, stewed lean", aka: ["beef", "stew"], kcal: 190, protein: 27, carbs: 0, fat: 8, servingGrams: 150 },
  { name: "Beef, fried", aka: ["beef", "fried"], kcal: 260, protein: 26, carbs: 1, fat: 16, servingGrams: 150 },
  { name: "Eggs, boiled", aka: ["mayai", "egg", "eggs"], kcal: 155, protein: 13, carbs: 1.1, fat: 11, servingGrams: 50 },
  { name: "Beans, boiled", aka: ["maharagwe", "beans"], kcal: 127, protein: 8.7, carbs: 22.8, fat: 0.5, servingGrams: 200 },
  { name: "Cowpeas, boiled", aka: ["kunde", "cowpeas"], kcal: 116, protein: 7.7, carbs: 20.7, fat: 0.5, servingGrams: 200 },
  { name: "Green grams, boiled", aka: ["ndengu"], kcal: 105, protein: 7.6, carbs: 19, fat: 0.4, servingGrams: 200 },
  { name: "Pigeon peas, boiled", aka: ["mbaazi"], kcal: 121, protein: 7.4, carbs: 22, fat: 0.4, servingGrams: 200 },
  { name: "Groundnuts, roasted", aka: ["njugu", "karanga", "peanuts"], kcal: 587, protein: 24, carbs: 21, fat: 50, servingGrams: 30 },
  // Vegetables
  { name: "Sukuma Wiki, sauteed", aka: ["sukuma", "collards"], kcal: 65, protein: 3, carbs: 6, fat: 4, servingGrams: 150 },
  { name: "Sukuma Wiki, steamed", aka: ["sukuma", "steamed"], kcal: 37, protein: 3, carbs: 6, fat: 0.8, servingGrams: 150 },
  { name: "Sukuma Wiki, fried with oil", aka: ["sukuma", "fried"], kcal: 110, protein: 3, carbs: 7, fat: 8, servingGrams: 150 },
  { name: "Cabbage, fried", aka: ["cabbage"], kcal: 60, protein: 1.5, carbs: 6, fat: 3.5, servingGrams: 150 },
  { name: "Managu (African nightshade)", aka: ["managu", "nightshade"], kcal: 40, protein: 3.2, carbs: 5, fat: 0.9, servingGrams: 150 },
  { name: "Terere (amaranth greens)", aka: ["terere", "amaranth"], kcal: 42, protein: 3.4, carbs: 5, fat: 0.8, servingGrams: 150 },
  { name: "Kienyeji greens mix", aka: ["kienyeji", "greens"], kcal: 45, protein: 3, carbs: 5.5, fat: 1, servingGrams: 150 },
  // Fruits
  { name: "Mango", aka: ["mango", "embe"], kcal: 60, protein: 0.8, carbs: 15, fat: 0.4, servingGrams: 200 },
  { name: "Banana, ripe", aka: ["banana", "ndizi"], kcal: 89, protein: 1.1, carbs: 23, fat: 0.3, servingGrams: 118 },
  { name: "Avocado (Kenyan Fuerte)", aka: ["avocado"], kcal: 160, protein: 2, carbs: 8.5, fat: 15, servingGrams: 150 },
  { name: "Pawpaw (papaya)", aka: ["pawpaw", "papaya"], kcal: 43, protein: 0.5, carbs: 11, fat: 0.3, servingGrams: 140 },
  { name: "Pineapple", aka: ["pineapple"], kcal: 50, protein: 0.4, carbs: 13, fat: 0.2, servingGrams: 165 },
  { name: "Passion fruit", aka: ["passion"], kcal: 97, protein: 2.2, carbs: 23, fat: 0.7, servingGrams: 100 },
  { name: "Watermelon", aka: ["watermelon"], kcal: 30, protein: 0.6, carbs: 7.6, fat: 0.2, servingGrams: 200 },
  { name: "Baobab fruit powder", aka: ["mbuyu", "baobab"], kcal: 250, protein: 4.4, carbs: 68, fat: 0.5, servingGrams: 10 },
  { name: "Tamarind", aka: ["ukwaju", "tamarind"], kcal: 239, protein: 2.8, carbs: 57, fat: 0.6, servingGrams: 15 },
  { name: "Coconut, fresh meat", aka: ["coconut", "nazi"], kcal: 354, protein: 3.3, carbs: 15, fat: 33, servingGrams: 80 },
  // Drinks & extras
  { name: "Chai with whole milk & sugar", aka: ["chai", "tea"], kcal: 45, protein: 1.6, carbs: 6.5, fat: 1.6, servingGrams: 200 },
  { name: "Chai with whole milk, no sugar", aka: ["chai", "sugar"], kcal: 25, protein: 1.6, carbs: 2, fat: 1.6, servingGrams: 200 },
  { name: "Chai, black, no sugar", aka: ["chai", "black"], kcal: 2, protein: 0.1, carbs: 0.4, fat: 0, servingGrams: 200 },
  { name: "Sugarcane juice", aka: ["sugarcane", "juice"], kcal: 75, protein: 0.2, carbs: 18, fat: 0.1, servingGrams: 300 },
  { name: "Soda, regular", aka: ["soda", "coke", "fanta"], kcal: 42, protein: 0, carbs: 10.6, fat: 0, servingGrams: 300 },
  { name: "Cooking oil, added", aka: ["oil", "cooking", "fat"], kcal: 884, protein: 0, carbs: 0, fat: 100, servingGrams: 14 },
];

function toResult(food: LocalFood): FoodSearchResult {
  return {
    name: food.name,
    brand: "Local (Kenya)",
    per100g: { kcal: food.kcal, protein: food.protein, carbs: food.carbs, fat: food.fat },
    servingGrams: food.servingGrams,
    source: "local",
  };
}

/**
 * Word-boundary search over names and alternate (Swahili/sheng) names.
 * Exact word match scores highest, then word-prefix.
 */
export function searchKenyaFoods(query: string, limit = 12): FoodSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);

  const scored = KENYA_FOODS.map((food) => {
    const words = (food.name + " " + food.aka.join(" "))
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter(Boolean);
    let score = 0;
    for (const t of terms) {
      if (words.some((w) => w === t)) score += 4;
      else if (words.some((w) => w.startsWith(t))) score += 2;
    }
    return { food, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((s) => toResult(s.food));
}

/** Nearest single match, used to resolve vision-identified ingredients. */
export function findKenyaFoodByName(name: string): FoodSearchResult | null {
  const norm = name.toLowerCase().replace(/[^a-z\s]/g, "").trim();
  if (!norm) return null;
  const results = searchKenyaFoods(norm, 1);
  return results[0] ?? null;
}

export function getKenyaFoodCount(): number {
  return KENYA_FOODS.length;
}
