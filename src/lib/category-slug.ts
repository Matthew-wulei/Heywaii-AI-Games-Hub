/** Safe decode for URL path segments (Next may pass partially decoded params). */
export function safeDecodePathSegment(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/**
 * Resolve URL segment to an exact categorySlug from DB list (MySQL collation may be case-sensitive).
 */
export function matchCategorySlugInList(
  slugFromUrl: string,
  validSlugs: string[]
): string | null {
  const decoded = safeDecodePathSegment(slugFromUrl.trim());
  return (
    validSlugs.find((s) => s.toLowerCase() === decoded.toLowerCase()) ?? null
  );
}

/** Raw segment after /character/category/ — not yet matched to DB. */
export function categorySegmentFromPath(pathname: string): string | null {
  const m = pathname.match(/\/character\/category\/([^/?#]+)/);
  return m ? safeDecodePathSegment(m[1]) : null;
}

/** Canonical slug for UI state when URL matches a known category. */
export function canonicalCategoryFromPath(
  pathname: string,
  validSlugs: string[]
): string | null {
  const seg = categorySegmentFromPath(pathname);
  if (!seg) return null;
  return matchCategorySlugInList(seg, validSlugs);
}
