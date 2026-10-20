import { FunnelLanding } from "./funnel-landing";

export const metadata = { title: "VantaGrid", description: "Turn a vague security concern into a practical first move for a growing team." };

export default function Page(){ return <FunnelLanding config={{ name: "VantaGrid", monogram: "VG", eyebrow: "SECURITY, WITHOUT THE THEATER", title: "Turn a vague security concern into a practical first move for a growing team.", body: "Small-business cybersecurity", accent: "#0b5f56", soft: "#e5f4ed", steps: ["See where exposure starts","Prioritize the first safeguard","Receive the focused checklist"], cta: "Get the checklist", outcome: "First safeguard" }} />; }

