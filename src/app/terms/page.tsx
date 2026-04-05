import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | HeyWaii Gameshub",
};

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Terms of Service</h1>
      <p className="text-sm text-text-secondary leading-relaxed">
        This is a placeholder for HeyWaii Technology Inc. terms of service. Replace
        this page with your final legal copy before production.
      </p>
      <Link href="/" className="text-sm text-primary hover:underline">
        ← Back to home
      </Link>
    </div>
  );
}
