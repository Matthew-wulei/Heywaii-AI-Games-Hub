import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCharacterBySlug,
  getCharacterCommentsForDetail,
  getCharacterInteractionFlags,
} from "@/lib/queries/content";
import { auth } from "@/auth";
import { TagChip } from "@/components/ui/TagChip";
import { StatCounter } from "@/components/ui/StatCounter";
import { MessageCircle, Heart, Clock, Image as ImageIcon, UserPlus } from "lucide-react";
import { CharacterDetailClient } from "./CharacterDetailClient";
import { InteractionButtons } from "@/components/character/InteractionButtons";
import { CharacterComments } from "@/components/character/CharacterComments";
import { IframeHtml } from "@/components/character/IframeHtml";

function capCategory(slug: string) {
  if (!slug) return "";
  if (slug.toLowerCase() === "other") return "All";
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ch = await getCharacterBySlug(slug);
  if (!ch) return { title: "Character Not Found | HeyWaii Gameshub" };
  const site = "HeyWaii Gameshub";
  const rawDesc = (ch.introduction?.trim() || ch.description || "").slice(0, 400);
  const desc = rawDesc.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
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

  const session = await auth();
  const userId = session?.user?.id;
  const isSignedIn = Boolean(userId);

  const [flags, commentRows] = await Promise.all([
    userId ? getCharacterInteractionFlags(userId, ch.id) : Promise.resolve({ liked: false, bookmarked: false }),
    getCharacterCommentsForDetail(ch.id),
  ]);

  const initialComments = commentRows.map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
    authorName: c.user.name || "Member",
    authorImage: c.user.image,
  }));

  const categoryLabel = capCategory(ch.categorySlug);
  const authorName = ch.creatorName || ch.author?.name || "HeyWaii community";
  const author = ["rubii", "genraton", "crushon", "taptale"].some((brand) =>
    authorName.toLowerCase().includes(brand)
  )
    ? "Falton Den"
    : authorName;

  const createdLabel = ch.createdAt.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });

  const primaryHtml = ch.introduction?.trim() || ch.description?.trim() || "";
  const tagline = primaryHtml
    ? primaryHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 280)
    : "";

  return (
    <CharacterDetailClient ch={ch} categoryLabel={categoryLabel} author={author}>
      <div className="w-full max-w-6xl mx-auto pb-12 px-4 sm:px-6 lg:px-8">
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

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              <div className="bg-background-paper rounded-3xl border border-white/5 overflow-hidden p-4">
                <div className="aspect-square rounded-2xl overflow-hidden border border-white/10 relative shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ch.avatar} alt={ch.name} className="w-full h-full object-cover" />
                  {ch.gender && (
                    <div className="absolute top-3 left-3">
                      <TagChip
                        label={ch.gender}
                        variant="secondary"
                        className="bg-black/60 backdrop-blur-md border-transparent text-white"
                      />
                    </div>
                  )}
                  {ch.isNsfw && (
                    <div className="absolute top-3 right-3">
                      <TagChip
                        label="NSFW"
                        variant="unfiltered"
                        className="bg-black/60 backdrop-blur-md"
                      />
                    </div>
                  )}
                </div>
              </div>

              <InteractionButtons
                characterSlug={ch.slug}
                initialLikes={ch.likeCount ?? 0}
                initialBookmarks={ch.bookmarkCount ?? 0}
                initialLiked={flags.liked}
                initialBookmarked={flags.bookmarked}
                isSignedIn={isSignedIn}
              />

              <div className="bg-background-paper rounded-2xl border border-white/5 p-5 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl flex-shrink-0">
                    {author.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-text-muted mb-0.5">Created by</div>
                    <div className="font-semibold text-text-primary truncate" title={author}>
                      {author}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Follow
                  </button>
                </div>
                <div className="flex justify-between text-sm text-text-muted">
                  <span>
                    <strong className="text-white">
                      {ch.chatCount >= 1000
                        ? (ch.chatCount / 1000).toFixed(1) + "K"
                        : ch.chatCount}
                    </strong>{" "}
                    Chats
                  </span>
                </div>
              </div>

              <div className="bg-background-paper rounded-2xl border border-white/5 p-5">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-primary" />
                  Supporters
                </h3>

                <div className="flex flex-col items-center justify-center text-center py-6 border border-dashed border-white/10 rounded-xl mb-4 bg-background-elevated/30">
                  <Heart className="w-8 h-8 text-text-muted mb-2 opacity-50" />
                  <p className="text-sm text-text-secondary">No supporters yet</p>
                  <p className="text-xs text-text-muted mt-1">Be the first to show some love!</p>
                </div>

                <button
                  type="button"
                  className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors"
                >
                  Support Character
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-6">
            <div className="bg-background-paper rounded-3xl border border-white/5 p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <TagChip label={categoryLabel} variant="outline" />
                  {ch.visibility !== "public" && (
                    <TagChip
                      label={ch.visibility}
                      variant="secondary"
                      className="capitalize"
                    />
                  )}
                  {ch.isNsfw && <TagChip label="NSFW" variant="unfiltered" />}
                </div>
                <div className="flex items-center gap-4 text-sm text-text-muted">
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4" /> {ch.chatCount} chats
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> {createdLabel}
                  </span>
                </div>
              </div>

              <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{ch.name}</h1>
              {tagline && <p className="text-lg text-text-secondary mb-6">{tagline}</p>}

              <div className="flex flex-wrap items-center gap-6 mb-8">
                {ch.chatCount > 0 && <StatCounter value={ch.chatCount} iconType="message" />}
                <StatCounter value={ch.likeCount || 0} iconType="heart" />
                <StatCounter value={ch.bookmarkCount || 0} iconType="view" />
              </div>

              <Link
                href={`/chat/${ch.slug}`}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-primary hover:opacity-90 transition-opacity text-white font-bold text-lg rounded-2xl py-4 px-6 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] mb-8"
              >
                <MessageCircle className="w-5 h-5" />
                Start Chat
              </Link>

              <div className="hidden" aria-hidden>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary" />
                    Gallery
                  </h3>
                </div>
              </div>
            </div>

            <div className="bg-background-paper rounded-3xl border border-white/5 p-6 md:p-8 space-y-8">
              <section>
                <h2 className="text-xl font-bold text-white mb-6">Character Profile</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div className="bg-background-elevated p-4 rounded-2xl border border-white/5">
                      <div className="text-sm text-text-muted mb-1">Name</div>
                      <div className="font-medium text-white">{ch.name}</div>
                    </div>
                    {ch.gender && (
                      <div className="bg-background-elevated p-4 rounded-2xl border border-white/5">
                        <div className="text-sm text-text-muted mb-1">Gender</div>
                        <div className="font-medium text-white">{ch.gender}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-background-elevated p-5 rounded-2xl border border-white/5">
                  <div className="text-sm text-text-muted mb-2">About</div>
                  {ch.introduction?.trim() ? (
                    <IframeHtml
                      html={ch.introduction}
                      className="w-full border-0 rounded-2xl overflow-hidden"
                    />
                  ) : (
                    <p className="text-text-secondary whitespace-pre-wrap leading-relaxed">{ch.description}</p>
                  )}
                </div>
              </section>

              {ch.greeting && (
                <section>
                  <h2 className="text-xl font-bold text-white mb-4">Opening Message</h2>
                  <div className="p-5 bg-background-elevated rounded-2xl border border-white/5 italic text-text-secondary leading-relaxed whitespace-pre-wrap">
                    &quot;{ch.greeting}&quot;
                  </div>
                </section>
              )}

              {ch.systemPrompt && (
                <section>
                  <h2 className="text-xl font-bold text-white mb-4">Scenario / System Prompt</h2>
                  <div className="p-5 bg-background-elevated rounded-2xl border border-white/5 text-sm font-mono text-text-muted whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar">
                    {ch.systemPrompt}
                  </div>
                </section>
              )}
            </div>

            <CharacterComments
              characterSlug={ch.slug}
              initialComments={initialComments}
              isSignedIn={isSignedIn}
            />
          </div>
        </div>
      </div>
    </CharacterDetailClient>
  );
}
