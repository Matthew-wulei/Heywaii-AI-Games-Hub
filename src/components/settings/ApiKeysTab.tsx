"use client";

import { Save, Server, ShieldCheck, Zap, Activity } from "lucide-react";

export function ApiKeysTab() {
  const providers = [
    {
      id: "OPENAI",
      name: "OpenAI",
      description: "GPT-4o, GPT-4-turbo, GPT-3.5",
      color: "from-emerald-400 to-emerald-600",
      stability: "99.99%",
      latency: "~0.8s",
    },
    {
      id: "GEMINI",
      name: "Google Gemini",
      description: "Gemini 1.5 Pro, Gemini 1.5 Flash",
      color: "from-blue-400 to-indigo-600",
      stability: "99.95%",
      latency: "~1.1s",
    },
    {
      id: "KIMI",
      name: "Kimi (Moonshot)",
      description: "Moonshot-v1 (8k, 32k, 128k)",
      color: "from-purple-400 to-purple-600",
      stability: "99.90%",
      latency: "~1.5s",
    },
    {
      id: "GLM",
      name: "GLM (Zhipu)",
      description: "GLM-4, GLM-3-Turbo",
      color: "from-cyan-400 to-cyan-600",
      stability: "99.85%",
      latency: "~1.8s",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Model API Keys</h2>
        <p className="text-text-secondary text-sm max-w-3xl">
          Connect your own API keys to bypass platform credit limits. You can also configure a custom Base URL if you are using an API relay or proxy station.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {providers.map((p) => (
          <div
            key={p.id}
            className="border border-white/10 bg-background-elevated/50 rounded-2xl p-5 hover:border-white/20 transition-colors group"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center shadow-lg`}
                >
                  <Server className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{p.name}</h3>
                  <p className="text-xs text-text-muted">{p.description}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-status-success flex items-center gap-1 bg-status-success/10 px-2 py-0.5 rounded-full border border-status-success/20">
                  <ShieldCheck className="w-3 h-3" />
                  {p.stability} Uptime
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-primary flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                  <Zap className="w-3 h-3" />
                  {p.latency} Avg
                </span>
              </div>
            </div>

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 ml-1">
                  API Key
                </label>
                <input
                  type="password"
                  placeholder={`sk-${p.id.toLowerCase()}-...`}
                  className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-2.5 text-text-primary focus:ring-2 ring-primary/40 transition-all font-mono text-sm placeholder:text-white/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 ml-1">
                  Custom Base URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://api.proxy.com/v1"
                  className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-2.5 text-text-primary focus:ring-2 ring-primary/40 transition-all text-sm placeholder:text-white/20"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
