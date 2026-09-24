import { NextResponse } from "next/server";
import { searchFoods, searchResultToFoodItem, resolveItemWithAi } from "@/lib/resolve";
import { hasAiFoodSearch } from "@/lib/ai-food-search";
import { hasUsdaKey } from "@/lib/provider-usda";

export const dynamic = "force-dynamic";

/**
 * GET /api/foods/search?q=mursik&online=1&ai=auto
 *
 * Multi-tier intelligent food search:
 * 1. Kenyan Local Database (always offline)
 * 2. Core Seed Foods (always offline)
 * 3. Online Search: USDA FoodData Central (verified nutrition) + Open Food Facts
 * 4. AI Local Language Assistant: Translates Swahili/Sheng/dialects & calculates
 *    scientifically grounded nutrition when static databases lack values.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const limit = Math.min(30, Math.max(1, Number(searchParams.get("limit")) || 15));
  const onlineParam = searchParams.get("online");
  const aiParam = searchParams.get("ai");

  const includeOnline = onlineParam !== "0" && onlineParam !== "false";
  const aiOnly = aiParam === "1" || aiParam === "true";
  const useAiFallback = aiParam !== "0" && aiParam !== "false";

  const aiAvailable = hasAiFoodSearch();
  const onlineAvailable = hasUsdaKey();

  if (!q.trim()) {
    return NextResponse.json({
      results: [],
      total: 0,
      aiAvailable,
      onlineAvailable,
    });
  }

  try {
    const results = await searchFoods(q, {
      limit,
      includeOnline,
      useAiFallback,
      aiOnly,
    });

    const sources = {
      local: results.filter((r) => r.source === "local").length,
      seed: results.filter((r) => r.source === "seed").length,
      usda: results.filter((r) => r.source === "usda").length,
      openfoodfacts: results.filter((r) => r.source === "openfoodfacts").length,
      ai: results.filter((r) => r.source === "ai").length,
    };

    return NextResponse.json({
      results,
      total: results.length,
      sources,
      aiAvailable,
      onlineAvailable,
    });
  } catch (err) {
    console.error("[api/foods/search] failed:", err);
    return NextResponse.json(
      {
        results: [],
        total: 0,
        aiAvailable,
        onlineAvailable,
        error: "Search failed",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/foods/search
 * 1. Convert a chosen search result into an editable FoodItem:
 *    Body: { result: FoodSearchResult, grams?: number }
 * 2. Or resolve an unlisted/local item via AI:
 *    Body: { action: "resolve_ai", name: string, grams?: number }
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      action?: string;
      name?: string;
      result?: unknown;
      grams?: number;
    };

    // AI on-demand resolution for an unlisted or local-language item
    if (body.action === "resolve_ai" && typeof body.name === "string" && body.name.trim()) {
      const grams = typeof body.grams === "number" ? body.grams : 100;
      const item = await resolveItemWithAi(body.name.trim(), grams);
      return NextResponse.json({ item });
    }

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
    return NextResponse.json({ error: "Failed to process item" }, { status: 500 });
  }
}
