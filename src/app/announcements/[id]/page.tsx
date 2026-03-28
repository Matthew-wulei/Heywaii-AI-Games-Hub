import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAnnouncementById } from "@/lib/queries/content";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const a = await getAnnouncementById(id);
  if (!a) return { title: "Announcement | HeyWaii Gameshub" };
  return {
    title: `${a.title} | HeyWaii Gameshub`,
    description: a.body.slice(0, 160).replace(/\s+/g, " "),
  };
}

export default async function AnnouncementDetailPage({ params }: Props) {
  const { id } = await params;
  const a = await getAnnouncementById(id);
  if (!a) notFound();

  const dateStr = a.publishedAt
    ? a.publishedAt.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto pb-12">
      <nav className="flex text-sm text-text-muted mb-6">
        <Link href="/" className="hover:text-text-primary transition-colors">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/announcements" className="hover:text-text-primary transition-colors">
          Announcements
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text-primary line-clamp-1">{a.title}</span>
      </nav>

      <article className="bg-background-paper rounded-2xl border border-white/5 p-6 md:p-10">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm text-text-muted">{dateStr}</span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-text-secondary">
            {a.type}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">{a.title}</h1>
        <div className="text-text-secondary whitespace-pre-wrap leading-relaxed">{a.body}</div>
      </article>
    </div>
  );
}
