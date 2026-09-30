# CityCanvas

> 在山东财经大学地图上 DIY 你的理想校园 · AI 实时评估 · 社区共创

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io/)
[![Claude](https://img.shields.io/badge/Claude-AI-D97757)](https://www.anthropic.com/)

---

## ✨ 项目简介

**CityCanvas** 是一个以山东财经大学校园地图为画布的 DIY 创意创作平台。用户在真实地图上点击、添加文字描述，AI（Claude）会实时评估"舒适度+便捷度"，作品可发布到社区被点赞、评论、二次创作（Fork）。

> 详细 pitch 见 [PITCH.md](PITCH.md) · 部署指南见 [DEPLOY.md](DEPLOY.md)

---

## 🚀 本地启动

### 前置要求
- Node.js 22+
- pnpm 9+

### 步骤

```bash
# 1. 安装依赖
pnpm install

# 2. 准备环境变量
cp .env.example .env.local
# 编辑 .env.local 填入：
#   NEXT_PUBLIC_AMAP_KEY            高德 Web 端 JS API Key
#   NEXT_PUBLIC_AMAP_SECURITY_CODE  对应安全密钥
#   AMAP_REST_KEY                   高德 Web 服务 Key（POI 搜索）
#   AI_GATEWAY_API_KEY              AI 网关 API Key
#   AI_GATEWAY_BASE_URL             AI 网关地址（anthropic 风格到域名级；openai 风格到 /compatible-mode/v1）
#   AI_GATEWAY_API_STYLE            anthropic（默认）| openai（网关仅提供 OpenAI 兼容接口时）
#   AI_GATEWAY_MODELS               可选：模型回退链（逗号分隔，代理网关按 token 绑定模型组时用）
#   NEXT_PUBLIC_SITE_URL            可选：站点地址（OG 分享卡用）

# 3. 初始化数据库
pnpm prisma generate
pnpm prisma db push

# 4. 启动
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)

---

## 🛠 技术栈

| 层 | 选型 |
|---|---|
| 前端 | Next.js 15 (App Router) + React 19 + TypeScript strict |
| UI | Tailwind CSS v4 + shadcn/ui + Framer Motion + lucide-react |
| 地图 | 高德 JS API 2.0 (`@amap/amap-jsapi-loader`) |
| 后端 | Next.js Route Handlers (`app/api/**/route.ts`) |
| ORM/DB | Prisma + SQLite（生产可切 Postgres） |
| 状态 | Zustand + TanStack Query |
| AI | `@anthropic-ai/sdk` (Claude Sonnet 4.6 / Opus 4.8) |
| 部署 | Docker Compose + Nginx + Let's Encrypt |

---

## 📂 目录结构

```
CityCanvas/
├── app/                  # Next.js App Router
│   ├── api/              # Route Handlers (users, creations, comments, like, evaluate)
│   ├── create/           # 创作页（地图 + Dialog + 详情面板）
│   ├── gallery/          # 广场列表 + 详情
│   ├── layout.tsx        # 根布局（暗黑模式 + Provider）
│   ├── page.tsx          # 首页
│   └── opengraph-image.tsx  # 动态 OG 图
├── components/
│   ├── ui/               # shadcn 组件
│   ├── map/              # 地图相关（CanvasMap, ReadonlyMap, FAB, Dialog）
│   └── gallery/          # 广场组件（CreationCard, LikeButton, CommentSection）
├── lib/
│   ├── ai/               # Claude 评估器 + Prompt
│   ├── amap/             # 高德 POI 搜索（前/后端）
│   ├── store/            # Zustand stores
│   ├── hooks/            # TanStack Query hooks
│   ├── campus-context.ts # 山财校园建筑清单（喂给 AI）
│   ├── types.ts          # 全局类型
│   └── prisma.ts         # Prisma 单例
├── prisma/schema.prisma
├── nginx/nginx.conf
├── Dockerfile
├── docker-compose.yml
├── CLAUDE.md             # 项目宪法（AI 协作规则）
├── DEPLOY.md             # 部署指南
└── PITCH.md              # 黑客松路演大纲
```

---

## 🌟 关键功能

- 🗺 **真实地图创作**：高德 3D 夜景地图，自动定位山财圣井校区
- 🎯 **POI 锚定的 AI 评估**：Claude 基于真实周边建筑名（图书馆/教学楼）做空间推理，评估更精准
- 💖 **社区互动**：瀑布流广场、心形粒子点赞、实时评论、Fork 二次创作
- 👤 **匿名免注册**：自动生成中文昵称（"打盹的小鹿"），可改名

---

## 🐳 一键部署

```bash
cp .env.example .env
# 填入 keys
docker compose build
docker compose up -d
```

详细步骤见 [DEPLOY.md](DEPLOY.md)。

---

## 📝 License

MIT · Made for 泉客松 2026 · 山东财经大学
