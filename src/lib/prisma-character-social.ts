import type { PrismaClient } from "@prisma/client";

/**
 * After `prisma generate`, you must restart the dev server. Until then, the
 * global Prisma singleton may be an older instance without these delegates.
 */
export function characterSocialModelsReady(client: PrismaClient): boolean {
  const c = client as unknown as Record<string, { findUnique?: unknown; findMany?: unknown } | undefined>;
  return (
    typeof c.characterLike?.findUnique === "function" &&
    typeof c.characterBookmark?.findUnique === "function" &&
    typeof c.characterComment?.findMany === "function"
  );
}

export const CHARACTER_SOCIAL_CLIENT_HINT =
  "Run `pnpm exec prisma generate`, then restart the dev server (Prisma client was generated after the server started).";

/** CharacterChat / CharacterChatMessage — same stale-client issue as social models. */
export function characterChatModelsReady(client: PrismaClient): boolean {
  const c = client as unknown as Record<string, { findUnique?: unknown } | undefined>;
  return typeof c.characterChat?.findUnique === "function";
}
