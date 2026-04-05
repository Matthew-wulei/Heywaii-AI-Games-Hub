import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { Settings } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=/settings");
  }

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto pb-12">
      <div className="mb-8 border-b border-white/5 pb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary" />
          Settings
        </h1>
        <p className="text-text-secondary mt-2">
          Manage your account, API configurations, and billing history.
        </p>
      </div>

      <SettingsTabs />
    </div>
  );
}
