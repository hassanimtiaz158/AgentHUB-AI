"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { DEMO_FLOW } from "./demo-flow";

interface DemoPlayerValue {
  /** Whether the user is in demo mode (?demo=1). */
  isDemo: boolean;
  /** Index into DEMO_FLOW of the step the player is currently on, or -1. */
  step: number;
  /** Whether the demo is auto-advancing. */
  isPlaying: boolean;
  advance: () => void;
  goTo: (index: number) => void;
  next: () => void;
  prev: () => void;
  pause: () => void;
  resume: () => void;
  toggle: () => void;
  skipToEnd: () => void;
}

const DemoPlayerContext = createContext<DemoPlayerValue | null>(null);

// Per-destination step delay (ms), matching the original page-level setTimeouts:
// post-project(entry=0), analysis(1500), matches(2000), routing(0), workspace(3000), standup(final=0).
const STEP_DELAYS = [0, 1500, 2000, 0, 3000, 0];

function stepForPathname(pathname: string): number {
  return DEMO_FLOW.findIndex((s) => pathname.startsWith(s.slug));
}

export function DemoProvider({
  children,
  isDemo,
}: {
  children: ReactNode;
  isDemo: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [step, setStep] = useState(() => stepForPathname(pathname));
  const [isPlaying, setIsPlaying] = useState(isDemo);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setStep(stepForPathname(pathname)), [pathname]);

  const navigateTo = (index: number) => {
    if (index < 0 || index >= DEMO_FLOW.length) return;
    setStep(index);
    router.replace(`${DEMO_FLOW[index].slug}?demo=1`);
  };

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  // Auto-advance timer: only when playing and the current step has a delay.
  useEffect(() => {
    clearTimer();
    if (!isDemo || !isPlaying) return;
    const delay = STEP_DELAYS[step];
    if (!delay || step >= DEMO_FLOW.length - 1) return;
    timer.current = setTimeout(() => {
      navigateTo(step + 1);
    }, delay);
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, isPlaying, isDemo]);

  // Keyboard navigation: only active in demo mode.
  useEffect(() => {
    if (!isDemo) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        if (step < DEMO_FLOW.length - 1) navigateTo(step + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (step > 0) navigateTo(step - 1);
      } else if (e.key === "Escape") {
        setIsPlaying(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isDemo, step]);

  const value = useMemo<DemoPlayerValue>(
    () => ({
      isDemo,
      step,
      isPlaying,
      advance: () => {
        if (step < DEMO_FLOW.length - 1) navigateTo(step + 1);
      },
      goTo: navigateTo,
      next: () => {
        if (step < DEMO_FLOW.length - 1) navigateTo(step + 1);
      },
      prev: () => {
        if (step > 0) navigateTo(step - 1);
      },
      pause: () => setIsPlaying(false),
      resume: () => {
        if (step >= DEMO_FLOW.length - 1) return;
        setIsPlaying(true);
      },
      toggle: () => setIsPlaying((p) => !p),
      skipToEnd: () => {
        setIsPlaying(false);
        navigateTo(DEMO_FLOW.length - 1);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step, isPlaying, isDemo]
  );

  return (
    <DemoPlayerContext.Provider value={value}>{children}</DemoPlayerContext.Provider>
  );
}

export function useDemoPlayer(): DemoPlayerValue {
  const ctx = useContext(DemoPlayerContext);
  if (!ctx) throw new Error("useDemoPlayer must be used inside DemoProvider");
  return ctx;
}
