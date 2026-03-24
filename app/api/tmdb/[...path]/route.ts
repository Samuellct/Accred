import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TMDB_API_KEY non configuree" }, { status: 503 });
  }

  const { path } = await params;
  const searchParams = req.nextUrl.searchParams;

  // forward tous les params client en ajoutant la cle API cote serveur
  const forwardedParams = new URLSearchParams(searchParams.toString());
  forwardedParams.set("api_key", apiKey);

  const tmdbUrl = `${TMDB_BASE}/${path.join("/")}?${forwardedParams}`;

  let res: Response;
  try {
    res = await fetch(tmdbUrl, { headers: { Accept: "application/json" } });
  } catch {
    return NextResponse.json({ error: "Impossible de joindre TMDb" }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json(data, { status: res.ok ? 200 : res.status });
}
