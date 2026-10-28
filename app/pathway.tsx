"use client";

import { useState } from "react";

const checks = [
  { key: "ACCESS", prompt: "Which area needs a clearer baseline?", values: ["Account access", "Recovery readiness", "Device updates"] },
  { key: "TEAM_SIZE", prompt: "Who will own the first review?", values: ["One person", "A small team", "An outside adviser"] },
  { key: "FIRST_CONTROL", prompt: "What can you put in place first?", values: ["Review sign-in access", "Test a recovery route", "Schedule updates"] },
];
const plans = [
  ["ACCESS / FIRST CONTROL", "List every administrator account, remove access that is no longer needed, and enable multi-factor authentication where available. Record who owns each account."],
  ["RECOVERY / FIRST CONTROL", "Confirm recovery contacts and backup access for your most important accounts. Test the documented route before relying on it during an incident."],
  ["UPDATES / FIRST CONTROL", "Inventory the devices and services your team relies on. Turn on supported automatic updates and assign an owner to review anything that cannot update automatically."],
];

export function Pathway() {
  const [step, setStep] = useState(0); const [answers, setAnswers] = useState<number[]>([]); const [output, setOutput] = useState(false);
  const command = (n: number) => setAnswers((old) => { const next = old.slice(0, step); next[step] = n; return next; });
  return <div className="pathway pathway--vanta" id="vanta-pathway" aria-live="polite">
    <div className="pathway__bar"><span><i/> VANTA / POSTURE CHECK</span><span>{output ? "EXIT 0" : `INPUT 0${step + 1}`}</span></div>
    {output ? <div className="pathway__result"><p className="pathway__prompt">vg&gt; route --first-control</p><h3>{plans[answers[0] ?? 0][0]}</h3><p>{plans[answers[0] ?? 0][1]}</p><div className="pathway__terminal-result"><span>STATUS</span><b>PRIORITY IDENTIFIED</b><span>THREE CHECKS COMPLETE</span></div><small>Email follow-up is paused until sender-domain setup is complete.</small><button onClick={() => { setOutput(false); setStep(0); setAnswers([]); }}>vg&gt; run another review ↺</button></div> : <>
      <p className="pathway__prompt">vg&gt; {checks[step].key.toLowerCase()} --review</p><h3>{checks[step].prompt}</h3><div className="pathway__options">{checks[step].values.map((item, i) => <button key={item} className={answers[step] === i ? "selected" : ""} onClick={() => command(i)} aria-pressed={answers[step] === i}><span>{String(i + 1).padStart(2, "0")}</span><b>{item}</b><i>{answers[step] === i ? "[x]" : "[ ]"}</i></button>)}</div>
      <div className="pathway__console-actions"><span>STEP {step + 1} / 03</span><button onClick={() => setStep(Math.max(step - 1, 0))} disabled={!step}>BACK</button><button onClick={() => step < 2 ? setStep(step + 1) : setOutput(true)} disabled={answers[step] === undefined}>{step === 2 ? "RUN REVIEW" : "CONTINUE"} ↗</button></div>
    </>}
  </div>;
}
