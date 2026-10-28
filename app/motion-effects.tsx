"use client";

import { useEffect } from "react";

const parallaxSelector = ".storyboard, .house-scene, .field-stilllife, .loop-visual, .paw-scene, .signal-screen, .vanta-console";

export function MotionEffects() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    const revealTargets = new Set<Element>();
    document.querySelectorAll("main section").forEach((section) => {
      Array.from(section.children).forEach((element, index) => {
        if (element instanceof HTMLElement && !element.matches("script, style")) {
          element.classList.add("reveal");
          element.style.setProperty("--reveal-delay", `${Math.min(index, 4) * 90}ms`);
          revealTargets.add(element);
        }
      });
      section.querySelectorAll("article, .route-item, .plan-step, .feed-item").forEach((element, index) => {
        if (element instanceof HTMLElement && !element.classList.contains("reveal")) {
          element.classList.add("reveal");
          element.style.setProperty("--reveal-delay", `${Math.min(index, 5) * 70}ms`);
          revealTargets.add(element);
        }
      });
    });

    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealTargets.forEach((target) => observer.observe(target));
    root.classList.add("motion-ready");

    const parallaxItems = Array.from(document.querySelectorAll<HTMLElement>(parallaxSelector));
    parallaxItems.forEach((item) => item.classList.add("parallax"));
    let frame = 0;
    let position = window.scrollY;
    let target = position;
    let previousTime = 0;

    const updateParallax = () => {
      for (const item of parallaxItems) {
        const section = item.closest("section") ?? item;
        const distance = -section.getBoundingClientRect().top;
        const speed = Number(item.dataset.speed || 0.12);
        item.style.setProperty("--parallax-y", `${distance * speed}px`);
      }
    };

    const animate = (time: number) => {
      const elapsed = Math.min(time - (previousTime || time), 64);
      previousTime = time;
      position += (target - position) * (1 - Math.exp(-elapsed / 125));
      if (Math.abs(target - position) < 0.5) position = target;
      window.scrollTo(0, position);
      updateParallax();
      if (position !== target) frame = requestAnimationFrame(animate);
      else { frame = 0; previousTime = 0; }
    };

    const onWheel = (event: WheelEvent) => {
      const source = event.target;
      if (reduced.matches || event.ctrlKey || event.shiftKey || !(source instanceof Element) ||
        source.closest("input, textarea, select, [data-native-scroll], [contenteditable='true']")) return;

      let nestedScroller = source.parentElement;
      while (nestedScroller && nestedScroller !== document.body) {
        const style = getComputedStyle(nestedScroller);
        const canScroll = /(auto|scroll)/.test(style.overflowY) && nestedScroller.scrollHeight > nestedScroller.clientHeight;
        if (canScroll && ((event.deltaY < 0 && nestedScroller.scrollTop > 0) ||
          (event.deltaY > 0 && nestedScroller.scrollTop + nestedScroller.clientHeight < nestedScroller.scrollHeight - 1))) return;
        nestedScroller = nestedScroller.parentElement;
      }

      const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
      const next = Math.max(0, Math.min(maxScroll, target + event.deltaY * multiplier));
      if (next === target) return;
      event.preventDefault();
      target = next;
      if (!frame) {
        position = window.scrollY;
        frame = requestAnimationFrame(animate);
      }
    };

    const onScroll = () => {
      if (reduced.matches) return;
      if (!frame) {
        position = target = window.scrollY;
        updateParallax();
      }
    };

    const onMotionChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        root.classList.remove("motion-ready");
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        window.scrollTo(0, target);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });
    reduced.addEventListener("change", onMotionChange);
    updateParallax();

    return () => {
      observer.disconnect();
      root.classList.remove("motion-ready");
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      reduced.removeEventListener("change", onMotionChange);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
