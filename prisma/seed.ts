import {
  PrismaClient,
  ContentStatus,
  ContentSource,
  Role,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@heywaii.local";
  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: "Admin",
      role: Role.ADMIN,
      balance: 50_000,
    },
    update: { role: Role.ADMIN, balance: 50_000 },
  });

  const hasSource = await prisma.crawlerSource.findFirst({
    where: { entryUrl: "https://example.com" },
  });
  if (!hasSource) {
    await prisma.crawlerSource.create({
      data: {
        name: "Example.com (demo)",
        entryUrl: "https://example.com",
        itemSelector: "h1",
      },
    });
  }

  await prisma.game.upsert({
    where: { slug: "cyberpunk-ai-adventure" },
    create: {
      title: "Cyberpunk AI Adventure",
      slug: "cyberpunk-ai-adventure",
      url: "https://heywaii.com",
      shortDescription:
        "Neon-lit dystopia where every choice shapes the city — AI-driven narrative.",
      fullDescription:
        "Immerse yourself in a neon-lit dystopia. Interact with AI characters with deep memories and dynamic personalities.",
      coverImage:
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
      categorySlug: "rpg",
      status: ContentStatus.PUBLISHED,
      source: ContentSource.UGC,
      plays: 124_500,
      likes: 12_400,
    },
    update: {
      title: "Cyberpunk AI Adventure",
      plays: 124_500,
      likes: 12_400,
    },
  });

  await prisma.game.upsert({
    where: { slug: "stellar-colony-sim" },
    create: {
      title: "Stellar Colony Sim",
      slug: "stellar-colony-sim",
      shortDescription: "Build and govern an AI colony on a distant moon.",
      fullDescription: "Manage resources, diplomacy, and emergent AI citizen stories.",
      coverImage:
        "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=1200&auto=format&fit=crop",
      categorySlug: "simulation",
      status: ContentStatus.PUBLISHED,
      source: ContentSource.UGC,
      plays: 42_000,
      likes: 5100,
    },
    update: {},
  });

  await prisma.character.upsert({
    where: { slug: "alice-the-mage" },
    create: {
      name: "Alice the Mage",
      slug: "alice-the-mage",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
      description: "A sharp-witted arcane researcher ready for any quest.",
      categorySlug: "fantasy",
      status: ContentStatus.PUBLISHED,
      source: ContentSource.UGC,
    },
    update: {},
  });

  await prisma.article.upsert({
    where: { slug: "how-to-create-ai-game" },
    create: {
      title: "How to Create an AI Game",
      slug: "how-to-create-ai-game",
      content:
        "## Getting started\n\nUse strong prompts, define boundaries, and test with players early.",
      coverImage:
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop",
      category: "Tutorial",
      publishedAt: new Date(),
    },
    update: { publishedAt: new Date() },
  });

  await prisma.announcement.upsert({
    where: { slug: "welcome-beta" },
    create: {
      title: "Welcome to HeyWaii Gameshub Beta",
      slug: "welcome-beta",
      body: "We are building the future of AI-native games. Submit your title and explore the hub.",
      type: "info",
      publishedAt: new Date(),
    },
    update: {},
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
