"use client";

import { useState } from "react";
import { Play } from "lucide-react";

export function CrawlerRunButton({ sourceId }: { sourceId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setMessage(null);
    try {
      const r = await fetch("/api/admin/crawler/run", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMessage(typeof data.error === "string" ? data.error : `Error ${r.status}`);
      } else if (data.skipped) {
        setMessage("Skipped (already imported this source URL).");
      } else {
        setMessage(`Imported pending game: ${data.slug ?? "ok"}`);
      }
    } catch {
      setMessage("Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void run()}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        <Play className="w-4 h-4" />
        {loading ? "Running…" : "Run once"}
      </button>
      {message && <p className="text-xs text-text-muted max-w-[220px] text-right">{message}</p>}
    </div>
  );
}
