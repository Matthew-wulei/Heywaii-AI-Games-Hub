import { MetadataRoute } from 'next'

// Mock fetching games for sitemap
async function getGamesForSitemap() {
  return Array.from({ length: 5 }).map((_, i) => ({
    slug: `game-slug-${i}`,
    updatedAt: new Date()
  }))
}

// Mock fetching blogs for sitemap
async function getBlogsForSitemap() {
  return Array.from({ length: 3 }).map((_, i) => ({
    slug: `blog-post-${i}`,
    updatedAt: new Date()
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://heywaii.com'
  
  const games = await getGamesForSitemap()
  const blogs = await getBlogsForSitemap()

  const gameUrls = games.map((game) => ({
    url: `${baseUrl}/game/${game.slug}`,
    lastModified: game.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const blogUrls = blogs.map((blog) => ({
    url: `${baseUrl}/blog/${blog.slug}`,
    lastModified: blog.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/game`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...gameUrls,
    ...blogUrls,
  ]
}
