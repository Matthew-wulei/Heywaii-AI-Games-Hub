import { redirect } from "next/navigation";
import Link from "next/link";
import { Bot, ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CrawlerRunButton } from "./crawler-run-button";

export default async function AdminCrawlerPage() {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;
  if (user?.role !== "ADMIN") {
    redirect("/");
  }

  const sources = await prisma.crawlerSource.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto pb-12">
      <div className="mb-8 flex flex-col gap-4 border-b border-white/5 pb-6">
        <Link
          href="/admin/api-config"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to API config
        </Link>
        <div className="flex items-center gap-3">
          <Bot className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-white">Crawler</h1>
            <p className="text-text-secondary text-sm mt-1">
              MVP import: fetch a source URL, parse a title, create a pending game. Configure sources in the
              database or seed script.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {sources.map((s) => (
          <div
            key={s.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background-paper rounded-2xl border border-white/5 p-6"
          >
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-white mb-1">{s.name}</h2>
              <p className="text-sm text-text-muted break-all">{s.entryUrl}</p>
              {s.itemSelector && (
                <p className="text-xs text-text-muted mt-2">Selector: {s.itemSelector}</p>
              )}
            </div>
            <CrawlerRunButton sourceId={s.id} />
          </div>
        ))}
      </div>

      {sources.length === 0 && (
        <p className="text-text-muted text-center py-16">
          No crawler sources. Add rows to <code className="text-text-secondary">CrawlerSource</code> or run{" "}
          <code className="text-text-secondary">pnpm db:seed</code>.
        </p>
      )}
    </div>
  );
}
