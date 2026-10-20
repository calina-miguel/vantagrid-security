import { getStore } from "@netlify/blobs";
import { currentUser } from "../../auth-user";

export const runtime = "nodejs";
const KINDS = new Set(["niches", "suppliers", "contacts", "products", "outreach", "campaigns", "content", "leads", "inbox", "orders", "subscribers", "payments", "channels"]);
type RecordItem = { id: string; kind: string; title: string; country: string | null; stage: string | null; data: Record<string, unknown>; created_at: number; updated_at: number };
const localRecords = new Map<string, RecordItem>();
const isLocal = process.env.NODE_ENV === "development" && process.env.NETLIFY !== "true";
const response = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const key = (owner: string, kind: string, id: string) => `${owner}/${kind}/${id}`;

async function readRecord(owner: string, kind: string, id: string): Promise<RecordItem | null> {
  if (isLocal) return localRecords.get(key(owner, kind, id)) || null;
  return await getStore("seller-records").get(key(owner, kind, id), { type: "json" }) as RecordItem | null;
}
async function writeRecord(owner: string, row: RecordItem) {
  if (isLocal) { localRecords.set(key(owner, row.kind, row.id), row); return; }
  await getStore("seller-records").setJSON(key(owner, row.kind, row.id), row);
}
async function listRecords(owner: string, kind: string): Promise<RecordItem[]> {
  if (isLocal) return [...localRecords.entries()].filter(([recordKey]) => recordKey.startsWith(`${owner}/${kind}/`)).map(([, row]) => row);
  const store = getStore("seller-records");
  const { blobs } = await store.list({ prefix: `${owner}/${kind}/` });
  return (await Promise.all(blobs.slice(0, 1000).map(async (blob) => await store.get(blob.key, { type: "json" }) as RecordItem | null))).filter((row): row is RecordItem => !!row);
}
async function deleteRecord(owner: string, kind: string, id: string) {
  if (isLocal) { localRecords.delete(key(owner, kind, id)); return; }
  await getStore("seller-records").delete(key(owner, kind, id));
}
function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}
function validData(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value) && JSON.stringify(value).length <= 80_000;
}
async function context() {
  const user = await currentUser();
  return user?.id || null;
}

export async function GET(request: Request) {
  const owner = await context();
  if (!owner) return response({ error: "Sign in required" }, 401);
  const kind = new URL(request.url).searchParams.get("kind");
  if (!kind || !KINDS.has(kind)) return response({ error: "Invalid section" }, 400);
  const records = await listRecords(owner, kind);
  records.sort((a, b) => b.updated_at - a.updated_at);
  return response({ records });
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return response({ error: "Invalid origin" }, 403);
  const owner = await context();
  if (!owner) return response({ error: "Sign in required" }, 401);
  if (Number(request.headers.get("content-length") || 0) > 100_000) return response({ error: "Record too large" }, 413);
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return response({ error: "Invalid JSON" }, 400); }
  if (typeof body.kind !== "string" || !KINDS.has(body.kind)) return response({ error: "Invalid section" }, 400);
  if (typeof body.title !== "string" || !body.title.trim() || body.title.length > 200 || !validData(body.data)) return response({ error: "Invalid record" }, 400);
  const now = Date.now();
  const row: RecordItem = { id: crypto.randomUUID(), kind: body.kind, title: body.title.trim(), country: typeof body.country === "string" ? body.country.slice(0, 100) : null, stage: typeof body.stage === "string" ? body.stage.slice(0, 60) : null, data: body.data, created_at: now, updated_at: now };
  await writeRecord(owner, row);
  return response({ id: row.id }, 201);
}
export async function PUT(request: Request) {
  if (!sameOrigin(request)) return response({ error: "Invalid origin" }, 403);
  const owner = await context();
  if (!owner) return response({ error: "Sign in required" }, 401);
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return response({ error: "Invalid JSON" }, 400); }
  if (typeof body.id !== "string" || typeof body.title !== "string" || !body.title.trim() || body.title.length > 200 || !validData(body.data)) return response({ error: "Invalid record" }, 400);
  for (const kind of KINDS) {
    const existing = await readRecord(owner, kind, body.id);
    if (!existing) continue;
    await writeRecord(owner, { ...existing, title: body.title.trim(), country: typeof body.country === "string" ? body.country.slice(0, 100) : null, stage: typeof body.stage === "string" ? body.stage.slice(0, 60) : null, data: body.data, updated_at: Date.now() });
    return response({ updated: true });
  }
  return response({ updated: false }, 404);
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return response({ error: "Invalid origin" }, 403);
  const owner = await context();
  if (!owner) return response({ error: "Sign in required" }, 401);
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return response({ error: "ID required" }, 400);
  for (const kind of KINDS) {
    const existing = await readRecord(owner, kind, id);
    if (!existing) continue;
    await deleteRecord(owner, kind, id);
    return response({ deleted: true });
  }
  return response({ deleted: false }, 404);
}
