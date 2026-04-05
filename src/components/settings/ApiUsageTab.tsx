"use client";

import { useState } from "react";
import { Activity, Gamepad2, Users, HelpCircle, BarChart3, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterType = "all" | "games" | "characters" | "else";

export function ApiUsageTab() {
  const [filter, setFilter] = useState<FilterType>("all");

  const stats = [
    { label: "Total Requests", value: "24,592", icon: Activity, color: "text-blue-400" },
    { label: "Tokens Used", value: "1.2M", icon: BarChart3, color: "text-emerald-400" },
    { label: "Avg Latency", value: "1.02s", icon: Clock, color: "text-purple-400" },
  ];

  const history = [
    { id: 1, type: "games", name: "Text RPG Adventure", model: "GPT-4o", tokens: "4,050", latency: "1.4s", date: "2 mins ago" },
    { id: 2, type: "characters", name: "Anime Maid", model: "Gemini Pro", tokens: "850", latency: "0.8s", date: "15 mins ago" },
    { id: 3, type: "characters", name: "Cyberpunk Hacker", model: "Kimi 8k", tokens: "1,200", latency: "1.2s", date: "1 hour ago" },
    { id: 4, type: "else", name: "System Config", model: "GLM-4", tokens: "320", latency: "0.5s", date: "3 hours ago" },
    { id: 5, type: "games", name: "Space Trader UI", model: "GPT-3.5", tokens: "2,100", latency: "0.9s", date: "Yesterday" },
  ];

  const filteredHistory = history.filter((h) => filter === "all" || h.type === filter);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Usage & History</h2>
        <p className="text-text-secondary text-sm max-w-3xl">
          Track your API consumption, token usage, and history across different platform features.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="border border-white/5 bg-background-elevated/40 rounded-2xl p-6 flex flex-col gap-2 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <s.icon className={`w-12 h-12 ${s.color}`} />
            </div>
            <span className="text-text-secondary font-medium text-sm z-10">{s.label}</span>
            <span className={`text-4xl font-bold ${s.color} z-10`}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <h3 className="text-lg font-bold text-white">Recent Activity</h3>
          <div className="flex items-center bg-background/50 rounded-xl p-1 border border-white/10 overflow-x-auto max-w-full">
            <FilterButton
              label="All"
              active={filter === "all"}
              onClick={() => setFilter("all")}
              icon={Activity}
            />
            <FilterButton
              label="Games"
              active={filter === "games"}
              onClick={() => setFilter("games")}
              icon={Gamepad2}
            />
            <FilterButton
              label="Characters"
              active={filter === "characters"}
              onClick={() => setFilter("characters")}
              icon={Users}
            />
            <FilterButton
              label="Else"
              active={filter === "else"}
              onClick={() => setFilter("else")}
              icon={HelpCircle}
            />
          </div>
        </div>

        <div className="bg-background-elevated/30 rounded-xl border border-white/5 overflow-hidden">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/5 border-b border-white/5 text-text-muted font-medium">
              <tr>
                <th className="px-6 py-4">Resource</th>
                <th className="px-6 py-4">Model</th>
                <th className="px-6 py-4 hidden sm:table-cell">Tokens</th>
                <th className="px-6 py-4 hidden md:table-cell">Latency</th>
                <th className="px-6 py-4 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-text-secondary">
              {filteredHistory.map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <span
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        row.type === "games" && "bg-emerald-500/10 text-emerald-400",
                        row.type === "characters" && "bg-blue-500/10 text-blue-400",
                        row.type === "else" && "bg-purple-500/10 text-purple-400"
                      )}
                    >
                      {row.type === "games" && <Gamepad2 className="w-4 h-4" />}
                      {row.type === "characters" && <Users className="w-4 h-4" />}
                      {row.type === "else" && <HelpCircle className="w-4 h-4" />}
                    </span>
                    <span className="font-medium text-text-primary truncate max-w-[120px] sm:max-w-[200px]">
                      {row.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-white/5 px-2 py-1 rounded-md text-xs">{row.model}</span>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell font-mono">{row.tokens}</td>
                  <td className="px-6 py-4 hidden md:table-cell font-mono text-status-success">
                    {row.latency}
                  </td>
                  <td className="px-6 py-4 text-right text-text-muted text-xs">{row.date}</td>
                </tr>
              ))}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                    No activity found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FilterButton({
  label,
  active,
  onClick,
  icon: Icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: any;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
        active
          ? "bg-white/10 text-white shadow-sm"
          : "text-text-secondary hover:text-white hover:bg-white/5"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
