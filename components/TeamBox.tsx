"use client";

import { useState, useRef, useEffect } from "react";

// Inline-renamable team box: click → edit → blur/Enter saves. No modal,
// no save button. `onRename` persists; if it rejects we revert.
export function TeamBox({
  name,
  onRename,
  subtitle,
}: {
  name: string;
  onRename: (next: string) => Promise<void> | void;
  subtitle?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setValue(name), [name]);
  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  async function commit() {
    const next = value.trim();
    setEditing(false);
    if (!next || next === name) {
      setValue(name);
      return;
    }
    setSaving(true);
    try {
      await onRename(next);
    } catch {
      setValue(name); // revert on failure
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card border border-base-200 bg-base-100">
      <div className="card-body flex-row items-center gap-3 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {(value || "?").trim()[0]?.toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              ref={inputRef}
              className="input input-sm input-bordered w-full"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") {
                  setValue(name);
                  setEditing(false);
                }
              }}
              maxLength={40}
            />
          ) : (
            <button
              type="button"
              className="block w-full truncate text-left font-medium hover:text-primary"
              onClick={() => setEditing(true)}
              title="Click to rename"
            >
              {value}
            </button>
          )}
          {subtitle && (
            <div className="truncate text-xs opacity-60">{subtitle}</div>
          )}
        </div>
        {saving && <span className="loading loading-spinner loading-xs" />}
      </div>
    </div>
  );
}
