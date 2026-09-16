import { NextResponse } from "next/server";
import { ensureDemoProfile, getProfile, saveProfile } from "@/lib/repo-profile";
import { computeMacroTargets } from "@/lib/metabolic";
import { ProfileSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const profile = ensureDemoProfile();
    return NextResponse.json({ profile, targets: computeMacroTargets(profile) });
  } catch (err) {
    console.error("[api/profile] GET failed:", err);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid profile", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = getProfile("demo");
    const profile = saveProfile({
      ...parsed.data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ profile, targets: computeMacroTargets(profile) });
  } catch (err) {
    console.error("[api/profile] POST failed:", err);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
