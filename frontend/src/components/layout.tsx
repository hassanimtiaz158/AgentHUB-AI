"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { healthCheck } from "@/lib/api";

const NAV = [
  { href: "/", label: "Home", icon: "grid" },
  { href: "/dashboard", label: "Dashboard", icon: "layers" },
  { href: "/post-project", label: "New project", icon: "plus" },
  { href: "/analysis", label: "Analysis", icon: "sparkles" },
  { href: "/matches", label: "Matches", icon: "users" },
  { href: "/workspace", label: "Workspace", icon: "layers" },
  { href: "/tasks", label: "Task board", icon: "kanban" },
  { href: "/routing", label: "Aicoo routing", icon: "route" },
  { href: "/standup", label: "Standup", icon: "megaphone" },
] as const;

function Icon({ name }: { name: string }) {
  const cls = "w-4 h-4";
  switch (name) {
    case "grid":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "plus":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      );
    case "sparkles":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 2l1.5 4.5L15 8l-4.5 1.5L9 14l-1.5-4.5L3 8l4.5-1.5L9 2zm9 10l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" />
        </svg>
      );
    case "users":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20c0-3 3-5 6.5-5s6.5 2 6.5 5" strokeLinecap="round" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M16 14c3 .3 5 2.1 5 4.5" strokeLinecap="round" />
        </svg>
      );
    case "layers":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M12 3l9 5-9 5-9-5 9-5z" />
          <path d="M3 13l9 5 9-5M3 17l9 5 9-5" />
        </svg>
      );
    case "kanban":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="4" width="5" height="16" rx="1" />
          <rect x="10" y="4" width="5" height="10" rx="1" />
          <rect x="17" y="4" width="4" height="13" rx="1" />
        </svg>
      );
    case "route":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="6" cy="19" r="2" />
          <circle cx="18" cy="5" r="2" />
          <path d="M8 19h6a4 4 0 0 0 4-4V8" strokeLinecap="round" />
        </svg>
      );
    case "megaphone":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M3 10v4l11 5V5L3 10z" />
          <path d="M18 8a4 4 0 0 1 0 8M21 6a7 7 0 0 1 0 12" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

/* ── Hamburger / close icon ──────────────────────────────────────────── */
function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      {open ? (
        /* X icon */
        <>
          <path d="M6 6l12 12M6 18L18 6" />
        </>
      ) : (
        /* Three lines */
        <>
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
        </>
      )}
    </svg>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [backendStatus, setBackendStatus] = useState<"online" | "demo" | "loading">("loading");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let active = true;
    healthCheck().then((res) => {
      if (!active) return;
      setBackendStatus(res.data?.status === "ok" ? "online" : "demo");
    });
    return () => {
      active = false;
    };
  }, []);

  // Close sidebar on route change (mobile-friendly)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="relative z-10 flex min-h-screen">
      {/* ── Collapsed sidebar rail (always visible on md+) ──────────── */}
      <aside
        className={`hidden md:flex shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[color:var(--bg-elevated)]/60 backdrop-blur-md transition-all duration-300 ease-[var(--ease-out)] ${
          sidebarOpen ? "w-60" : "w-14"
        }`}
      >
        {/* Toggle / Brand */}
        <div className={`flex items-center border-b border-[var(--border-subtle)] ${sidebarOpen ? "px-5 py-5" : "px-3 py-5 justify-center"}`}>
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="flex items-center gap-2 text-[color:var(--text-secondary)] hover:text-white transition-colors"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <HamburgerIcon open={sidebarOpen} />
            {sidebarOpen && (
              <div className="ml-1 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 flex items-center justify-center font-bold text-white text-sm">
                  A
                </div>
                <div>
                  <div className="font-semibold tracking-tight text-sm text-white">AgentHub AI</div>
                  <div className="text-[9px] uppercase tracking-wider text-cyan-400/70">powered by Aicoo</div>
                </div>
              </div>
            )}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center gap-3 rounded-lg text-sm transition-colors ${
                  sidebarOpen ? "px-3 py-2" : "px-0 py-2 justify-center"
                } ${
                  active
                    ? "bg-purple-500/20 text-purple-200"
                    : "text-[color:var(--text-secondary)] hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon name={item.icon} />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Backend status */}
        <div className={`border-t border-[var(--border-subtle)] text-xs text-[color:var(--text-muted)] ${sidebarOpen ? "px-5 py-4" : "px-2 py-4 text-center"}`}>
          <div className={`flex items-center gap-2 ${sidebarOpen ? "" : "justify-center"}`}>
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                backendStatus === "online"
                  ? "bg-emerald-400"
                  : backendStatus === "demo"
                  ? "bg-amber-400"
                  : "bg-zinc-500 animate-pulse"
              }`}
            />
            {sidebarOpen && (
              <span>
                {backendStatus === "online"
                  ? "Backend connected"
                  : backendStatus === "demo"
                  ? "Demo mode"
                  : "Checking backend…"}
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* ── Mobile header ──────────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 glass border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 flex items-center justify-center font-bold text-white text-sm">
              A
            </div>
            <span className="font-semibold">AgentHub AI</span>
          </Link>
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="btn-ghost px-3 py-1.5 rounded-md text-sm"
            aria-label="Toggle menu"
          >
            <HamburgerIcon open={sidebarOpen} />
          </button>
        </div>
        {sidebarOpen && (
          <div className="border-t border-[var(--border-subtle)] px-3 py-2">
            {NAV.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                    active ? "bg-purple-500/20 text-purple-200" : "text-[color:var(--text-secondary)]"
                  }`}
                >
                  <Icon name={item.icon} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Main content ───────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 md:pt-0 pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
