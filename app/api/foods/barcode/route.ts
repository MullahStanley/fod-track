import { NextResponse } from "next/server";
import { lookupBarcode } from "@/lib/provider-off";
import { barcodeToFoodItem } from "@/lib/resolve";
import { BarcodeRequestSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

/**
 * GET /api/foods/barcode?code=0123456789012&multiplier=1
 * Open Food Facts lookup (no key required).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code") ?? "";
  const multiplier = Number(searchParams.get("multiplier")) || 1;

  if (!/^\d{6,14}$/.test(code)) {
    return NextResponse.json({ error: "Invalid barcode" }, { status: 400 });
  }

  try {
    const result = await lookupBarcode(code);
    if (!result.ok) {
      const status =
        result.reason === "network_error" ? 502 : result.reason === "not_found" ? 404 : 422;
      return NextResponse.json(
        { error: `Barcode lookup failed: ${result.reason}`, reason: result.reason },
        { status }
      );
    }
    return NextResponse.json({ product: result.product });
  } catch (err) {
    console.error("[api/foods/barcode] GET failed:", err);
    return NextResponse.json(
      { error: "Barcode lookup failed", reason: "network_error" },
      { status: 502 }
    );
  }
}

/**
 * POST /api/foods/barcode
 * Convert a product + chosen serving multiplier into an editable FoodItem.
 * Body: { code, multiplier }
 */
export async function POST(req: Request) {
  let parsed;
  try {
    parsed = BarcodeRequestSchema.safeParse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await lookupBarcode(parsed.data.code);
  if (!result.ok || !result.product) {
    const status =
      result.reason === "network_error" ? 502 : result.reason === "not_found" ? 404 : 422;
    return NextResponse.json(
      { error: `Barcode lookup failed: ${result.reason}`, reason: result.reason },
      { status }
    );
  }

  const item = barcodeToFoodItem(result.product, parsed.data.multiplier);
  return NextResponse.json({ item });
}
