"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

const subscribeToHydration = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const dark = mounted && resolvedTheme === "dark";
  const requestedTheme = useRef<"light" | "dark">("light");

  useEffect(() => {
    if (!mounted) return;
    requestedTheme.current = dark ? "dark" : "light";
  }, [dark, mounted]);

  function toggleTheme() {
    const nextTheme = requestedTheme.current === "dark" ? "light" : "dark";
    requestedTheme.current = nextTheme;
    setTheme(nextTheme);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={`Switch to ${dark ? "light" : "dark"} theme`}
      onClick={toggleTheme}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
