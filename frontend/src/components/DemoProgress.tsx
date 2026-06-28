"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DEMO_FLOW } from "@/lib/demo-flow";

export function DemoProgress({ demoParam }: { demoParam: string | null }) {
  const pathname = usePathname();
  const currentIdx = DEMO_FLOW.findIndex((s) => pathname.startsWith(s.slug));

  // Only render when the user is inside the demo flow (?demo=1).
  if (!demoParam) return null;

  return (
    <div className="sticky top-0 md:top-0 z-40 mb-6 border-b border-[var(--border-subtle)] bg-[color:var(--bg-base)]/85 backdrop-blur-md -mx-4 sm:-mx-6 lg:-mx-8 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <span className="text-[10px] uppercase tracking-[0.18em] text-purple-400">
              Demo flow
            </span>
            <span className="text-[10px] text-[color:var(--text-muted)]">
              {currentIdx + 1}/{DEMO_FLOW.length}
            </span>
          </div>
          <div className="flex-1 flex items-center gap-1 overflow-x-auto">
            {DEMO_FLOW.map((s, i) => {
              const active = i === currentIdx;
              const done = i < currentIdx;
              return (
                <Link
                  key={s.slug}
                  href={`${s.slug}?demo=1`}
                  className={`shrink-0 group flex items-center gap-1. py-1 rounded-md text-[11px] transition-colors ${
                    active
                      ? "bg-purple-500/25 text-purple-100 border border-purple-500/40"
                      : done
                      ? "bg-white/5 text-[color:var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-white/10"
                      : "text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)]"
                  }`}
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
      </div>
    </div>
  );
}
