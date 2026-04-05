"use client";

import { useState } from "react";
import { ApiKeysTab } from "./ApiKeysTab";
import { ApiUsageTab } from "./ApiUsageTab";
import { AccountTab } from "./AccountTab";
import { KeyRound, Activity, User } from "lucide-react";
import { cn } from "@/lib/utils";

type TabId = "api-keys" | "usage" | "account";

export function SettingsTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("api-keys");

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start">
      {/* Sidebar Nav */}
      <aside className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
        <button
          onClick={() => setActiveTab("api-keys")}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal",
            activeTab === "api-keys"
              ? "bg-primary/10 text-primary"
              : "text-text-secondary hover:bg-white/5 hover:text-white"
          )}
        >
          <KeyRound className="w-5 h-5" />
          API Keys
        </button>
        <button
          onClick={() => setActiveTab("usage")}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal",
            activeTab === "usage"
              ? "bg-primary/10 text-primary"
              : "text-text-secondary hover:bg-white/5 hover:text-white"
          )}
        >
          <Activity className="w-5 h-5" />
          Usage & History
        </button>
        <button
          onClick={() => setActiveTab("account")}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal",
            activeTab === "account"
              ? "bg-primary/10 text-primary"
              : "text-text-secondary hover:bg-white/5 hover:text-white"
          )}
        >
          <User className="w-5 h-5" />
          Account
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 w-full">
        <div className="bg-background-paper border border-white/5 rounded-2xl p-6 shadow-xl min-h-[500px]">
          {activeTab === "api-keys" && <ApiKeysTab />}
          {activeTab === "usage" && <ApiUsageTab />}
          {activeTab === "account" && <AccountTab />}
        </div>
      </main>
    </div>
  );
}
