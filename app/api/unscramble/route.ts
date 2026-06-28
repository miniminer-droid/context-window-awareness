import { NextRequest, NextResponse } from "next/server";
import { unscramble } from "@/lib/unscramble";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const letters = (sp.get("letters") ?? "").slice(0, 15);

  if (!letters.replace(/[^a-z?*]/gi, "")) {
    return NextResponse.json(
      { error: "Provide 1–15 letters (use ? or * for blank tiles)." },
      { status: 400 },
    );
  }

  const num = (k: string) => {
    const v = sp.get(k);
    if (v == null || v === "") return undefined;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : undefined;
  };

  const data = await unscramble({
    letters,
    startsWith: sp.get("startsWith") ?? undefined,
    endsWith: sp.get("endsWith") ?? undefined,
    contains: sp.get("contains") ?? undefined,
    minLength: num("minLength"),
    maxLength: num("maxLength"),
    useAllLetters: sp.get("useAllLetters") === "1",
    limit: 500,
  });

  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
  });
}
