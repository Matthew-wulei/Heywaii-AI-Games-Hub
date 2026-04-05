import Link from "next/link";
import { Suspense } from "react";
import { Pagination } from "@/components/ui/Pagination";
import { InfiniteCharacterList } from "@/components/character/InfiniteCharacterList";
import { CategoryFilter } from "@/components/character/CategoryFilter";
import { getPublishedCharacters, getPublishedCharactersCount, getPublishedCharacterCategorySlugs } from "@/lib/queries/content";

function capCategory(slug: string) {
  if (!slug) return "";
  if (slug.toLowerCase() === "other") return "All";
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

export default async function CharactersIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = typeof params.page === 'string' ? parseInt(params.page) || 1 : 1;
  const sort = typeof params.sort === 'string' && params.sort === 'trending' ? 'trending' : 'recent';
  const gender = typeof params.gender === 'string' && (params.gender === 'Male' || params.gender === 'Female') ? params.gender : undefined;
  const isNsfw = typeof params.nsfw === 'string' ? params.nsfw === 'true' : undefined;
  const q = typeof params.q === 'string' ? params.q : undefined;

  const pageSize = 50; // Total size per 'page' view
  const initialLoadSize = 20; // Load 20 on first render
  const skip = (page - 1) * pageSize;

  const [characters, totalCount, categories] = await Promise.all([
    getPublishedCharacters(initialLoadSize, skip, sort, gender, isNsfw, q),
    getPublishedCharactersCount(gender, isNsfw, q),
    getPublishedCharacterCategorySlugs(),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="flex flex-col w-full pb-12">
      <nav className="flex text-sm text-text-muted mb-6">
        <Link href="/" className="hover:text-text-primary transition-colors">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text-primary">Characters</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Characters</h1>
        <p className="text-text-secondary text-lg max-w-2xl">
          Discover AI personas for your next adventure. Browse by category or open a profile.
        </p>
      </div>

      {categories.length > 0 && (
        <Suspense
          fallback={
            <div className="h-16 mb-8 rounded-xl bg-white/5 animate-pulse" />
          }
        >
          <CategoryFilter categories={categories} />
        </Suspense>
      )}

      <InfiniteCharacterList initialCharacters={characters} />

      <Suspense
        fallback={
          <div className="h-12 mt-12 rounded-xl bg-white/5 animate-pulse max-w-md mx-auto" />
        }
      >
        <Pagination currentPage={page} totalPages={totalPages} />
      </Suspense>

      {characters.length === 0 && (
        <p className="text-text-muted text-center py-16">No published characters matching criteria found.</p>
      )}
    </div>
  );
}
