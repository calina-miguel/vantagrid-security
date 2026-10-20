"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./starter.css";
import "./scan.css";
import "./workspace-nav.css";
import "./workspace-scenes.css";
import { updateUser } from "@netlify/identity";
import Link from "next/link";

type Field = { key: string; label: string; type?: "text" | "number" | "url" | "date" | "select" | "textarea" | "email"; options?: string[]; required?: boolean };
type Section = { label: string; singular: string; intro: string; title: string; fields: Field[]; stages?: string[] };
type RecordItem = { id: string; kind: string; title: string; country: string | null; stage: string | null; data: Record<string, string>; created_at: number; updated_at: number };
type ScanResult = { title: string; url: string; snippet: string; domain: string };
const term = ["unknown", "inferred", "confirmed"];
const countries = ["Global", "United States", "Philippines", "United Kingdom", "Canada", "Australia", "Singapore", "India", "Germany", "United Arab Emirates", "Other"];
const nicheStarters = [
  { title: "Pet care accessories", category: "Pet supplies" },
  { title: "Home organization", category: "Home and living" },
  { title: "Reusable travel essentials", category: "Travel accessories" },
  { title: "Desk setup accessories", category: "Office accessories" },
];
const today = () => new Date().toLocaleDateString("en-CA");
const sections: Record<string, Section> = {
  niches: { label: "Niche research", singular: "niche", intro: "Collect demand, competition, margin and risk signals. Treat profitability as unverified until a dated source supports it.", title: "Niche", stages: ["idea", "researching", "validated", "active", "rejected"], fields: [
    { key: "category", label: "Category" }, { key: "demand", label: "Demand signal", type: "textarea" }, { key: "competition", label: "Competition signal", type: "textarea" }, { key: "margin", label: "Estimated margin and method", type: "textarea" }, { key: "risk", label: "Risks", type: "textarea" }, { key: "source", label: "Evidence URL", type: "url" }, { key: "checked", label: "Checked on", type: "date" }, { key: "notes", label: "Notes", type: "textarea" }] },
  suppliers: { label: "Suppliers", singular: "supplier", intro: "Verify consignment terms first. Compare commitments only from dated source material or direct supplier replies.", title: "Supplier", stages: ["prospect", "researching", "contacted", "negotiating", "approved", "rejected"], fields: [
    { key: "website", label: "Website", type: "url" }, { key: "niche", label: "Niche" }, { key: "consignment", label: "Consignment", type: "select", options: ["unknown", "yes", "no"] }, { key: "verification", label: "Term verification", type: "select", options: term }, { key: "moq", label: "Minimum order units", type: "number" }, { key: "deposit", label: "Deposit", type: "number" }, { key: "monthly_fee", label: "Monthly fee", type: "number" }, { key: "inventory_owner", label: "Inventory owner", type: "select", options: ["unknown", "supplier", "seller"] }, { key: "returns", label: "Unsold returns", type: "select", options: ["unknown", "allowed", "not allowed"] }, { key: "fulfillment", label: "Fulfillment", type: "select", options: ["unknown", "supplier", "seller"] }, { key: "source", label: "Terms source URL", type: "url" }, { key: "checked", label: "Checked on", type: "date" }, { key: "notes", label: "Notes", type: "textarea" }] },
  contacts: { label: "Contacts", singular: "contact", intro: "Keep supplier and partner contacts organized.", title: "Name", fields: [{ key: "company", label: "Company" }, { key: "email", label: "Email", type: "email" }, { key: "phone", label: "Phone" }, { key: "role", label: "Role" }, { key: "notes", label: "Notes", type: "textarea" }] },
  products: { label: "Products", singular: "product", intro: "Prepare a catalog and export it for each selling channel.", title: "Product", stages: ["draft", "ready", "listed", "paused"], fields: [{ key: "sku", label: "SKU", required: true }, { key: "description", label: "Description", type: "textarea" }, { key: "price", label: "Price", type: "number" }, { key: "cost", label: "Cost", type: "number" }, { key: "currency", label: "Currency" }, { key: "stock", label: "Stock", type: "number" }, { key: "image", label: "Image URL", type: "url" }, { key: "supplier", label: "Supplier" }, { key: "notes", label: "Notes", type: "textarea" }] },
  outreach: { label: "Outreach", singular: "outreach", intro: "Plan contact with suppliers and follow up from your own email or social account.", title: "Subject", stages: ["planned", "sent", "replied", "follow up", "closed"], fields: [{ key: "recipient", label: "Recipient" }, { key: "channel", label: "Channel", type: "select", options: ["email", "social", "phone", "form"] }, { key: "body", label: "Message", type: "textarea" }, { key: "follow_up", label: "Follow-up date", type: "date" }] },
  campaigns: { label: "Campaigns", singular: "campaign", intro: "Plan a campaign around a product, audience and channel. Publishing requires a connected account and review.", title: "Campaign", stages: ["draft", "review", "approved", "active", "completed"], fields: [{ key: "channel", label: "Channel", type: "select", options: ["email", "facebook", "instagram", "tiktok", "store", "manual"] }, { key: "audience", label: "Audience" }, { key: "goal", label: "Goal" }, { key: "product", label: "Product" }, { key: "start", label: "Start date", type: "date" }, { key: "notes", label: "Notes", type: "textarea" }] },
  content: { label: "Content studio", singular: "content item", intro: "Draft copy, review it, and export it for publishing. Nothing is posted automatically.", title: "Content title", stages: ["draft", "review", "approved", "published"], fields: [{ key: "channel", label: "Channel", type: "select", options: ["email", "facebook", "instagram", "tiktok", "store"] }, { key: "campaign", label: "Campaign" }, { key: "audience", label: "Audience" }, { key: "product", label: "Product" }, { key: "benefit", label: "Main benefit" }, { key: "body", label: "Copy", type: "textarea" }, { key: "scheduled", label: "Target date", type: "date" }] },
  leads: { label: "Leads", singular: "lead", intro: "Track interested buyers and next steps.", title: "Name", stages: ["new", "qualified", "proposal", "won", "lost"], fields: [{ key: "email", label: "Email", type: "email" }, { key: "source", label: "Source" }, { key: "interest", label: "Interest" }, { key: "follow_up", label: "Follow-up date", type: "date" }, { key: "notes", label: "Notes", type: "textarea" }] },
  inbox: { label: "Conversations", singular: "conversation", intro: "Log inquiries and replies. Connected inbox monitoring will appear once accounts are authorized.", title: "Subject", stages: ["open", "awaiting reply", "follow up", "resolved"], fields: [{ key: "person", label: "Person" }, { key: "channel", label: "Channel" }, { key: "message", label: "Message", type: "textarea" }, { key: "reply", label: "Draft reply", type: "textarea" }, { key: "follow_up", label: "Follow-up date", type: "date" }] },
  orders: { label: "Orders", singular: "order", intro: "Log orders and fulfillment. Channel imports require a connected store.", title: "Order number", stages: ["pending", "paid", "fulfilled", "shipped", "delivered", "returned", "cancelled"], fields: [{ key: "customer", label: "Customer" }, { key: "channel", label: "Channel" }, { key: "total", label: "Total", type: "number" }, { key: "currency", label: "Currency" }, { key: "ordered", label: "Order date", type: "date" }, { key: "notes", label: "Notes", type: "textarea" }] },
  subscribers: { label: "Subscribers", singular: "subscriber", intro: "Record consent before sending marketing. Honor unsubscribe requests.", title: "Email", stages: ["pending", "opted in", "unsubscribed"], fields: [{ key: "name", label: "Name" }, { key: "list", label: "List or store" }, { key: "consent_source", label: "Consent source" }, { key: "consented", label: "Consent date", type: "date" }, { key: "notes", label: "Notes", type: "textarea" }] },
  payments: { label: "Payments", singular: "payment record", intro: "Record transactions manually. Payment processing is not active until a provider is configured.", title: "Reference", stages: ["recorded", "settled", "refunded", "disputed"], fields: [{ key: "order", label: "Order" }, { key: "provider", label: "Provider" }, { key: "amount", label: "Amount", type: "number" }, { key: "fee", label: "Processing fee", type: "number" }, { key: "currency", label: "Currency" }, { key: "date", label: "Date", type: "date" }] },
  channels: { label: "Sales channels", singular: "channel", intro: "Organize store details and export products. Live synchronization needs provider authorization.", title: "Store or account name", stages: ["manual", "setup", "connected"], fields: [{ key: "platform", label: "Platform", type: "select", options: ["Shopify", "WooCommerce", "Facebook", "Instagram", "TikTok Shop", "Email", "Other"] }, { key: "url", label: "Store or profile URL", type: "url" }, { key: "notes", label: "Setup notes", type: "textarea" }] },
};
const nav = ["overview", "niches", "suppliers", "contacts", "products", "channels", "outreach", "campaigns", "content", "leads", "inbox", "orders", "subscribers", "payments"];
const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
function safeUrl(value: string) { try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : null; } catch { return null; } }
function download(name: string, contents: string, type = "text/csv") { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([contents], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
function supplierScore(row: RecordItem) { const d = row.data; const verified = d.consignment === "yes" && d.verification === "confirmed" && d.deposit === "0" && d.monthly_fee === "0" && !!d.source && !!d.checked; return [verified ? 0 : 1, d.deposit === "" || d.deposit == null ? 999999 : Number(d.deposit), d.monthly_fee === "" || d.monthly_fee == null ? 999999 : Number(d.monthly_fee), d.moq === "" || d.moq == null ? 999999 : Number(d.moq)]; }
function compareScore(a: RecordItem, b: RecordItem) { const x = supplierScore(a), y = supplierScore(b); for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i]; return a.title.localeCompare(b.title); }

export default function Workspace({ name, email, signOut }: { name: string; email: string; signOut: string }) {
  const [section, setSection] = useState("overview");
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("Global");
  const [editing, setEditing] = useState<RecordItem | "new" | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [scanOpen, setScanOpen] = useState(false);
  const [scanQuery, setScanQuery] = useState("");
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [scanBusy, setScanBusy] = useState(false);
  const [scanChecked, setScanChecked] = useState("");
  const [savedUrls, setSavedUrls] = useState<string[]>([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const [displayName, setDisplayName] = useState(name);
  const [nameDraft, setNameDraft] = useState(name);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [sceneDirection, setSceneDirection] = useState<"next" | "previous">("next");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [forceMotion, setForceMotion] = useState(false);
  const touchStart = useRef<{ x: number; y: number; scrollY: number; interactive: boolean } | null>(null);
  const [navPosition, setNavPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const navDrag = useRef<{ pointerId: number; startX: number; startY: number; x: number; y: number; moved: boolean } | null>(null);
  const suppressNavClick = useRef(false);
  useEffect(() => {
    const resetPosition = () => setNavPosition(null);
    window.addEventListener("resize", resetPosition);
    return () => window.removeEventListener("resize", resetPosition);
  }, []);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    const storedMotion = window.setTimeout(() => setForceMotion(window.localStorage.getItem("eshme-workspace-motion") === "on"), 0);
    media.addEventListener("change", sync);
    return () => { window.clearTimeout(storedMotion); media.removeEventListener("change", sync); };
  }, []);
  const navPanelStyle = navPosition ? {
    position: "fixed" as const,
    left: Math.max(18, Math.min(navPosition.x - 262, navPosition.width - 338)),
    right: "auto" as const,
    ...(navPosition.y > navPosition.height / 2
      ? { bottom: navPosition.height - navPosition.y + 12, top: "auto" as const, maxHeight: Math.max(160, navPosition.y - 24) }
      : { top: navPosition.y + 70, bottom: "auto" as const, maxHeight: Math.max(160, navPosition.height - navPosition.y - 90) }),
  } : undefined;
  const config = sections[section];
  const sectionIndex = nav.indexOf(section);
  const firstName = (displayName.trim() || email.split("@")[0].split(/[._-]/)[0] || "Seller").split(/\s+/)[0];
  const shownFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  function changeSection(next: string, direction: "next" | "previous" = "next") {
    setSceneDirection(direction);
    setSection(next);
    setMobileNavOpen(false);
    setProfileOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function finishSwipe(event: React.TouchEvent<HTMLElement>) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || start.interactive || editing || mobileNavOpen || profileOpen || window.innerWidth > 650) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dy) < 85 || Math.abs(dy) < Math.abs(dx) * 1.4) return;
    const next = dy < 0;
    const atTop = start.scrollY < 8;
    const atBottom = start.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 12;
    if ((next && !atBottom) || (!next && !atTop)) return;
    const target = nav[sectionIndex + (next ? 1 : -1)];
    if (target) changeSection(target, next ? "next" : "previous");
  }
  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    const nextName = nameDraft.trim().replace(/\s+/g, " ");
    if (!nextName) return;
    setProfileBusy(true); setProfileError("");
    try {
      if (email !== "Local seller") await updateUser({ data: { full_name: nextName } });
      setDisplayName(nextName);
      setProfileEditing(false);
    } catch (cause) { setProfileError(cause instanceof Error ? cause.message : "Could not save your name."); }
    finally { setProfileBusy(false); }
  }
  const load = useCallback(async (kind: string) => {
    if (kind === "overview") return;
    setLoading(true); setError("");
    try { const res = await fetch(`/api/records?kind=${encodeURIComponent(kind)}`, { cache: "no-store" }); const body = await res.json() as { error?: string; records?: RecordItem[] }; if (!res.ok) throw new Error(body.error || "Unable to load records"); setRecords(body.records || []); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load records"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(section); setSearch(""); setEditing(null); }, [section, load]);
  const shown = useMemo(() => records.filter((r) => (country === "Global" || !r.country || r.country === country) && JSON.stringify(r).toLowerCase().includes(search.toLowerCase())).sort(section === "suppliers" ? compareScore : (a, b) => b.updated_at - a.updated_at), [records, country, search, section]);
  function open(item: RecordItem | "new") {
    setEditing(item);
    setForm(item === "new"
      ? { country, stage: config?.stages?.[0] || "", ...(section === "niches" || section === "suppliers" ? { checked: today() } : {}) }
      : { ...item.data, title: item.title, country: item.country || "", stage: item.stage || "" });
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (!config) return;
    const { title, country: recordCountry, stage, ...data } = form;
    const payload = { kind: section, title, country: recordCountry || null, stage: stage || config.stages?.[0] || null, data };
    const isNew = editing === "new";
    try { const res = await fetch("/api/records", { method: isNew ? "POST" : "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(isNew ? payload : { ...payload, id: (editing as RecordItem).id }) }); const body = await res.json() as { error?: string }; if (!res.ok) throw new Error(body.error || "Unable to save"); setEditing(null); await load(section); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to save"); }
  }
  async function remove(row: RecordItem) { if (!confirm(`Delete ${row.title}?`)) return; const res = await fetch(`/api/records?id=${encodeURIComponent(row.id)}`, { method: "DELETE" }); if (res.ok) await load(section); else setError("Unable to delete record"); }
  function exportRows(productFeed = false) {
    const fields = productFeed ? ["sku", "title", "description", "price", "currency", "stock", "image"] : ["title", "country", "stage", ...config.fields.map((f) => f.key)];
    const lines = [fields.map(csvCell).join(","), ...shown.map((r) => fields.map((key) => csvCell(key === "title" ? r.title : key === "country" ? r.country : key === "stage" ? r.stage : r.data[key])).join(","))];
    download(`${productFeed ? "product-feed" : section}-${new Date().toISOString().slice(0, 10)}.csv`, lines.join("\r\n"));
  }
  async function importCsv(file: File) {
    const text = await file.text(); const lines = text.split(/\r?\n/).filter(Boolean); if (lines.length > 101) { setError("Import up to 100 rows at a time"); return; }
    const parse = (line: string) => { const out: string[] = []; let value = "", quoted = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (ch === '"' && line[i + 1] === '"' && quoted) { value += '"'; i++; } else if (ch === '"') quoted = !quoted; else if (ch === "," && !quoted) { out.push(value); value = ""; } else value += ch; } out.push(value); return out; };
    const headers = parse(lines[0]); let count = 0;
    for (const line of lines.slice(1)) { const values = parse(line); const row = Object.fromEntries(headers.map((h, i) => [h, values[i] || ""])); const title = row.title || row[config.title.toLowerCase()] || ""; if (!title) continue; const { title: _title, country: recordCountry, stage, ...data } = row; const res = await fetch("/api/records", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: section, title, country: recordCountry || null, stage: stage || null, data }) }); if (res.ok) count++; }
    setError(`${count} records imported${count < lines.length - 1 ? "; some rows need a title" : ""}.`); await load(section);
  }
  function generateCopy() { const product = form.product || "[product]", benefit = form.benefit || "[main benefit]", audience = form.audience || "[audience]"; setForm({ ...form, body: `For ${audience}: meet ${product}. ${benefit}. Explore the details and decide if it fits your needs.`, stage: "draft" }); }
  async function scanSourcing() {
    setScanBusy(true); setError(""); setScanResults([]); setScanChecked("");
    try {
      const params = new URLSearchParams({ niche: scanQuery.trim(), country });
      const response = await fetch(`/api/sourcing-scan?${params}`, { cache: "no-store" });
      const body = await response.json() as { error?: string; results?: ScanResult[]; checkedAt?: string };
      if (!response.ok) throw new Error(body.error || "Scan unavailable");
      setScanResults(body.results || []); setScanChecked(body.checkedAt || "");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Scan unavailable"); }
    finally { setScanBusy(false); }
  }
  async function saveScanResult(result: ScanResult) {
    try {
      const response = await fetch("/api/records", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "suppliers", title: result.title, country, stage: "prospect", data: { website: result.url, source: result.url, niche: scanQuery.trim(), checked: today(), consignment: "unknown", verification: "unknown", notes: `Discovered in public search on ${today()}. Terms, fees, inventory ownership and fulfillment need direct verification. ${result.snippet}` } }) });
      if (!response.ok) throw new Error("Could not save supplier lead");
      setSavedUrls((current) => [...current, result.url]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save supplier lead"); }
  }
  return <div className={`app-shell ${forceMotion ? "workspace-motion-opt-in" : ""}`}>
    {mobileNavOpen && <button type="button" className="workspace-nav-backdrop" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
    <aside className="app-sidebar" style={navPosition ? { left: navPosition.x, top: navPosition.y, right: "auto", bottom: "auto" } : undefined} onKeyDown={(event) => { if (event.key === "Escape") setMobileNavOpen(false); }}>
      <button type="button" className="workspace-nav-toggle" aria-label={mobileNavOpen ? "Close workspace menu" : "Open workspace menu"} aria-expanded={mobileNavOpen} aria-controls="workspace-nav-panel" onPointerDown={(event) => { if (event.pointerType === "mouse" && event.button !== 0) return; const rect = event.currentTarget.getBoundingClientRect(); navDrag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: rect.left, y: rect.top, moved: false }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={(event) => { const drag = navDrag.current; if (!drag || drag.pointerId !== event.pointerId) return; const dx = event.clientX - drag.startX; const dy = event.clientY - drag.startY; if (!drag.moved && Math.hypot(dx, dy) < 6) return; drag.moved = true; setNavPosition({ x: Math.max(12, Math.min(drag.x + dx, window.innerWidth - 70)), y: Math.max(12, Math.min(drag.y + dy, window.innerHeight - 70)), width: window.innerWidth, height: window.innerHeight }); }} onPointerUp={(event) => { if (navDrag.current?.pointerId === event.pointerId) { suppressNavClick.current = navDrag.current.moved; navDrag.current = null; } }} onPointerCancel={() => { navDrag.current = null; }} onClick={() => { if (suppressNavClick.current) { suppressNavClick.current = false; return; } setMobileNavOpen((open) => !open); }}><span aria-hidden="true">{mobileNavOpen ? "×" : "☰"}</span></button>
      <div id="workspace-nav-panel" className={`workspace-nav-panel ${mobileNavOpen ? "open" : ""}`} style={navPanelStyle}>
        <Link className="brand" href="/"><span className="brand-mark">E</span><span>Eshme<span className="brand-light">-Commerce</span></span></Link>
        <p className="side-caption">Seller workspace</p>
        <nav aria-label="Workspace">{nav.map((key) => <button key={key} className={`nav-item ${section === key ? "active" : ""}`} onClick={() => changeSection(key, nav.indexOf(key) >= sectionIndex ? "next" : "previous")}>{key === "overview" ? "Overview" : sections[key].label}</button>)}</nav>
        <div className="sidebar-foot"><div className="small-muted">Signed in as</div><div className="truncate">{displayName || email}</div><a href={signOut}>Sign out ↗</a></div>
      </div>
    </aside>
    <main className="app-main workspace-scene" style={{ "--scene-index": sectionIndex } as React.CSSProperties} onTouchStart={(event) => { const target = event.target as HTMLElement; touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY, scrollY: window.scrollY, interactive: !!target.closest("button, a, input, select, textarea, label, summary, [role='dialog']") }; }} onTouchEnd={finishSwipe}>
      <header className="workspace-top"><span className="eyebrow">Eshme-Commerce / {section === "overview" ? "Overview" : config.label}</span><div className="workspace-top-actions"><label>Market <select value={country} onChange={(e) => setCountry(e.target.value)}>{countries.map((c) => <option key={c}>{c}</option>)}</select></label><button type="button" className="profile-trigger" aria-label={`Open profile for ${shownFirstName}`} aria-expanded={profileOpen} aria-controls="profile-menu" onClick={() => { setProfileOpen((open) => !open); setMobileNavOpen(false); }}><span className="profile-avatar" aria-hidden="true">{shownFirstName[0]}</span><span>{shownFirstName}</span><span aria-hidden="true">⌄</span></button></div></header>
      {profileOpen && <><button type="button" className="profile-dismiss" aria-label="Close profile menu" onClick={() => setProfileOpen(false)} /><div id="profile-menu" className="profile-menu" role="menu" aria-label="Profile"><div className="profile-identity"><span className="profile-avatar large" aria-hidden="true">{shownFirstName[0]}</span><div><strong>{displayName || shownFirstName}</strong><small>{email}</small></div></div>{profileEditing ? <form className="profile-edit" onSubmit={(event) => void saveProfile(event)}><label>Display name<input value={nameDraft} maxLength={80} autoComplete="name" autoFocus onChange={(event) => setNameDraft(event.target.value)} /></label>{profileError && <p role="alert">{profileError}</p>}<div><button type="button" onClick={() => setProfileEditing(false)}>Cancel</button><button type="submit" disabled={profileBusy || !nameDraft.trim()}>{profileBusy ? "Saving…" : "Save name"}</button></div></form> : <><button type="button" role="menuitem" onClick={() => { setNameDraft(displayName); setProfileEditing(true); }}>Edit profile name <span>↗</span></button>{reducedMotion && <button type="button" role="menuitemcheckbox" aria-checked={forceMotion} onClick={() => { const next = !forceMotion; setForceMotion(next); window.localStorage.setItem("eshme-workspace-motion", next ? "on" : "off"); }}>{forceMotion ? "Pause animations" : "Enable animations"} <span>{forceMotion ? "✓" : "↗"}</span></button>}<Link role="menuitem" href="/">Visit home <span>↗</span></Link><a role="menuitem" href={signOut}>Sign out <span>↗</span></a></>}</div></>}
      <div className="mobile-section-status" aria-live="polite"><span className="section-counter">{String(sectionIndex + 1).padStart(2, "0")} <i>/</i> {String(nav.length).padStart(2, "0")}</span><span>{section === "overview" ? "Overview" : config.label}</span><span className="section-swipe-hint">Swipe {sectionIndex === nav.length - 1 ? "down" : "up"} at the edge to {sectionIndex === nav.length - 1 ? "go back" : "continue"} <b>↕</b></span><span className="section-controls"><button type="button" disabled={sectionIndex === 0} aria-label="Previous section" onClick={() => changeSection(nav[sectionIndex - 1], "previous")}>↑</button><button type="button" disabled={sectionIndex === nav.length - 1} aria-label="Next section" onClick={() => changeSection(nav[sectionIndex + 1], "next")}>↓</button></span>{reducedMotion && !forceMotion && <button type="button" className="section-motion-button" onClick={() => { setForceMotion(true); window.localStorage.setItem("eshme-workspace-motion", "on"); }}>Enable animations ✦</button>}<span className="section-track" aria-hidden="true"><span style={{ width: `${((sectionIndex + 1) / nav.length) * 100}%` }} /></span></div>
      {section === "overview" ? <div key={section} className={`workspace-content scene-arrive scene-${sceneDirection}`}><div className="page-heading"><span className="eyebrow accent">WORKSPACE</span><h1>Build your selling operation, one decision at a time.</h1><p>Research a market, qualify suppliers, prepare products, then manage the conversations that turn interest into orders.</p></div><div className="overview-grid">{["niches", "suppliers", "products", "campaigns", "inbox", "orders"].map((key, i) => <button className="overview-card" key={key} onClick={() => changeSection(key)}><span className="step">0{i + 1}</span><h2>{sections[key].label}</h2><p>{sections[key].intro}</p><span className="card-link">Open section ↗</span></button>)}</div><div className="notice"><strong>Start with evidence.</strong> Market opportunity and supplier terms change. Save dated source links before relying on a claim.</div></div> : <div key={section} className={`workspace-content scene-arrive scene-${sceneDirection}`}><div className="page-heading"><span className="eyebrow accent">SELLER OPERATIONS</span><h1>{config.label}</h1><p>{config.intro}</p></div>
        {section === "channels" && <div className="notice"><strong>Channel setup:</strong> Shopify, WooCommerce, Facebook, Instagram and TikTok Shop are available for manual planning. Live connections, inventory sync, messages and store metrics require approved API access. <button className="text-button" onClick={() => { setSection("products"); }}>Open products →</button></div>}
        {section === "payments" && <div className="notice"><strong>Processing is not active.</strong> Add transaction records here. Provider setup and subscription billing will be available when pricing is announced; payment processors charge transaction fees.</div>}
        {section === "niches" && <div className="notice"><strong>Research status:</strong> Public-web discovery is available below. Search previews are leads, not verified consignment terms or proof of profit.</div>}
        <div className="toolbar"><input aria-label="Search records" placeholder={`Search ${config.label.toLowerCase()}…`} value={search} onChange={(e) => setSearch(e.target.value)} /><button className="button-primary" onClick={() => open("new")}>+ Add {config.singular}</button>{section === "niches" && <button className="button-secondary" aria-expanded={scanOpen} onClick={() => setScanOpen((value) => !value)}>⌕ Scan sourcing</button>}<button className="button-secondary" onClick={() => exportRows(false)} disabled={!shown.length}>Export CSV</button>{section === "products" && <button className="button-secondary" onClick={() => exportRows(true)} disabled={!shown.length}>Product feed</button>}<label className="button-secondary upload">Import CSV<input type="file" accept=".csv,text/csv" onChange={(e) => { const file = e.target.files?.[0]; if (file) void importCsv(file); e.currentTarget.value = ""; }} /></label></div>
        {section === "niches" && scanOpen && <section className="scan-panel" aria-label="Public sourcing scan"><div className="scan-heading"><div><span className="eyebrow accent">PUBLIC-WEB DISCOVERY</span><h2>Find sourcing leads</h2><p>Search public results for consignment and wholesale inventory pages. Open each source and confirm the actual terms before using it.</p></div></div><form className="scan-form" onSubmit={(event) => { event.preventDefault(); void scanSourcing(); }}><label htmlFor="scan-niche">Niche or product category</label><div><input id="scan-niche" value={scanQuery} maxLength={80} onChange={(event) => setScanQuery(event.target.value)} placeholder="Optional, e.g. pet accessories" /><button className="button-primary" disabled={scanBusy} type="submit">{scanBusy ? "Scanning…" : "Scan public pages"}</button></div><small>Market: {country}. Results are search previews—not a complete crawl of the internet.</small></form>{scanChecked && <p className="scan-status" role="status">{scanResults.length} leads found · checked {new Date(scanChecked).toLocaleString()} · terms unverified</p>}{scanChecked && scanResults.length === 0 && <p className="scan-status">No relevant public results were returned. Try a narrower category or another market.</p>}<div className="scan-results">{scanResults.map((result) => <article key={result.url} className="scan-result"><span>{result.domain}</span><h3>{result.title}</h3><p>{result.snippet || "Open this public page to review the offer and terms."}</p><div><a href={result.url} target="_blank" rel="noopener noreferrer">Open source ↗</a><button type="button" disabled={savedUrls.includes(result.url)} onClick={() => void saveScanResult(result)}>{savedUrls.includes(result.url) ? "Saved as supplier lead" : "Save supplier lead"}</button></div></article>)}</div></section>}
        {error && <div className="message" role="status">{error}<button onClick={() => setError("")} aria-label="Dismiss">×</button></div>}
        {loading ? <div className="empty-state">Loading records…</div> : shown.length === 0 ? <div className="empty-state"><span>◇</span><h2>No {config.label.toLowerCase()} yet</h2><p>Add your first record, or import a CSV with a title column. Records are private to your account.</p><button className="button-primary" onClick={() => open("new")}>Add {config.singular}</button></div> : <div className="record-list">{shown.map((row) => <article key={row.id} className="record-card"><div><span className="record-kind">{section === "suppliers" && supplierScore(row)[0] === 0 ? "VERIFIED ZERO-UPFRONT" : (row.stage || "RECORD").toUpperCase()}</span><h2>{row.title}</h2><p>{[row.country, row.data.category, row.data.platform, row.data.channel, row.data.website].filter(Boolean).join(" · ") || `Updated ${new Date(row.updated_at).toLocaleDateString()}`}</p>{section === "suppliers" && <small>{row.data.consignment === "yes" ? `Consignment · ${row.data.verification || "unverified"}` : "Consignment unknown or unavailable"} · MOQ {row.data.moq || "?"} · Deposit {row.data.deposit || "?"}</small>}{row.data.source && safeUrl(row.data.source) && <a className="source-link" href={safeUrl(row.data.source)!} target="_blank" rel="noopener noreferrer">View source ↗</a>}</div><div className="row-actions"><button onClick={() => open(row)}>Edit</button><button onClick={() => void remove(row)}>Delete</button></div></article>)}</div>}
      </div>}
    </main>
    {editing && config && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setEditing(null); }}><div className="modal" role="dialog" aria-modal="true" aria-label={`${editing === "new" ? "Add" : "Edit"} ${config.singular}`}><div className="modal-head"><div><span className="eyebrow accent">{editing === "new" ? "NEW RECORD" : "EDIT RECORD"}</span><h2>{editing === "new" ? `Add ${config.singular}` : form.title}</h2></div><button className="icon-button" onClick={() => setEditing(null)} aria-label="Close">×</button></div><form onSubmit={(e) => void save(e)}>{section === "niches" && editing === "new" && <div className="starter-picker"><span>Quick start · ideas to research, not validated opportunities</span><div>{nicheStarters.map((starter) => <button key={starter.title} type="button" onClick={() => setForm((current) => ({ ...current, title: starter.title, category: starter.category }))}>{starter.title}</button>)}</div></div>}<div className="form-grid"><label className="wide">{config.title}<input required value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><label>Country<select value={form.country || ""} onChange={(e) => setForm({ ...form, country: e.target.value })}><option value="">Not specified</option>{countries.map((c) => <option key={c}>{c}</option>)}</select></label>{config.stages && <label>Status<select value={form.stage || config.stages[0]} onChange={(e) => setForm({ ...form, stage: e.target.value })}>{config.stages.map((s) => <option key={s}>{s}</option>)}</select></label>}{config.fields.map((field) => <label key={field.key} className={field.type === "textarea" ? "wide" : ""}>{field.label}{field.type === "textarea" ? <textarea rows={3} value={form[field.key] || ""} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} /> : field.type === "select" ? <select value={form[field.key] || ""} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}><option value="">Select…</option>{field.options?.map((opt) => <option key={opt}>{opt}</option>)}</select> : <input type={field.type || "text"} required={field.required} value={form[field.key] || ""} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} />}</label>)}</div>{section === "content" && <button type="button" className="button-secondary" onClick={generateCopy}>Create copy from template</button>}<div className="modal-actions"><button type="button" className="button-secondary" onClick={() => setEditing(null)}>Cancel</button><button className="button-primary" type="submit">Save record</button></div></form></div></div>}
  </div>;
}
