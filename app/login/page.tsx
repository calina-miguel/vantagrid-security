"use client";

import { getUser, handleAuthCallback, login, signup } from "@netlify/identity";
import { useEffect, useState } from "react";
import "./signin.css";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (window.location.hash) await handleAuthCallback();
        const user = await getUser();
        if (active && user) window.location.replace("/workspace");
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "Unable to complete sign-in.");
      }
    })();
    return () => { active = false; };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setMessage("");
    try {
      if (mode === "signup") {
        await signup(email.trim(), password, { full_name: fullName.trim() });
        setMessage("Check your email to confirm your account, then sign in.");
        setMode("login");
      } else {
        await login(email.trim(), password);
        window.location.assign("/workspace");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in.");
    } finally { setBusy(false); }
  }

  return <main className="signin-page"><a className="brand" href="/"><span className="brand-mark">E</span><span>Eshme<span className="brand-light">-Commerce</span></span></a><section className="signin-card"><span className="eyebrow accent">SELLER WORKSPACE</span><h1>{mode === "login" ? "Welcome back." : "Get started."}</h1><p>{mode === "login" ? "Sign in to continue building your selling operation." : "Create an account to save your research and plans."}</p><form onSubmit={(event) => void submit(event)}>{mode === "signup" && <label>Your name<input type="text" autoComplete="name" required maxLength={80} value={fullName} onChange={(event) => setFullName(event.target.value)} /></label>}<label>Email<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="button-primary" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in ↗" : "Create account ↗"}</button></form>{message && <p role="status" className="signin-message">{message}</p>}<button className="text-button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>{mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}</button></section></main>;
}
