"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";

// Wraps any card and renders a one-tap "Export PNG" button under it.
// html-to-image renders the DOM node to a PNG the admin can drop in a chat.
export function CardExportButton({
  children,
  filename = "matchday-card.png",
}: {
  children: React.ReactNode;
  filename?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  async function exportPng() {
    if (!ref.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(ref.current, {
        pixelRatio: 2,
        cacheBust: true,
        // White-ish backdrop so transparent corners don't look odd in chats.
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("PNG export failed", err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={ref} className="inline-block">
        {children}
      </div>
      <button
        type="button"
        className="btn btn-sm btn-outline"
        onClick={exportPng}
        disabled={busy}
      >
        {busy ? (
          <span className="loading loading-spinner loading-xs" />
        ) : (
          <>⬇ Export PNG</>
        )}
      </button>
    </div>
  );
}
