"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const NAVIGATION_START_EVENT = "draftline:navigation-start";

export function startNavigation() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(NAVIGATION_START_EVENT));
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const previousRoute = useRef(routeKey);
  const intervalRef = useRef<number | null>(null);
  const finishRef = useRef<number | null>(null);
  const fallbackRef = useRef<number | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const clearTimers = useCallback(() => {
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    if (finishRef.current !== null) window.clearTimeout(finishRef.current);
    if (fallbackRef.current !== null) window.clearTimeout(fallbackRef.current);
    intervalRef.current = null;
    finishRef.current = null;
    fallbackRef.current = null;
  }, []);

  const finish = useCallback(() => {
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    if (fallbackRef.current !== null) window.clearTimeout(fallbackRef.current);
    intervalRef.current = null;
    fallbackRef.current = null;
    setProgress((current) => current === null ? null : 100);
    finishRef.current = window.setTimeout(() => setProgress(null), 180);
  }, []);

  const start = useCallback(() => {
    if (finishRef.current !== null) window.clearTimeout(finishRef.current);
    if (fallbackRef.current !== null) window.clearTimeout(fallbackRef.current);
    finishRef.current = null;
    setProgress((current) => current === null ? 12 : Math.max(current, 12));
    if (intervalRef.current === null) {
      intervalRef.current = window.setInterval(() => {
        setProgress((current) => current === null ? 12 : Math.min(92, current + Math.max(1, (92 - current) * 0.12)));
      }, 350);
    }
    fallbackRef.current = window.setTimeout(finish, 12000);
  }, [finish]);

  useEffect(() => {
    if (previousRoute.current !== routeKey) {
      previousRoute.current = routeKey;
      finish();
    }
  }, [finish, routeKey]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (!target || target.target === "_blank" || target.hasAttribute("download")) return;
      const destination = new URL(target.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      const current = new URL(window.location.href);
      if (destination.pathname === current.pathname && destination.search === current.search) return;
      start();
    }

    function handleSubmit(event: SubmitEvent) {
      const form = event.target instanceof HTMLFormElement ? event.target : null;
      if (form?.hasAttribute("data-navigation-pending")) start();
    }

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);
    window.addEventListener("popstate", start);
    window.addEventListener(NAVIGATION_START_EVENT, start);
    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
      window.removeEventListener("popstate", start);
      window.removeEventListener(NAVIGATION_START_EVENT, start);
      clearTimers();
    };
  }, [clearTimers, start]);

  return (
    <>
      <div
        aria-hidden="true"
        data-navigation-progress
        data-state={progress === null ? "idle" : "loading"}
        className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 origin-left bg-primary shadow-[0_0_10px_color-mix(in_srgb,var(--primary)_75%,transparent)] transition-[transform,opacity] duration-200 ${progress === null ? "opacity-0" : "opacity-100"}`}
        style={{ transform: `scaleX(${(progress ?? 0) / 100})` }}
      />
      <span className="sr-only" role="status" aria-live="polite">
        {progress === null ? "" : "Loading page"}
      </span>
    </>
  );
}
