import { NextResponse } from "next/server";
import { addMeal, deleteMeal, getDayLog, getRecentDays } from "@/lib/repo-logs";
import { LogMealSchema } from "@/lib/validators";
import { MEAL_TYPES } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/logs?date=YYYY-MM-DD  → single day
 * GET /api/logs?days=14          → recent days (history)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const daysParam = searchParams.get("days");
  const date = searchParams.get("date") ?? todayLocal();

  try {
    if (daysParam) {
      const days = Math.min(90, Math.max(1, Number(daysParam) || 30));
      return NextResponse.json({ days: getRecentDays("demo", days) });
    }
    return NextResponse.json({ meals: getDayLog("demo", date) });
  } catch (err) {
    console.error("[api/logs] GET failed:", err);
    return NextResponse.json({ error: "Failed to load logs" }, { status: 500 });
  }
}

/**
 * POST /api/logs — save a reviewed meal.
 */
export async function POST(req: Request) {
  let parsed;
  try {
    parsed = LogMealSchema.safeParse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid meal", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (!MEAL_TYPES.includes(parsed.data.mealType)) {
    return NextResponse.json({ error: "Invalid meal type" }, { status: 400 });
  }

  try {
    const meal = addMeal({
      ...parsed.data,
      items: parsed.data.items.map((i) => ({
        ...i,
        id: i.id ?? "",
        servingGrams: i.servingGrams ?? null,
      })),
    });
    return NextResponse.json({ meal }, { status: 201 });
  } catch (err) {
    console.error("[api/logs] POST failed:", err);
    return NextResponse.json({ error: "Failed to save meal" }, { status: 500 });
  }
}

/** DELETE /api/logs?id=<mealId> */
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing meal id" }, { status: 400 });
  }
  try {
    const ok = deleteMeal(id);
    return NextResponse.json({ deleted: ok });
  } catch (err) {
    console.error("[api/logs] DELETE failed:", err);
    return NextResponse.json({ error: "Failed to delete meal" }, { status: 500 });
  }
}

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
