# CityCanvas · 校园改造画布

> **在卡通校园画布上，圈出你的理想校园** —— 点一个位置、画一片区域、选中一栋楼，AI 实时评估你的改造创意，发布到社区共创。

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io/)
[![SVG Canvas](https://img.shields.io/badge/画布-自绘%20SVG%20卡通校园-e2622b)]()

---

## ✨ 这是什么

CityCanvas 是一个以**山东财经大学自绘卡通校园画布**（31 栋楼 + 路网 + 湖泊 + 三处运动场，按校园平面图 1:1 布局）为载体的 DIY 改造平台。它不是一个"在地图上打标签"的工具，而是一套**校园改造编辑器**：

### 🎨 自由绘图工具

| 工具 | 交互 | 适合表达 |
|---|---|---|
| 📍 **点位** | 点击画布任意位置 | 一台售货机、一把长椅、一个快闪咖啡角 |
| ⭕ **圆形区域** | **按住拖拽**画圆，松开完成（像截图工具一样） | 一片草坪音乐角、一个篮球场 |
| ⬜ **矩形区域** | **按住拖拽**画框，松开完成 | 连廊雨棚、一片屋顶花园 |

拖拽实时预览，Esc 随时取消，误触（几乎没拖动）自动忽略；绘制时画布不会跟手平移。

### 🏢 可交互建筑 + 室内外分离

- 画布上铺开**31 栋可交互建筑**（教学楼/图书馆/餐厅/公寓/医务室等，按类型着色），位置与相对关系严格对照校园平面图
- **点击任意建筑** → 建筑面板：类型、完整**楼层体系**（1F…NF）
- **选层进入室内编辑模式**：自动生成该楼层的平面图（走廊、房间、楼梯、按建筑类型布置的家具示意），添加的创意自动带上 `建筑·楼层` 标签，AI 按室内场景评估
- 不选楼就是**室外模式**：圈地块、画区域、改造校园的任何角落
- 室内创意类型有约束：餐厅里加不了自习室，宿舍里加不了食堂——AI 也会按这个场景评

### 🤖 AI 实时评估

每个创意提交后，AI（大模型经 OpenAI 兼容网关调用）会结合**周边楼栋与所属校园区域**（来自画布数据）、你圈选的**覆盖范围与楼层位置**，从舒适度、便捷度两个维度打分，给出具体的 strengths / concerns / suggestions —— 像懂校园的学长在给建议，而不是空话。

### 🌗 沉浸式画布

- 草地绿底 + 米白路网 + 湖泊广场的亮色手绘风格，楼栋为 2.5D 立体块
- 点击创作时自动落点预览，右侧面板不遮挡画布
- 草稿标注本地自动保存（localStorage），刷新不丢

### 💖 社区共创

瀑布流广场、点赞、评论、**Fork 二次创作**（连形状、楼层一起继承）—— 每个创意都可以成为别人灵感的起点。

---

## 🚀 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 准备环境变量
cp .env.example .env.local
# 填入：AI 网关 Key 等（见 .env.example 注释）

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
| 画布 | 自绘 SVG 卡通校园（`lib/campus/map-data.ts` 单一数据源 + 零压楼校验脚本） |
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
│   ├── create/               # 创作页（画布编辑器 + 右侧面板）
│   └── gallery/[id]/         # 作品详情（点/圆/矩形三种形状渲染）
├── components/map/
│   ├── campus-canvas.tsx     # 编辑器核心：自绘画布、pan/zoom、绘图交互、室内模式
│   ├── indoor-floor-plan.tsx # 程序化楼层平面（走廊/房间/楼梯/类型化家具）
│   ├── building-panel.tsx    # 建筑面板（楼层体系 + 室内模式入口）
│   └── fab-controls.tsx      # FAB + 绘图工具组
├── lib/
│   ├── campus/               # 画布数据（31 栋楼/路网/湖/运动场）+ 室内类型规则
│   ├── ai/                   # 评估器（模型回退链、JSON 修复、形状/楼层上下文）
│   └── store/                # Zustand（标注草稿持久化、绘图工具、建筑选择、室内楼层）
├── scripts/check-roads.mjs   # 路网零压楼程序化校验（改地图数据后必须重跑）
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

MIT · Made by gelinruozhi · 面向山东财经大学圣井校区
