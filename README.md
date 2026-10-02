# CityCanvas · 校园改造画布

> **在真实的校园地图上，圈出你的理想校园** —— 点一个位置、画一片区域、选中一栋楼，AI 实时评估你的改造创意，发布到社区共创。

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io/)
[![高德地图](https://img.shields.io/badge/高德地图-JS%20API%202.0-00B96B)](https://lbs.amap.com/)

---

## ✨ 这是什么

CityCanvas 是一个以**山东财经大学真实校园地图**为画布的 DIY 改造平台。它不是一个"在地图上打标签"的工具，而是一套**校园改造编辑器**：

### 🎨 自由绘图工具

| 工具 | 交互 | 适合表达 |
|---|---|---|
| 📍 **点位** | 点击地图任意位置 | 一台售货机、一把长椅、一个快闪咖啡角 |
| ⭕ **圆形区域** | 点击定圆心 → 移动定半径 → **再次点击完成** | 一片草坪音乐角、一个篮球场 |
| ⬜ **矩形区域** | 点击一角 → 移动 → **点击对角完成** | 连廊雨棚、一片屋顶花园 |

两次点击明确开始与结束，Esc 随时取消；选区范围（60m 分析圈）与预览虚线全程可见，不会"不知道自己选了哪"。

### 🏢 可交互建筑 + 室内外分离

- 地图上自动铺开**建筑足迹层**（由高德 POI 动态生成，按建筑类型着色），窗口/档口类小店自动并入所属教学楼、餐厅，不产生碎片
- **点击任意建筑** → 建筑面板：类型、完整**楼层体系**（1F…NF）
- **选层进入室内编辑模式**：视野贴地细看这栋楼，添加的创意自动带上 `建筑·楼层` 标签，AI 按室内场景评估
- 不选楼就是**室外模式**：圈地块、画区域、改造校园的任何角落

### 🤖 AI 实时评估

每个创意提交后，AI（大模型经 OpenAI 兼容网关调用）会结合**真实周边建筑**（高德 POI，250m 内）、你圈选的**覆盖范围与楼层位置**，从舒适度、便捷度两个维度打分，给出具体的 strengths / concerns / suggestions —— 像懂校园的学长在给建议，而不是空话。

### 🌗 沉浸式地图

- 默认**夜间地图**与暗黑玻璃 UI 融为一体
- 一键切换**卫星实景** —— 真实校园的楼栋、绿化、操场一目了然
- 点击创作时自动拉近到建筑级细节，右侧面板不遮挡地图

### 💖 社区共创

瀑布流广场、心形点赞、实时评论、**Fork 二次创作**（连形状、楼层一起继承）—— 每个创意都可以成为别人灵感的起点。

---

## 🚀 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 准备环境变量
cp .env.example .env.local
# 填入：高德 Web Key / 安全密钥 / Web 服务 Key、AI 网关 Key 等（见 .env.example 注释）

# 3. 初始化数据库
pnpm prisma generate && pnpm prisma db push

# 4. 启动
pnpm dev        # 开发
pnpm build && pnpm start   # 生产
```

打开 [http://localhost:3000](http://localhost:3000)。

---

## 🛠 技术栈

| 层 | 选型 |
|---|---|
| 前端 | Next.js 15 (App Router) + React 19 + TypeScript strict |
| UI | Tailwind CSS v4 + shadcn/ui + Framer Motion + lucide-react |
| 地图 | 高德 JS API 2.0（3D 矢量 + 卫星图层 + PlaceSearch + 自实现绘图交互） |
| 后端 | Next.js Route Handlers (`app/api/**/route.ts`) |
| ORM/DB | Prisma + SQLite（生产可切 Postgres） |
| 状态 | Zustand + TanStack Query |
| AI | OpenAI 兼容网关（`AI_GATEWAY_*` 环境变量，支持 Anthropic 官方 API） |
| 部署 | Docker Compose + Nginx（standalone 产物，数据卷持久化） |

---

## 📂 关键模块

```
CityCanvas/
├── app/
│   ├── api/                  # creations / evaluate / stats / users 路由
│   ├── create/               # 创作页（地图编辑器 + 右侧面板）
│   └── gallery/[id]/         # 作品详情（点/圆/矩形三种形状渲染）
├── components/map/
│   ├── canvas-map.tsx        # 编辑器核心：形状渲染、绘图交互、建筑层、室内模式
│   ├── building-panel.tsx    # 建筑面板（楼层体系 + 室内模式入口）
│   └── fab-controls.tsx      # FAB + 绘图工具组
├── lib/
│   ├── amap/campus-buildings.ts  # POI → 可交互建筑足迹（含窗口并入大建筑）
│   ├── ai/                   # 评估器（模型回退链、JSON 修复、形状/楼层上下文）
│   └── store/                # Zustand（标注、绘图工具、建筑选择、室内楼层）
└── prisma/schema.prisma      # Annotation: shape/radius/bounds/buildingName/floor
```

---

## 🐳 一键部署

```bash
cp .env.example .env   # 填入 keys（NEXT_PUBLIC_* 在构建期经 build args 注入）
docker compose build
docker compose up -d
```

详细步骤（域名 / HTTPS / 故障排查）见 [DEPLOY.md](DEPLOY.md)。

---

## 📝 License

MIT · Made for 泉客松 2026 · 山东财经大学
