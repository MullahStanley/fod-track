import { NextResponse } from "next/server";
import { searchFoods } from "@/lib/resolve";
import { searchResultToFoodItem } from "@/lib/resolve";

export const dynamic = "force-dynamic";

/**
 * GET /api/foods/search?q=chicken
 * Merged USDA (if keyed) + local seed database, deduped.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const limit = Math.min(25, Math.max(1, Number(searchParams.get("limit")) || 12));

  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchFoods(q, limit);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("[api/foods/search] failed:", err);
    return NextResponse.json({ results: [], error: "Search failed" }, { status: 500 });
  }
}

/**
 * POST /api/foods/search
 * Convert a chosen search result into an editable FoodItem.
 * Body: { result: FoodSearchResult, grams?: number }
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      result?: unknown;
      grams?: number;
    };
    if (
      !body.result ||
      typeof body.result !== "object" ||
      !("name" in body.result) ||
      !("per100g" in body.result)
    ) {
      return NextResponse.json({ error: "Missing result" }, { status: 400 });
    }
    const item = searchResultToFoodItem(
      body.result as Parameters<typeof searchResultToFoodItem>[0],
      typeof body.grams === "number" ? body.grams : undefined
    );
    return NextResponse.json({ item });
  } catch (err) {
    console.error("[api/foods/search] POST failed:", err);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
