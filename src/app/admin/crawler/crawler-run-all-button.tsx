"use client";

import { useState } from "react";
import { Play } from "lucide-react";

export function CrawlerRunAllButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function runAll() {
    setLoading(true);
    setMessage(null);
    try {
      const r = await fetch("/api/admin/crawler/run-all", {
        method: "POST",
        credentials: "include",
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMessage(typeof data.error === "string" ? data.error : `Error ${r.status}`);
        return;
      }
      const n = Array.isArray(data.results) ? data.results.length : 0;
      setMessage(`Processed ${n} source(s).`);
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
        onClick={() => void runAll()}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/15 disabled:opacity-50 border border-white/10"
      >
        <Play className="w-4 h-4" />
        {loading ? "Running all…" : "Run all sources"}
      </button>
      {message && <p className="text-xs text-text-muted max-w-[280px] text-right">{message}</p>}
    </div>
  );
}
