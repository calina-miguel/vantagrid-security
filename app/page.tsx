import "./vantagrid.css";
import "./pathway.css";
import { Pathway } from "./pathway";

export const metadata = { title: "VantaGrid | Security, without the theater", description: "A practical first security path for small teams, built around clarity and manageable safeguards." };

const checks = [
  ["ACCESS", "Who can reach what?", "Review the accounts and tools your team relies on."],
  ["RECOVERY", "Could you get back in?", "Make sure recovery steps are known before they are needed."],
  ["UPDATES", "What needs attention?", "Keep the next patch and protection step visible."],
];

export default function Page() {
  return <main className="vanta-page" id="vanta-home">
    <header className="vanta-nav"><a className="vanta-brand" href="#vanta-home"><span className="vanta-emblem"><i/><i/><i/></span><span>VANTA<span>GRID</span></span></a><span className="vanta-nav-label">FIELD MANUAL / SMALL TEAM SECURITY</span><a className="vanta-nav-link" href="#checklist">Open the field manual <b>↘</b></a></header>
    <section className="vanta-hero"><div className="vanta-copy"><p className="vanta-kicker"><span/> SECURITY, WITHOUT THE THEATER</p><h1>Protect the<br />next <i>move.</i></h1><p>Turn a vague security concern into a short list of practical safeguards your team can actually work through.</p><a className="vanta-button" href="#checklist">Get the first-step checklist <b>↗</b></a><div className="vanta-hero-foot"><span>NO PANIC. JUST PRIORITIES.</span><span>VG / 01</span></div></div>
      <div className="vanta-console"><div className="console-bar"><span><i/> VANTAGRID / LOCAL CHECK</span><span>SESSION 001</span></div><div className="console-content"><div className="console-aside"><span>01</span><span>02</span><span>03</span></div><div className="console-main"><p className="console-path">/workspace/security/posture</p><p className="console-command"><span>vg&gt;</span> scan the obvious gaps<span className="terminal-cursor"/></p><div className="scan-meter"><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/></div><div className="console-status"><span>REVIEW SUGGESTED</span><b>3 FOCUS AREAS</b></div><div className="console-list">{checks.map(([tag,title],i)=><div className="console-row" key={tag}><span>{String(i+1).padStart(2,"0")}</span><b>{tag}</b><i>{title}</i><em>↗</em></div>)}</div><div className="console-command command-last"><span>vg&gt;</span> start with one safeguard<span className="terminal-cursor"/></div></div></div><div className="console-bottom"><span>STATUS / READY</span><span>LOCAL VIEW ONLY</span><span>●●●</span></div><div className="vanta-grid-mark" aria-hidden="true">VG</div></div></section>
    <section className="vanta-checklist" id="checklist"><div className="checklist-heading"><p className="vanta-kicker"><span/> THE FIRST THREE CHECKS</p><h2>Make security<br /><i>manageable.</i></h2><p>Good foundations are usually a sequence of small, clear decisions - not one giant overhaul.</p></div><div className="checklist-items">{checks.map(([tag,title,copy],i)=><article key={tag} className="check-item"><span className="check-index">0{i+1}</span><div><span className="check-tag">{tag} / START HERE</span><h3>{title}</h3><p>{copy}</p></div><b>↗</b></article>)}</div></section>
    <section className="vanta-recovery"><div><p className="vanta-kicker"><span/> KEEP YOUR PLACE</p><h2>One useful<br />step at a <i>time.</i></h2><p>Run a small-team posture review to identify a first safeguard your team can own.</p></div><Pathway /></section>
    <footer className="vanta-footer"><a className="vanta-brand" href="#vanta-home"><span className="vanta-emblem"><i/><i/><i/></span><span>VANTA<span>GRID</span></span></a><span>Clarity is a safeguard.</span><span>© 2026 VANTAGRID SECURITY</span></footer>
  </main>;
}
