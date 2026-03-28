import Link from "next/link";
import { CharacterCard } from "@/components/character/CharacterCard";
import { getPublishedCharacters, getPublishedCharacterCategorySlugs } from "@/lib/queries/content";

function capCategory(slug: string) {
  if (!slug) return "";
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

export default async function CharactersIndexPage() {
  const [characters, categories] = await Promise.all([
    getPublishedCharacters(120),
    getPublishedCharacterCategorySlugs(),
  ]);

  return (
    <div className="flex flex-col w-full max-w-[1200px] mx-auto pb-12">
      <nav className="flex text-sm text-text-muted mb-6">
        <Link href="/" className="hover:text-text-primary transition-colors">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text-primary">Characters</span>
      </nav>

      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Characters</h1>
        <p className="text-text-secondary text-lg max-w-2xl">
          Discover AI personas for your next adventure. Browse by category or open a profile.
        </p>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10">
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/character/category/${cat}`}
              className="px-4 py-2 rounded-xl bg-background-paper border border-white/10 text-sm text-text-secondary hover:border-primary/40 hover:text-primary transition-colors"
            >
              {capCategory(cat)}
            </Link>
          ))}
        </div>
      )}

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
        <p className="text-text-muted text-center py-16">No published characters yet.</p>
      )}
    </div>
  );
}
