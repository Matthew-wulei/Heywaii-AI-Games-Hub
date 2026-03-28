import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, Server, Save, CheckCircle2, Power } from "lucide-react";
import { auth } from "@/auth";
import { AdminHealthPanel } from "@/components/admin/admin-health-panel";

export default async function AdminApiConfigPage() {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;
  const isAdmin = user?.role === "ADMIN";

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto pb-12">
      <div className="mb-8 flex items-center justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-status-warning" />
            Admin Control Panel
          </h1>
          <p className="text-text-secondary">Configure official platform API keys and billing rules.</p>
          <Link href="/admin/crawler" className="text-sm text-primary hover:underline mt-2 inline-block">
            Crawler admin →
          </Link>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-status-success/10 border border-status-success/20 rounded-xl text-status-success font-medium text-sm">
          <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
          System Operational
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Model Configs */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white mb-4">Official Model Endpoints</h2>
          
          {/* OpenAI Config Card */}
          <div className="bg-background-paper rounded-2xl border border-white/5 p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-status-success/20 text-status-success border border-status-success/30 flex items-center gap-1.5">
                <Power className="w-3 h-3" /> Active
              </span>
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
                <Server className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">OpenAI</h3>
                <p className="text-text-muted text-sm">GPT-4o, GPT-3.5-Turbo</p>
              </div>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">API Key</label>
                <div className="relative">
                  <input
                    type="password"
                    defaultValue="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-background-elevated border border-white/10 rounded-xl px-4 py-2.5 text-text-primary focus:ring-2 ring-primary/50 transition-all font-mono text-sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Base URL</label>
                  <input
                    type="text"
                    defaultValue="https://api.openai.com/v1"
                    className="w-full bg-background-elevated border border-white/10 rounded-xl px-4 py-2.5 text-text-primary focus:ring-2 ring-primary/50 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Platform Cost (Coins)</label>
                  <input
                    type="number"
                    defaultValue="10"
                    className="w-full bg-background-elevated border border-white/10 rounded-xl px-4 py-2.5 text-text-primary focus:ring-2 ring-primary/50 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/5 mt-6">
                <button type="button" className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save Config
                </button>
              </div>
            </form>
          </div>

          {/* Anthropic Config Card (Inactive) */}
          <div className="bg-background-paper rounded-2xl border border-white/5 p-6 shadow-xl relative overflow-hidden group opacity-70">
            <div className="absolute top-0 right-0 p-4">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-text-muted/20 text-text-muted border border-text-muted/30 flex items-center gap-1.5">
                <Power className="w-3 h-3" /> Disabled
              </span>
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center flex-shrink-0">
                <Server className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Anthropic</h3>
                <p className="text-text-muted text-sm">Claude 3.5 Sonnet</p>
              </div>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">API Key</label>
                <input
                  type="password"
                  placeholder="sk-ant-..."
                  className="w-full bg-background-elevated border border-white/10 rounded-xl px-4 py-2.5 text-text-primary focus:ring-2 ring-primary/50 transition-all font-mono text-sm"
                />
              </div>
              
              <div className="flex justify-end pt-4 border-t border-white/5 mt-6">
                <button type="button" className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors">
                  Enable Model
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Global Settings & Stats */}
        <div className="space-y-6">
          <AdminHealthPanel />
          
          <div className="bg-background-paper rounded-2xl border border-white/5 p-6 shadow-xl">
             <h3 className="text-lg font-bold text-white mb-4 border-b border-white/5 pb-3">Cost Management</h3>
             <div className="space-y-4">
               <div>
                 <div className="flex justify-between text-sm mb-1">
                   <span className="text-text-secondary">Monthly Budget</span>
                   <span className="text-white font-medium">$450 / $1000</span>
                 </div>
                 <div className="w-full h-2 rounded-full bg-background-elevated overflow-hidden">
                   <div className="h-full bg-primary w-[45%] rounded-full" />
                 </div>
               </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}