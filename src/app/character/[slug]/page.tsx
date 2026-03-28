import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCharacterBySlug } from "@/lib/queries/content";

function capCategory(slug: string) {
  if (!slug) return "";
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ch = await getCharacterBySlug(slug);
  if (!ch) return { title: "Character Not Found | HeyWaii Gameshub" };
  const site = "HeyWaii Gameshub";
  const desc = ch.description.slice(0, 160);
  return {
    title: `${ch.name} | ${site}`,
    description: desc,
    openGraph: {
      title: `${ch.name} | ${site}`,
      description: desc,
      images: [ch.avatar],
      type: "profile",
    },
  };
}

export default async function CharacterDetailPage({ params }: Props) {
  const { slug } = await params;
  const ch = await getCharacterBySlug(slug);
  if (!ch) notFound();

  const categoryLabel = capCategory(ch.categorySlug);
  const author = ch.author?.name ?? "HeyWaii community";

  return (
    <div className="flex flex-col w-full max-w-[900px] mx-auto pb-12">
      <nav className="flex text-sm text-text-muted mb-6 flex-wrap gap-y-1">
        <Link href="/" className="hover:text-text-primary transition-colors">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/character" className="hover:text-text-primary transition-colors">
          Characters
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/character/category/${ch.categorySlug}`}
          className="hover:text-text-primary transition-colors"
        >
          {categoryLabel}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text-primary">{ch.name}</span>
      </nav>

      <div className="bg-background-paper rounded-3xl border border-white/5 overflow-hidden flex flex-col md:flex-row gap-8 p-6 md:p-10">
        <div className="w-full md:w-72 flex-shrink-0 mx-auto md:mx-0">
          <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ch.avatar} alt={ch.name} className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs uppercase tracking-wider px-3 py-1 rounded-full bg-white/5 border border-white/10 text-text-secondary">
              {categoryLabel}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{ch.name}</h1>
          <p className="text-sm text-text-muted mb-6">By {author}</p>
          <div className="prose prose-invert max-w-none">
            <p className="text-text-secondary whitespace-pre-wrap leading-relaxed">{ch.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
