import type { ReactNode } from "react";
import type { Availability, ProjectStatus, TaskStatus } from "@/lib/types";

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-6">
      <div>
        {eyebrow && (
          <div className="text-[11px] uppercase tracking-[0.18em] text-purple-400 mb-1.5">
            {eyebrow}
          </div>
        )}
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h2>
        {subtitle && (
          <p className="text-sm text-[color:var(--text-secondary)] mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex gap-2">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badges / pills
// ---------------------------------------------------------------------------
type Tone = "purple" | "blue" | "cyan" | "green" | "yellow" | "red" | "neutral";

const TONE_CLASS: Record<Tone, string> = {
  purple: "bg-purple-500/15 text-purple-300 border-purple-500/25",
  blue: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  cyan: "bg-cyan-500/15 text-cyan-300 border-cyan-500/25",
  green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  yellow: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  red: "bg-red-500/15 text-red-300 border-red-500/25",
  neutral: "bg-white/5 text-[color:var(--text-secondary)] border-[var(--border-subtle)]",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${TONE_CLASS[tone]}`}
    >
      {children}
    </span>
  );
}

export function StatusPill({
  status,
}: {
  status: ProjectStatus | TaskStatus | Availability;
}) {
  const tone = (() => {
    if (status === "available") return "green";
    if (status === "busy") return "red";
    if (status === "Done") return "green";
    if (status === "In Progress") return "yellow";
    if (status === "Todo") return "neutral";
    if (status === "Active" || status === "Matching") return "cyan";
    return "neutral";
  })();
  return <Badge tone={tone}>{status}</Badge>;
}

// ---------------------------------------------------------------------------
// Score ring
// ---------------------------------------------------------------------------
export function ScoreRing({ score }: { score: number }) {
  const size = 48;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, score)) / 100) * c;
  const color =
    score >= 80
      ? "#10b981"
      : score >= 50
      ? "#f59e0b"
      : "#ef4444";
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--text-primary)"
        fontSize="13"
        fontWeight={600}
      >
        {score}
      </text>
    </svg>
  );
}

export function SkillBadge({ skill }: { skill: string }) {
  return <Badge tone="blue">{skill}</Badge>;
}

// ---------------------------------------------------------------------------
// Loading / empty / error state components
// ---------------------------------------------------------------------------
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-block w-5 h-5 border-2 border-white/15 border-t-purple-400 rounded-full animate-spin ${className}`}
    />
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-[color:var(--text-secondary)]">
      <Spinner className="w-6 h-6" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  detail,
  onRetry,
}: {
  title?: string;
  detail?: string | null;
  onRetry?: () => void;
}) {
  return (
    <div className="card border-red-500/40 p-8 text-center">
      <div className="text-red-400 text-sm font-semibold uppercase tracking-wider mb-2">
        {title}
      </div>
      {detail && (
        <p className="text-[color:var(--text-secondary)] text-sm mb-4">{detail}</p>
      )}
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost px-4 py-1.5 rounded-md text-sm">
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title = "Nothing here yet",
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="card p-10 text-center text-[color:var(--text-secondary)]">
      <div className="text-base font-medium text-[color:var(--text-primary)]">{title}</div>
      {subtitle && <p className="text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat tile
// ---------------------------------------------------------------------------
export function StatTile({
  label,
  value,
  hint,
  accent = "purple",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: Tone;
}) {
  const accentColor = {
    purple: "from-purple-500/30 to-purple-500/0",
    blue: "from-blue-500/30 to-blue-500/0",
    cyan: "from-cyan-500/30 to-cyan-500/0",
    green: "from-emerald-500/30 to-emerald-500/0",
    yellow: "from-amber-500/30 to-amber-500/0",
    red: "from-red-500/30 to-red-500/0",
    neutral: "from-white/10 to-white/0",
  }[accent];
  return (
    <div className="card relative overflow-hidden">
      <div
        className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${accentColor} pointer-events-none`}
      />
      <div className="relative">
        <div className="text-xs uppercase tracking-wider text-[color:var(--text-muted)] mb-2">
          {label}
        </div>
        <div className="text-3xl font-semibold">{value}</div>
        {hint && <div className="text-xs text-[color:var(--text-secondary)] mt-1">{hint}</div>}
      </div>
    </div>
  );
}
