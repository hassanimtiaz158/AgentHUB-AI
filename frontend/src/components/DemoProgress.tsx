"use client";

import Link from "next/link";
import { useDemoPlayer } from "@/lib/demo-player";
import { DEMO_FLOW } from "@/lib/demo-flow";

export function DemoProgress({ demoParam }: { demoParam: string | null }) {
  const player = useDemoPlayer();
  if (!demoParam) return null;

  const { step, isPlaying } = player;
  const currentIdx = step >= 0 ? step : 0;
  const progress = ((currentIdx + 1) / DEMO_FLOW.length) * 100;

  return (
    <div className="sticky top-0 z-40 mb-6 border-b border-[var(--border-subtle)] bg-[color:var(--bg-base)]/85 backdrop-blur-md -mx-4 sm:-mx-6 lg:-mx-8 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center gap-3">
          {/* Step indicator + controls */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <span className="text-[10px] uppercase tracking-[0.18em] text-purple-400">
              Demo
            </span>
            <span className="text-xs font-medium text-[color:var(--text-primary)]">
              Step {currentIdx + 1}
              <span className="text-[color:var(--text-muted)]"> / {DEMO_FLOW.length}</span>
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={player.prev}
              disabled={currentIdx === 0}
              className="focus-ring w-7 h-7 rounded-md flex items-center justify-center text-[color:var(--text-secondary)] hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous step"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={player.toggle}
              disabled={currentIdx >= DEMO_FLOW.length - 1}
              className="focus-ring w-8 h-8 rounded-md flex items-center justify-center text-[color:var(--text-primary)] hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label={isPlaying ? "Pause demo" : "Play demo"}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button
              type="button"
              onClick={player.next}
              disabled={currentIdx >= DEMO_FLOW.length - 1}
              className="focus-ring w-7 h-7 rounded-md flex items-center justify-center text-[color:var(--text-secondary)] hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next step"
            >
              ▶|
            </button>
            <button
              type="button"
              onClick={player.skipToEnd}
              className="focus-ring px-2 h-7 rounded-md flex items-center justify-center text-[10px] uppercase tracking-wider text-[color:var(--text-muted)] hover:bg-white/5 transition-colors"
              aria-label="Skip to end"
            >
              Skip →
            </button>
          </div>

          {/* Step pills */}
          <div className="flex-1 flex items-center gap-1 overflow-x-auto">
            {DEMO_FLOW.map((s, i) => {
              const active = i === currentIdx;
              const done = i < currentIdx;
              return (
                <Link
                  key={s.slug}
                  href={`${s.slug}?demo=1`}
                  onClick={() => player.goTo(i)}
                  className={`shrink-0 group flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-colors ${
                    active
                      ? "bg-purple-500/25 text-purple-100 border border-purple-500/40"
                      : done
                      ? "bg-white/5 text-[color:var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-white/10"
                      : "text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)]"
                  }`}
                  aria-current={active ? "step" : undefined}
                >
                  <span
                    className={`w-4 h-4 rounded-full text-[9px] font-mono flex items-center justify-center ${
                      active
                        ? "bg-purple-500 text-white"
                        : done
                        ? "bg-emerald-500/30 text-emerald-300"
                        : "bg-white/5 text-[color:var(--text-muted)] border border-[var(--border-subtle)]"
                    }`}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span className="hidden md:inline">{s.short}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
