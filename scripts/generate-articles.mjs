// scripts/generate-articles.mjs
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import OSS from 'ali-oss';
import { jsonrepair } from 'jsonrepair';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ─── 客户端初始化 ────────────────────────────────────────────────────────────

const prisma = new PrismaClient();

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

/** Lazy OSS client — skip image upload if credentials missing */
let ossClientSingleton = null;
function getOssClient() {
  const { OSS_REGION, OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET, OSS_BUCKET } = process.env;
  if (!OSS_ACCESS_KEY_ID || !OSS_ACCESS_KEY_SECRET || !OSS_BUCKET || !OSS_REGION) {
    return null;
  }
  if (!ossClientSingleton) {
    ossClientSingleton = new OSS({
      region: OSS_REGION,
      accessKeyId: OSS_ACCESS_KEY_ID,
      accessKeySecret: OSS_ACCESS_KEY_SECRET,
      bucket: OSS_BUCKET,
    });
  }
  return ossClientSingleton;
}

/** Image API: use ASCII x, never × or "px" (many gateways reject them) */
const IMAGE_SIZE_PRIMARY = process.env.IMAGE_SIZE || '1792x1024';
const IMAGE_SIZE_FALLBACK = process.env.IMAGE_SIZE_FALLBACK || '1024x1024';

function parseArticleJson(raw) {
  let s = String(raw).trim().replace(/^\uFEFF/, '');
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  try {
    return JSON.parse(s);
  } catch {
    const i = s.indexOf('{');
    const j = s.lastIndexOf('}');
    if (i >= 0 && j > i) {
      const sub = s.slice(i, j + 1);
      try {
        return JSON.parse(sub);
      } catch {
        try {
          return JSON.parse(jsonrepair(sub));
        } catch {
          /* fall through to full-string repair */
        }
      }
    }
    return JSON.parse(jsonrepair(s));
  }
}

async function streamChatToString(params) {
  const completion = await openai.chat.completions.create({ ...params, stream: true });
  let full = '';
  process.stdout.write('  Receiving data: ');
  for await (const chunk of completion) {
    const delta = chunk.choices[0]?.delta?.content || '';
    full += delta;
    if (delta) process.stdout.write('.');
  }
  console.log(' Done.');
  return full;
}

// ─── 文章主题列表 ─────────────────────────────────────────────────────────────
// ✏️ 在这里填写要生成的文章主题，每次运行前修改此数组

const TOPICS = [
  { 
    slug: 'ai-gaming-revolution-2026', 
    keyword: 'AI gaming, artificial intelligence games', 
    titleEn: 'The AI Gaming Revolution of 2026: How Generative AI is Changing Play',
    titleZh: '2026年AI游戏革命：生成式AI如何改变我们的游玩方式',
    titleJa: '2026年のAIゲーム革命：生成AIがいかに遊びを変えるか',
    titleEs: 'La revolución de los juegos de IA en 2026: Cómo la IA generativa está cambiando el juego'
  },
  // Add more topics here for future runs
];

const ARTICLE_SYSTEM_PROMPT = `You are an expert SEO content writer for an AI game aggregation and distribution platform called "HeyWaii". HeyWaii features the latest AI games and AI character chats.
Write long-form, high-quality SEO articles in JSON format.

CRITICAL — the entire reply MUST be one valid JSON object parseable by JSON.parse:
- Escape every double quote inside string values as \\".
- Escape newlines inside strings as \\n (no raw line breaks inside JSON strings).
- Escape backslashes as \\\\.
- Do not wrap the JSON in markdown code fences.

Requirements:
- contentEn: 1500+ English words, Markdown format, 4+ H2 headings (##), 2+ H3 headings (###)
- contentZh: 1500+ Chinese characters, same structure as contentEn
- contentJa: 1500+ Japanese characters, same structure as contentEn
- contentEs: 1500+ Spanish words, same structure as contentEn
- summaryEn: 80-120 English words
- summaryZh: 80-120 Chinese characters
- summaryJa: 80-120 Japanese characters
- summaryEs: 80-120 Spanish words
- titleEn: SEO-optimized English title, include main keyword
- titleZh: SEO-optimized Chinese title, include main keyword
- titleJa: SEO-optimized Japanese title, include main keyword
- titleEs: SEO-optimized Spanish title, include main keyword
- tags: array of 5-8 relevant tag strings in English (lowercase, hyphenated)
- author: always "HeyWaii Editorial Team"

Return ONLY the JSON object, no other text.`;

// ─── 第一步：生成文章内容 ──────────────────────────────────────────────────────

