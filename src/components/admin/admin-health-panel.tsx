"use client";

import { useCallback, useState } from "react";
import { RefreshCw } from "lucide-react";

type HealthPayload = {
  openai?: { ok: boolean; pingMs: number | null; configured: boolean };
  anthropic?: { ok: boolean; pingMs: number | null; configured: boolean };
  error?: string;
};

export function AdminHealthPanel() {
  const [data, setData] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/health", { credentials: "include" });
      const j = (await r.json()) as HealthPayload;
      if (!r.ok) {
        setData({ error: typeof j.error === "string" ? j.error : `HTTP ${r.status}` });
      } else {
        setData(j);
      }
    } catch {
      setData({ error: "Request failed" });
    } finally {
      setLoading(false);
    }
  }, []);

  const openai = data?.openai;
  const anthropic = data?.anthropic;

  return (
    <div className="bg-background-paper rounded-2xl border border-white/5 p-6 shadow-xl">
      <h3 className="text-lg font-bold text-white mb-4 border-b border-white/5 pb-3">API Health Check</h3>

      {data?.error && (
        <p className="text-sm text-status-error mb-4">{data.error}</p>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-xl bg-background-elevated border border-white/5">
          <div className="flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full ${
                openai?.ok ? "bg-status-success" : openai?.configured === false ? "bg-text-muted" : "bg-status-error"
              }`}
            />
            <span className="text-sm font-medium text-text-primary">OpenAI API</span>
          </div>
          <span className="text-xs text-text-muted">
            {!openai
              ? "—"
              : !openai.configured
                ? "Not configured"
                : openai.pingMs != null
                  ? `${openai.pingMs}ms`
                  : openai.ok
                    ? "ok"
                    : "failed"}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-background-elevated border border-white/5 opacity-70">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-text-muted" />
            <span className="text-sm font-medium text-text-primary">Anthropic API</span>
          </div>
          <span className="text-xs text-text-muted">
            {anthropic?.configured ? (anthropic.ok ? `${anthropic.pingMs ?? 0}ms` : "failed") : "Not wired"}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => void run()}
        disabled={loading}
        className="w-full mt-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Running…" : "Run diagnostics"}
      </button>
    </div>
  );
}
