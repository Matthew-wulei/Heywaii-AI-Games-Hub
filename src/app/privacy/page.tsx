import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | HeyWaii Gameshub",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Privacy Policy</h1>
      <p className="text-sm text-text-secondary leading-relaxed">
        This is a placeholder for HeyWaii Technology Inc. privacy policy. Replace
        this page with your final legal copy before production.
      </p>
      <Link href="/" className="text-sm text-primary hover:underline">
        ← Back to home
      </Link>
    </div>
  );
}
