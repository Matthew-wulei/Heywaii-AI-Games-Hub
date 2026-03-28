import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Play, Star, Share2, Heart, MessageSquare } from "lucide-react";
import Link from "next/link";

interface GamePageProps {
  params: {
    slug: string;
  };
}

// Mock Data Fetching Function
async function getGameBySlug(slug: string) {
  // In a real app, this would fetch from the database
  if (!slug) return null;

  return {
    id: "game-1",
    slug,
    title: "Cyberpunk AI Adventure",
    shortDescription: "Immerse yourself in a neon-lit dystopia where every choice shapes the city.",
    fullDescription: "Immerse yourself in a neon-lit dystopia where every choice shapes the city. Interact with fully voiced AI characters with deep memories and dynamic personalities in this groundbreaking open-world narrative experience. Your choices will determine the fate of the factions vying for control.",
    coverImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
    categorySlug: "rpg",
    categoryName: "RPG",
    tags: ["Cyberpunk", "Narrative", "Choices Matter", "Open World"],
    status: "published",
    author: "Neon Dreams Studio",
    updatedAt: "2026-03-25",
    stats: {
      plays: "124.5k",
      likes: "12.4k",
      comments: "3.2k",
      rating: 4.8,
    }
  };
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const game = await getGameBySlug(params.slug);

  if (!game) {
    return {
      title: "Game Not Found | HeyWaii Gameshub",
    };
  }

  return {
    title: `${game.title} | HeyWaii Gameshub`,
    description: game.shortDescription,
    openGraph: {
      title: `${game.title} | HeyWaii Gameshub`,
      description: game.shortDescription,
      images: [game.coverImage],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${game.title} | HeyWaii Gameshub`,
      description: game.shortDescription,
      images: [game.coverImage],
    },
  };
}

export default async function GameDetailPage({ params }: GamePageProps) {
  const game = await getGameBySlug(params.slug);

  if (!game) {
    notFound();
  }

  return (
    <div className="flex flex-col w-full max-w-[1200px] mx-auto pb-12">
      {/* Breadcrumbs */}
      <nav className="flex text-sm text-text-muted mb-6">
        <Link href="/" className="hover:text-text-primary transition-colors">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/game" className="hover:text-text-primary transition-colors">Games</Link>
        <span className="mx-2">/</span>
        <Link href={`/game/${game.categorySlug}`} className="hover:text-text-primary transition-colors">{game.categoryName}</Link>
        <span className="mx-2">/</span>
        <span className="text-text-primary">{game.title}</span>
      </nav>

      {/* Hero Header */}
      <div className="relative w-full rounded-3xl overflow-hidden aspect-[21/9] md:aspect-[3/1] bg-background-elevated border border-white/5 mb-8">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${game.coverImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent md:bg-gradient-to-r md:from-background md:via-background/90 md:to-transparent" />
        
        <div className="absolute inset-0 flex flex-col md:flex-row items-end md:items-center p-6 md:p-10 gap-8">
          {/* Cover Image (Desktop) */}
          <div className="hidden md:block w-48 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex-shrink-0 z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={game.coverImage} alt={game.title} className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 z-10 w-full">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">{game.title}</h1>
            <p className="text-text-secondary text-sm md:text-base mb-6 max-w-2xl line-clamp-2">
              {game.shortDescription}
            </p>
            
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className="px-3 py-1 text-xs font-medium rounded-md bg-white/10 text-white">
                {game.categoryName}
              </span>
              <div className="flex items-center gap-1.5 text-status-warning text-sm font-medium">
                <Star className="w-4 h-4 fill-status-warning" />
                {game.stats.rating}
              </div>
              <div className="text-sm text-text-muted">
                Created by <span className="text-primary">{game.author}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link 
                href={`/play/${game.slug}`}
                className="relative inline-flex items-center justify-center px-8 py-3.5 text-base font-medium text-white rounded-full bg-gradient-primary hover:opacity-90 transition-all duration-200 hover:shadow-[0_0_15px_rgba(236,72,153,0.5)] active:scale-95 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Play className="w-5 h-5 fill-white" />
                  Play Game
                </span>
              </Link>
              
              <button className="p-3.5 rounded-full bg-white/5 border border-white/10 text-text-secondary hover:text-white hover:bg-white/10 transition-colors">
                <Heart className="w-5 h-5" />
              </button>
              <button className="p-3.5 rounded-full bg-white/5 border border-white/10 text-text-secondary hover:text-white hover:bg-white/10 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Description & Media */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-background-paper rounded-2xl p-6 border border-white/5">
            <h2 className="text-xl font-bold text-white mb-4">About this game</h2>
            <div className="text-text-secondary leading-relaxed space-y-4">
              <p>{game.fullDescription}</p>
            </div>
          </section>
          
          <section className="bg-background-paper rounded-2xl p-6 border border-white/5">
            <h2 className="text-xl font-bold text-white mb-4">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {game.tags.map(tag => (
                <span key={tag} className="px-3 py-1.5 text-sm rounded-lg bg-background-elevated text-text-secondary border border-white/5">
                  {tag}
                </span>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Stats & Meta */}
        <div className="space-y-6">
          <div className="bg-background-paper rounded-2xl p-6 border border-white/5">
            <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-text-muted flex items-center gap-2">
                  <Play className="w-4 h-4" /> Total Plays
                </span>
                <span className="text-white font-medium">{game.stats.plays}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted flex items-center gap-2">
                  <Heart className="w-4 h-4" /> Likes
                </span>
                <span className="text-white font-medium">{game.stats.likes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Comments
                </span>
                <span className="text-white font-medium">{game.stats.comments}</span>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Last Updated</span>
                <span className="text-text-secondary">{game.updatedAt}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-3">
                <span className="text-text-muted">Status</span>
                <span className="text-status-success capitalize">{game.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoGame",
            name: game.title,
            description: game.shortDescription,
            image: game.coverImage,
            genre: game.categoryName,
            author: {
              "@type": "Person",
              name: game.author,
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: game.stats.rating,
              ratingCount: parseInt(game.stats.likes.replace('k', '000')),
            },
          }),
        }}
      />
    </div>
  );
}