async function generateArticle(topic) {
  console.log(`\n📝 Generating article: ${topic.slug}`);

  const model = process.env.OPENAI_MODEL || 'gemini-2.5-flash-maxthinking'; // Or gemini-2.5-flash
  const maxAttempts = Number(process.env.ARTICLE_MAX_ATTEMPTS || 3);
  const useJsonMode = process.env.OPENAI_JSON_MODE === '1';

  const baseMessages = [
    { role: 'system', content: ARTICLE_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Write a complete SEO article about: "${topic.keyword}"
Reference title (en): ${topic.titleEn}
Reference title (zh): ${topic.titleZh}`,
    },
  ];

  let lastErr = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (attempt > 1) {
      console.log(`  ↻ Retry ${attempt}/${maxAttempts} (previous output was not valid JSON)`);
    }

    const messages =
      attempt === 1
        ? baseMessages
        : [
            ...baseMessages,
            {
              role: 'user',
              content:
                'Your previous answer was not valid JSON (unescaped quotes or raw newlines inside strings). Reply again with ONLY one valid JSON object; escape all quotes and newlines inside string values.',
            },
          ];

    try {
      const createParams = {
        model,
        messages,
        temperature: 0.7,
        max_tokens: Number(process.env.ARTICLE_MAX_TOKENS || 8000),
        stream: true,
      };
      if (useJsonMode) {
        createParams.response_format = { type: 'json_object' };
      }

      const fullContent = await streamChatToString(createParams);
      const data = parseArticleJson(fullContent);
      return data;
    } catch (e) {
      lastErr = e;
      console.error(`  ⚠️ Attempt ${attempt} failed:`, e.message || e);
    }
  }

  throw lastErr || new Error('generateArticle failed');
}

// ─── 第二步：生成封面图 prompt ─────────────────────────────────────────────────

async function buildImagePrompt(titleEn) {
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gemini-2.5-flash-maxthinking',
    messages: [
      {
        role: 'system',
        content: `You are a professional image prompt writer for a modern gaming and AI tech platform.
Given an article title, write a concise prompt for an AI image generator (like DALL-E or Midjourney).
The image should fit a futuristic, neon-lit, or clean tech aesthetic. It might feature glowing holograms, AI interfaces, anime-style gaming characters, or cyberpunk environments.
Return ONLY the prompt string. No explanation, no quotes.`,
      },
      {
        role: 'user',
        content: `Article title: "${titleEn}"`,
      },
    ],
    temperature: 0.8,
    max_tokens: 300,
  });

  return completion.choices[0].message.content.trim();
}

// ─── 第三步：生成图片并上传 OSS ───────────────────────────────────────────────

async function generateAndUploadCover(slug, titleEn) {
  const oss = getOssClient();
  if (!oss) {
    console.warn('  ⚠️ OSS env not set; skipping cover upload');
    return '';
  }

  const imagePrompt = await buildImagePrompt(titleEn);
  console.log(`  ✍️  Image prompt: ${imagePrompt.slice(0, 80)}...`);

  const imageModel = process.env.OPENAI_IMAGE_MODEL || 'dall-e-3';
  const sizesToTry = [IMAGE_SIZE_PRIMARY, IMAGE_SIZE_FALLBACK].filter(
    (v, idx, a) => v && a.indexOf(v) === idx
  );

  let response = null;
  let lastImgErr = null;
  for (const size of sizesToTry) {
    try {
      response = await openai.images.generate({
        model: imageModel,
        prompt: imagePrompt,
        size,
        quality: 'standard',
        response_format: 'b64_json',
      });
      break;
    } catch (e) {
      lastImgErr = e;
      console.warn(`  ⚠️ Image size "${size}" failed: ${e.message}`);
    }
  }
  if (!response) throw lastImgErr || new Error('image generation failed');

  const imageData = response.data[0];
  let buffer;
  let mimeType = 'image/png';
  let ext = 'png';

  if (typeof imageData.b64_json === 'string') {
    let b64Raw = imageData.b64_json;
    if (b64Raw.startsWith('data:')) {
      const mimeMatch = b64Raw.match(/^data:([^;]+);/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
        ext = mimeType.split('/')[1] || 'png';
      }
      b64Raw = b64Raw.split(',')[1];
    }
    buffer = Buffer.from(b64Raw, 'base64');
  } else if (imageData.b64_json instanceof Uint8Array || Buffer.isBuffer(imageData.b64_json)) {
    buffer = Buffer.from(imageData.b64_json);
  } else if (imageData.url) {
    const fetch = (await import('node-fetch')).default;
    const res = await fetch(imageData.url);
    buffer = Buffer.from(await res.arrayBuffer());
  } else {
    throw new Error('Unexpected image response format: ' + JSON.stringify(Object.keys(imageData)));
  }

  const key = `heywaii/blog/covers/${slug}-${Date.now()}.${ext}`;

  await oss.put(key, buffer, {
    mime: mimeType,
    headers: {
      'Content-Disposition': 'inline',
      'Cache-Control': 'public, max-age=31536000',
    },
  });

  return `https://${process.env.OSS_BUCKET}.${process.env.OSS_REGION}.aliyuncs.com/${key}`;
}

// ─── 第四步：写入数据库 ────────────────────────────────────────────────────────

async function upsertArticle(slug, topic, data, coverImageUrl) {
  // For HeyWaii, the Article model has: title, slug, content, coverImage, category, publishedAt.
  // We'll store the English content as the primary content for now, or JSON stringify all langs.
  // Let's store all languages in the content field as a JSON string to support i18n later, 
  // or just use English as the main title/content if the schema expects simple strings.
  
  // Based on the Prisma schema: title (String), slug (String @unique), content (String @db.Text), coverImage (String?), category (String?), publishedAt (DateTime?)
  
  const articleContent = JSON.stringify({
    en: { title: data.titleEn, summary: data.summaryEn, content: data.contentEn },
    zh: { title: data.titleZh, summary: data.summaryZh, content: data.contentZh },
    ja: { title: data.titleJa, summary: data.summaryJa, content: data.contentJa },
    es: { title: data.titleEs, summary: data.summaryEs, content: data.contentEs },
    tags: data.tags,
    author: data.author
  });

  const existing = await prisma.article.findUnique({
    where: { slug }
  });

  if (existing) {
    let newCover = existing.coverImage;
    if (coverImageUrl) {
      newCover = coverImageUrl;
    }

    await prisma.article.update({
      where: { slug },
      data: {
        title: data.titleEn || topic.titleEn,
        content: articleContent,
        coverImage: newCover,
        category: 'AI Gaming',
        updatedAt: new Date()
      }
    });
    console.log(`  ✅ Updated: ${slug}`);
  } else {
    await prisma.article.create({
      data: {
        slug,
        title: data.titleEn || topic.titleEn,
        content: articleContent,
        coverImage: coverImageUrl || null,
        category: 'AI Gaming',
        publishedAt: new Date(),
      }
    });
    console.log(`  ✅ Inserted: ${slug}`);
  }
}

// ─── 主流程 ───────────────────────────────────────────────────────────────────

async function main() {
  const FORCE_OVERWRITE_COVER = process.env.FORCE_OVERWRITE_COVER === '1';

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ ERROR: OPENAI_API_KEY is not set in your environment variables.');
    return;
  }

  const runStartedAt = new Date();
  console.log(`⏱️  Batch run started at: ${runStartedAt.toISOString()}`);
  console.log(`🖼️  Force overwrite covers: ${FORCE_OVERWRITE_COVER ? 'YES' : 'NO'}`);

  for (const topic of TOPICS) {
    try {
      // 1. 生成文章内容
      const data = await generateArticle(topic);

      // 2. 生成封面图并上传 OSS
      let coverImageUrl = '';
      try {
        const existing = await prisma.article.findUnique({ where: { slug: topic.slug }, select: { coverImage: true } });
        const hasCover = existing && !!existing.coverImage;
        if (!hasCover || FORCE_OVERWRITE_COVER) {
          coverImageUrl = await generateAndUploadCover(topic.slug, data.titleEn || topic.titleEn);
          if (coverImageUrl) {
            console.log(`  🖼️  Cover uploaded: ${coverImageUrl}`);
          }
        } else {
          console.log(`  ⏭️  Cover exists, skipping generation.`);
        }
      } catch (err) {
        console.warn(`  ⚠️  Cover generation failed, skipping: ${err.message}`);
      }

      // 3. 写入数据库
      await upsertArticle(topic.slug, topic, data, coverImageUrl);

      // 避免 API 限速
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.error(`  ❌ Failed: ${topic.slug}`, err.message);
    }
  }

  await prisma.$disconnect();
  const elapsedMs = Date.now() - runStartedAt.getTime();
  const mins = Math.floor(elapsedMs / 60000);
  const secs = Math.floor((elapsedMs % 60000) / 1000);
  console.log(`\n🎉 All done! Started: ${runStartedAt.toISOString()} | Total runtime: ${mins}m ${secs}s`);
}

main();