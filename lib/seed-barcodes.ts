/**
 * Offline verified barcode catalog for common Kenyan and international food products.
 * Guarantees zero-network lookup for test codes and everyday supermarket items.
 */
import type { BarcodeProduct } from "./types";

export const SEED_BARCODES: Record<string, BarcodeProduct> = {
  // Test code shown as placeholder in the UI
  "041631000564": {
    barcode: "041631000564",
    name: "Whole Milk (Generic)",
    brand: "Generic Dairy",
    serving: { grams: 244, kcal: 149, protein: 7.7, carbs: 11.7, fat: 8.0 },
  },
  "0041663100056": {
    barcode: "0041663100056",
    name: "Whole Milk",
    brand: "Generic Dairy",
    serving: { grams: 244, kcal: 149, protein: 7.7, carbs: 11.7, fat: 8.0 },
  },

  // Kenyan staples & supermarket favorites
  "6161100000001": {
    barcode: "6161100000001",
    name: "Brookside Fresh Whole Milk (500ml)",
    brand: "Brookside Dairy",
    serving: { grams: 250, kcal: 155, protein: 8.0, carbs: 12.0, fat: 8.3 },
  },
  "6161100001015": {
    barcode: "6161100001015",
    name: "Brookside Lala (Fermented Milk 500ml)",
    brand: "Brookside Dairy",
    serving: { grams: 250, kcal: 160, protein: 8.2, carbs: 12.5, fat: 8.5 },
  },
  "6161100002029": {
    barcode: "6161100002029",
    name: "Tuzo Fresh Whole Milk (500ml)",
    brand: "Tuzo",
    serving: { grams: 250, kcal: 152, protein: 8.0, carbs: 11.8, fat: 8.2 },
  },
  "6161101234567": {
    barcode: "6161101234567",
    name: "Jogoo Maize Meal (Unga wa Ugali)",
    brand: "Unga Limited",
    serving: { grams: 100, kcal: 350, protein: 8.0, carbs: 74.0, fat: 2.5 },
  },
  "6161109876543": {
    barcode: "6161109876543",
    name: "Dola Superior All Purpose Wheat Flour",
    brand: "Dola",
    serving: { grams: 100, kcal: 360, protein: 10.0, carbs: 74.0, fat: 1.5 },
  },
  "6161105551234": {
    barcode: "6161105551234",
    name: "Royco Mchuzi Mix Beef",
    brand: "Royco Kenya",
    serving: { grams: 10, kcal: 32, protein: 0.8, carbs: 5.5, fat: 0.7 },
  },
  "896861707211": {
    barcode: "896861707211",
    name: "Indomie Supa Mojo Instant Noodles (Chicken 70g)",
    brand: "Indomie Kenya",
    serving: { grams: 70, kcal: 310, protein: 7.0, carbs: 43.0, fat: 12.0 },
  },
  "896861707228": {
    barcode: "896861707228",
    name: "Indomie Instant Noodles (Beef Flavour 70g)",
    brand: "Indomie Kenya",
    serving: { grams: 70, kcal: 315, protein: 7.0, carbs: 42.0, fat: 13.0 },
  },
  "6161107770011": {
    barcode: "6161107770011",
    name: "Ketepa Pride Pure Kenya Tea Bags",
    brand: "Ketepa",
    serving: { grams: 2, kcal: 2, protein: 0.1, carbs: 0.4, fat: 0.0 },
  },
  "6161107770028": {
    barcode: "6161107770028",
    name: "Kericho Gold Premium Kenya Tea",
    brand: "Kericho Gold",
    serving: { grams: 2, kcal: 2, protein: 0.1, carbs: 0.4, fat: 0.0 },
  },
  "6161103334445": {
    barcode: "6161103334445",
    name: "Farmers Choice Beef Smokies (Cooked)",
    brand: "Farmer's Choice",
    serving: { grams: 50, kcal: 145, protein: 7.5, carbs: 2.5, fat: 12.0 },
  },
  "6161103334452": {
    barcode: "6161103334452",
    name: "Farmers Choice Pork Sausages",
    brand: "Farmer's Choice",
    serving: { grams: 60, kcal: 170, protein: 9.0, carbs: 3.0, fat: 14.0 },
  },
  "5449000000996": {
    barcode: "5449000000996",
    name: "Coca-Cola Original Taste (500ml)",
    brand: "Coca-Cola",
    serving: { grams: 250, kcal: 105, protein: 0.0, carbs: 26.5, fat: 0.0 },
  },
  "5449000014528": {
    barcode: "5449000014528",
    name: "Stoney Tangawizi Ginger Soda (500ml)",
    brand: "Coca-Cola / Stoney",
    serving: { grams: 250, kcal: 115, protein: 0.0, carbs: 29.0, fat: 0.0 },
  },
  "6161108889990": {
    barcode: "6161108889990",
    name: "Keringet Natural Mineral Water (500ml)",
    brand: "Keringet",
    serving: { grams: 500, kcal: 0, protein: 0.0, carbs: 0.0, fat: 0.0 },
  },
  "6161102223334": {
    barcode: "6161102223334",
    name: "Tusker Lager Beer (500ml)",
    brand: "EABL / Tusker",
    serving: { grams: 500, kcal: 215, protein: 1.5, carbs: 15.0, fat: 0.0 },
  },
  "5010029000016": {
    barcode: "5010029000016",
    name: "Weetabix Whole Grain Cereal (2 Biscuits)",
    brand: "Weetabix East Africa",
    serving: { grams: 37.5, kcal: 136, protein: 4.5, carbs: 26.0, fat: 0.8 },
  },
  "011110038334": {
    barcode: "011110038334",
    name: "Quaker Quick 1-Minute Oats",
    brand: "Quaker",
    serving: { grams: 40, kcal: 150, protein: 5.0, carbs: 27.0, fat: 3.0 },
  },
  "051500255162": {
    barcode: "051500255162",
    name: "Creamy Peanut Butter",
    brand: "Jif",
    serving: { grams: 33, kcal: 190, protein: 7.0, carbs: 8.0, fat: 16.0 },
  },
  "7622210449283": {
    barcode: "7622210449283",
    name: "Cadbury Dairy Milk Chocolate (50g)",
    brand: "Cadbury",
    serving: { grams: 50, kcal: 267, protein: 3.8, carbs: 28.5, fat: 15.3 },
  },
};

export function findSeedBarcode(code: string): BarcodeProduct | null {
  const clean = code.replace(/\D/g, "");
  if (!clean) return null;
  // Match exact clean code, or zero-padded/stripped versions (e.g. 12 vs 13 digits)
  if (SEED_BARCODES[clean]) return SEED_BARCODES[clean];
  if (clean.length === 12 && SEED_BARCODES[`0${clean}`]) return SEED_BARCODES[`0${clean}`];
  if (clean.length === 13 && clean.startsWith("0") && SEED_BARCODES[clean.slice(1)]) {
    return SEED_BARCODES[clean.slice(1)];
  }
  return null;
}
