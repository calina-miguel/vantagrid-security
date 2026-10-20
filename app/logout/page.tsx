"use client";

import { logout } from "@netlify/identity";
import { useEffect } from "react";

export default function LogoutPage() {
  useEffect(() => { void logout().finally(() => window.location.replace("/")); }, []);
  return <main style={{ padding: 30 }}>Signing out…</main>;
}
