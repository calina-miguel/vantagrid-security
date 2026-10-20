"use client";

import { useEffect, useState } from "react";

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export default function ScrollMotion() {
  const [reduced, setReduced] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches && !enabled) return;

    const root = document.querySelector<HTMLElement>(".marketing");
    if (!root) return;
    document.documentElement.classList.toggle("motion-opt-in", enabled);
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-scroll-motion]"));
    let frame = 0;

    const update = () => {
      frame = 0;
      const height = window.innerHeight;
        const mobile = window.innerWidth < 650;
        const tablet = window.innerWidth < 1024;
      for (const item of items) {
        const rect = item.getBoundingClientRect();
        const enter = clamp((height * 0.93 - rect.top) / (height * 0.52));
        const leave = clamp((rect.bottom - height * 0.09) / (height * 0.34));
        const progress = Math.min(enter, leave);
        const eased = 1 - Math.pow(1 - progress, 3);
        const direction = item.dataset.scrollMotion === "left" ? -1 : item.dataset.scrollMotion === "right" ? 1 : 0;
        const isHero = item.classList.contains("hero-visual");
        const isStep = item.classList.contains("step-card");
        const distance = mobile
          ? isHero ? Math.min(window.innerWidth * 0.82, 340) : isStep ? Math.min(window.innerWidth * 0.62, 260) : 130
          : isHero ? Math.min(window.innerWidth * 0.38, 430) : isStep ? tablet ? 240 : 290 : tablet ? 175 : 240;
        item.style.setProperty("--scroll-x", `${(1 - eased) * distance * direction}px`);
        item.style.setProperty("--scroll-y", `${(1 - eased) * (direction ? mobile ? 28 : tablet ? 52 : 75 : distance)}px`);
        item.style.setProperty("--scroll-opacity", `${Math.max(0.08, eased)}`);
        item.style.setProperty("--scroll-scale", `${(isHero ? 0.68 : isStep ? 0.76 : 0.8) + eased * (isHero ? 0.32 : isStep ? 0.24 : 0.2)}`);
        item.style.setProperty("--scroll-rotate", `${(1 - eased) * (isHero ? 9 : isStep ? 5 : 3) * direction}deg`);
      }
      const feature = root.querySelector<HTMLElement>(".feature-section");
      if (feature) {
        const bounds = feature.getBoundingClientRect();
        const total = Math.max(1, bounds.height - height);
        feature.style.setProperty("--section-progress", `${clamp(-bounds.top / total)}`);
      }
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    root.classList.add("scroll-motion-ready");
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
      root.classList.remove("scroll-motion-ready");
      document.documentElement.classList.remove("motion-opt-in");
    };
  }, [enabled, reduced]);

  return reduced ? <button type="button" className="motion-choice" aria-pressed={enabled} onClick={() => setEnabled((value) => !value)}>{enabled ? "Pause scroll effects" : "Enable scroll effects"}</button> : null;
}
