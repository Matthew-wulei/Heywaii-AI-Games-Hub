import Link from "next/link";
import { notFound } from "next/navigation";
import { CharacterCard } from "@/components/character/CharacterCard";
import { getCharactersByCategory, getPublishedCharacterCategorySlugs } from "@/lib/queries/content";

function capCategory(slug: string) {
  if (!slug) return "";
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

type Props = { params: Promise<{ categorySlug: string }> };

export default async function CharacterCategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  const normalized = categorySlug.toLowerCase();
  const valid = await getPublishedCharacterCategorySlugs();
  if (!valid.includes(normalized)) notFound();

  const characters = await getCharactersByCategory(normalized, 120);
  const label = capCategory(normalized);

  return (
    <div className="flex flex-col w-full max-w-[1200px] mx-auto pb-12">
      <nav className="flex text-sm text-text-muted mb-6 flex-wrap gap-y-1">
        <Link href="/" className="hover:text-text-primary transition-colors">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/character" className="hover:text-text-primary transition-colors">
          Characters
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text-primary">{label}</span>
      </nav>

      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{label} characters</h1>
        <p className="text-text-secondary text-lg max-w-2xl">
          <Link href="/character" className="text-primary hover:underline">
            All characters
          </Link>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {characters.map((c) => (
          <CharacterCard
            key={c.id}
            slug={c.slug}
            name={c.name}
            avatar={c.avatar}
            categoryLabel={capCategory(c.categorySlug)}
            description={c.description}
          />
        ))}
      </div>

      {characters.length === 0 && (
        <p className="text-text-muted text-center py-16">No characters in this category yet.</p>
      )}
    </div>
  );
}
