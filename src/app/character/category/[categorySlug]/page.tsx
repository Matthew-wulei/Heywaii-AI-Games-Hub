import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Pagination } from "@/components/ui/Pagination";
import { InfiniteCharacterList } from "@/components/character/InfiniteCharacterList";
import { CategoryFilter } from "@/components/character/CategoryFilter";
import { getCharactersByCategory, getCharactersByCategoryCount, getPublishedCharacterCategorySlugs } from "@/lib/queries/content";
import { matchCategorySlugInList } from "@/lib/category-slug";

function capCategory(slug: string) {
  if (!slug) return "";
  if (slug.toLowerCase() === "other") return "All";
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

type Props = { 
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CharacterCategoryPage({ params, searchParams }: Props) {
  const { categorySlug } = await params;
  const sParams = await searchParams;

  const valid = await getPublishedCharacterCategorySlugs();
  const canonical = matchCategorySlugInList(categorySlug, valid);
  if (!canonical) notFound();

  const page = typeof sParams.page === 'string' ? parseInt(sParams.page) || 1 : 1;
  const sort = typeof sParams.sort === 'string' && sParams.sort === 'trending' ? 'trending' : 'recent';
  const gender = typeof sParams.gender === 'string' && (sParams.gender === 'Male' || sParams.gender === 'Female') ? sParams.gender : undefined;
  const isNsfw = typeof sParams.nsfw === 'string' ? sParams.nsfw === 'true' : undefined;
  const q = typeof sParams.q === 'string' ? sParams.q : undefined;

  const pageSize = 50; // Total size per 'page' view
  const initialLoadSize = 20; // Load 20 on first render
  const skip = (page - 1) * pageSize;

  const [characters, totalCount, categories] = await Promise.all([
    getCharactersByCategory(canonical, initialLoadSize, skip, sort, gender, isNsfw, q),
    getCharactersByCategoryCount(canonical, gender, isNsfw, q),
    getPublishedCharacterCategorySlugs(),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const label = capCategory(canonical);

  return (
    <div className="flex flex-col w-full pb-12">
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

      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{label} characters</h1>
        <p className="text-text-secondary text-lg max-w-2xl">
          <Link href="/character" className="text-primary hover:underline">
            All characters
          </Link>
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

      <InfiniteCharacterList
        initialCharacters={characters}
        categorySlug={canonical}
      />

      <Suspense
        fallback={
          <div className="h-12 mt-12 rounded-xl bg-white/5 animate-pulse max-w-md mx-auto" />
        }
      >
        <Pagination currentPage={page} totalPages={totalPages} />
      </Suspense>

      {characters.length === 0 && (
        <p className="text-text-muted text-center py-16">No characters matching criteria found.</p>
      )}
    </div>
  );
}
