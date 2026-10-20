import { currentUser } from "../../auth-user";

export const runtime = "nodejs";

type Result = { title: string; url: string; snippet: string; domain: string };

function decodeHtml(input: string) {
  return input.replace(/<[^>]*>/g, " ").replace(/&(#x[0-9a-f]+|#[0-9]+|amp|quot|apos|lt|gt|nbsp);/gi, (match, entity: string) => {
    const values: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
    if (entity.startsWith("#x")) return String.fromCodePoint(parseInt(entity.slice(2), 16));
    if (entity.startsWith("#")) return String.fromCodePoint(parseInt(entity.slice(1), 10));
    return values[entity.toLowerCase()] || match;
  }).replace(/\s+/g, " ").trim();
}

function resultUrl(raw: string) {
  try {
    const link = new URL(decodeHtml(raw), "https://duckduckgo.com");
    const destination = link.hostname.endsWith("duckduckgo.com") ? link.searchParams.get("uddg") : link.href;
    if (!destination) return null;
    const url = new URL(destination);
    return ["http:", "https:"].includes(url.protocol) ? url : null;
  } catch { return null; }
}

function parseResults(html: string): Result[] {
  const blocks = html.split(/<div class="result results_links[^\"]*">/).slice(1);
  const results: Result[] = [];
  const seen = new Set<string>();
  for (const block of blocks) {
    const anchor = block.match(/<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    if (!anchor) continue;
    const url = resultUrl(anchor[1]);
    if (!url || seen.has(url.href)) continue;
    const snippet = block.match(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/)?.[1] || "";
    const title = decodeHtml(anchor[2]).slice(0, 180);
    const summary = decodeHtml(snippet).slice(0, 300);
    if (!/(consign|wholesale|supplier|inventory|sourc|dropship|retail)/i.test(`${title} ${summary}`)) continue;
    seen.add(url.href);
    results.push({ title, url: url.href, snippet: summary, domain: url.hostname.replace(/^www\./, "") });
    if (results.length >= 10) break;
  }
  return results;
}

export async function GET(request: Request) {
  if (!(await currentUser())) return Response.json({ error: "Sign in required" }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const niche = (params.get("niche") || "").trim();
  const country = (params.get("country") || "Global").trim();
  if (niche.length > 80 || country.length > 60) return Response.json({ error: "Search is too long" }, { status: 400 });
  const query = [niche, country === "Global" ? "" : country, "consignment wholesale suppliers inventory"].filter(Boolean).join(" ");
  const url = new URL("https://html.duckduckgo.com/html/");
  url.searchParams.set("q", query);
  try {
    const response = await fetch(url, { headers: { "User-Agent": "EshmeCommerceResearch/1.0" }, signal: AbortSignal.timeout(9000), cache: "no-store" });
    if (!response.ok) throw new Error("Search provider unavailable");
    const html = (await response.text()).slice(0, 300_000);
    return Response.json({ query, checkedAt: new Date().toISOString(), results: parseResults(html), note: "Search previews only. Consignment, costs, minimums and returns are not verified." }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "The public search source is unavailable right now. Try again later or add a sourced link manually." }, { status: 503 });
  }
}
