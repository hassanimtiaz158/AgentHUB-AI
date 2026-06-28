"use client";

import { useState, type KeyboardEvent } from "react";

export function SkillInput({
  skills,
  onChange,
}: {
  skills: string[];
  onChange: (skills: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function commit(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (skills.map((s) => s.toLowerCase()).includes(trimmed.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...skills, trimmed]);
    setDraft("");
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && !draft && skills.length > 0) {
      onChange(skills.slice(0, -1));
    }
  }

  return (
    <div className="input flex flex-wrap items-center gap-1.5 py-2 min-h-[42px]">
      {skills.map((s) => (
        <span
          key={s}
          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25"
        >
          {s}
          <button
            type="button"
            onClick={() => onChange(skills.filter((x) => x !== s))}
            className="text-purple-300/70 hover:text-purple-200"
            aria-label={`Remove ${s}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => commit(draft)}
        placeholder={skills.length ? "Add another…" : "Type a skill and press Enter…"}
        className="flex-1 min-w-[140px] bg-transparent outline-none text-sm placeholder:text-[color:var(--text-muted)]"
      />
    </div>
  );
}
