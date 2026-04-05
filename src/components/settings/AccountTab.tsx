"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, Trash2, Globe, Mail, User, ShieldAlert } from "lucide-react";
import { useState } from "react";

export function AccountTab() {
  const { data: session } = useSession();
  const [lang, setLang] = useState("en");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Account & Preferences</h2>
        <p className="text-text-secondary text-sm">
          Manage your personal information, login methods, and language settings.
        </p>
      </div>

      {/* Profile Section */}
      <div className="bg-background-elevated/40 rounded-2xl p-6 border border-white/5 space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4">
          <User className="w-5 h-5 text-primary" />
          Profile Information
        </h3>

        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-background-elevated border border-white/10 overflow-hidden flex-shrink-0">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-primary">
                {session?.user?.name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-white">
              {session?.user?.name || "Anonymous User"}
            </span>
            <span className="text-text-secondary flex items-center gap-2 mt-1">
              <Mail className="w-4 h-4" />
              {session?.user?.email || "No email provided"}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 text-xs text-text-muted mt-3 w-fit border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-status-success"></span>
              Logged in via Auth Provider
            </span>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-background-elevated/40 rounded-2xl p-6 border border-white/5 space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4">
          <Globe className="w-5 h-5 text-blue-400" />
          Preferences
        </h3>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Language / 语言 / 言語
          </label>
          <div className="relative max-w-xs">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="w-full appearance-none bg-background/50 border border-white/10 rounded-xl px-4 py-2.5 text-text-primary focus:ring-2 ring-primary/40 transition-all text-sm outline-none"
            >
              <option value="en">English</option>
              <option value="zh">繁体中文</option>
              <option value="ja">日本語</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-text-muted">
              ▼
            </div>
          </div>
          <p className="text-xs text-text-muted mt-2">
            This will change the interface language across the platform.
          </p>
        </div>
      </div>

      {/* Danger Zone Section */}
      <div className="bg-status-error/5 rounded-2xl p-6 border border-status-error/20 space-y-6">
        <h3 className="text-lg font-bold text-status-error flex items-center gap-2 border-b border-status-error/20 pb-4">
          <ShieldAlert className="w-5 h-5" />
          Danger Zone
        </h3>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h4 className="text-white font-medium">Log Out</h4>
            <p className="text-sm text-text-muted">
              Securely sign out of your account on this device.
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-colors flex items-center gap-2 flex-shrink-0"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pt-4 border-t border-status-error/10">
          <div>
            <h4 className="text-status-error font-medium">Delete Account</h4>
            <p className="text-sm text-text-muted">
              Permanently remove your account and all associated data.
            </p>
          </div>
          <button
            onClick={() => alert("This action is permanent and cannot be undone.")}
            className="px-5 py-2.5 rounded-xl bg-status-error/10 hover:bg-status-error/20 border border-status-error/30 text-status-error text-sm font-medium transition-colors flex items-center gap-2 flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" /> Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
