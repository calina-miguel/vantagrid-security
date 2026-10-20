"use client";

import { useEffect } from "react";

export default function AuthCallback() {
  useEffect(() => {
    if (!/(?:confirmation_token|invite_token|recovery_token|access_token)=/.test(window.location.hash)) return;
    void import("@netlify/identity").then(async ({ handleAuthCallback, getUser }) => {
      await handleAuthCallback();
      if (await getUser()) window.location.replace("/workspace");
    }).catch(() => { window.location.replace("/login"); });
  }, []);
  return null;
}
