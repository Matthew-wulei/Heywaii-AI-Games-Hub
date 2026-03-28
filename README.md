# Heywaii-AI-Games-Hub

HeyWaii 是一个 AI 游戏聚合平台，我们收录并向玩家提供各类 AI 原生游戏。

本仓库为 **HeyWaii Gameshub** 的 Web 应用，基于 Next.js（App Router）、Tailwind CSS、Prisma（MySQL）、NextAuth（Auth.js）与 AI SDK 搭建。

## 本地开发

依赖使用 pnpm：

```bash
pnpm install
pnpm dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

## 环境变量

在项目根目录配置 `.env`（勿提交到 Git），至少包含：

- `DATABASE_URL` — MySQL 连接串（Prisma）
- `AUTH_SECRET` — NextAuth 密钥
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google OAuth（若启用）
- `OPENAI_API_KEY` — 聊天接口（若使用 OpenAI）

数据库迁移：

```bash
npx prisma migrate dev
```

## 构建

```bash
pnpm build
pnpm start
```

## 仓库

[Matthew-wulei/Heywaii-AI-Games-Hub](https://github.com/Matthew-wulei/Heywaii-AI-Games-Hub)
