# CityCanvas - 项目宪法

## 一句话定位
一个以山东财经大学校园地图为画布的 DIY 城市创意创作平台：用户在真实地图上打点 + 文字描述对建筑/区域的改造想法，AI 实时评估"舒适度 + 便捷度"并给出建议，作品发布到社区供他人浏览、点赞、评论、二次创作。

## 技术栈（不要替换）
- **前端**：Next.js 15 (App Router) + React 19 + TypeScript（strict）
- **样式**：Tailwind CSS v4 + shadcn/ui + Framer Motion + lucide-react
- **地图**：高德地图 JS API 2.0（@amap/amap-jsapi-loader）
- **后端**：Next.js Route Handlers（app/api/**/route.ts）
- **ORM/DB**：Prisma + PostgreSQL
- **状态**：Zustand（客户端地图状态）+ TanStack Query（服务端数据）
- **AI**：@anthropic-ai/sdk，默认模型 `claude-sonnet-4-6`，复杂评估走 `claude-opus-4-8`
- **包管理器**：pnpm
- **部署**：Docker Compose（app + postgres + nginx）

## 数据模型（Prisma 简版）
- `User`：id, nickname, avatar, createdAt（黑客松阶段免注册，本地生成匿名 ID）
- `Creation`：id, userId, title, mapView (JSON: center+zoom), createdAt
- `Annotation`：id, creationId, lat, lng, title, content, buildingType (enum), aiScore (JSON), createdAt
- `Comment`：id, creationId, userId, content, createdAt
- `Like`：id, creationId, userId（唯一约束）

## UI/UX 原则（这是评分关键，严格执行）
1. **极简留白**：主色调冷淡奶油白 + 一抹活力色（建议 `#FF6B35` 橙红 or `#0EA5E9` 天蓝）
2. **玻璃拟态**：悬浮面板用 `backdrop-blur-xl bg-white/70 dark:bg-zinc-900/70 border border-white/20`
3. **微动效**：所有交互用 Framer Motion，弹簧动画 `transition={{ type: "spring", stiffness: 300, damping: 30 }}`
4. **UI 默认暗黑模式 + 地图默认亮色风格**：网站整体用暗色玻璃拟态（高级感），地图本身用亮色（道路建筑清晰可读），用户可在 FAB 切换地图夜景
5. **左下角浮动操作栏 (FAB)** 而非传统 header
6. 中文字体：`字体栈优先 "HarmonyOS Sans SC", "PingFang SC", system-ui`

## 核心交互流（背下来）
1. 用户进入 → 看到山财圣井校区夜景地图（默认 zoom 16）
2. 点击地图任意点 → 弹出"创作气泡"输入框
3. 输入：建筑类型选择 + 创意描述（textarea）
4. 提交 → 后端调 Claude API → 返回评分（舒适度 0-100、便捷度 0-100、综合 0-100、AI 评语、改进建议）
5. 评分卡片以动画显示，标点变色（红=低分/绿=高分）
6. 完整作品（多个标点）可发布到广场
7. 广场页：瀑布流卡片 → 点击进入详情 → 评论/点赞/Fork（二次创作）

## 建筑类型分类（22 类，按尺度分 5 组，权威源在 [lib/types.ts](lib/types.ts)）

设计原则：**按"具体物体"而非"功能"分类**，让用户能精确表达——大到教学楼，小到一把排椅，都覆盖。同时通过 dialog 里的 **"新建 / 改造"** 选项区分"已建的优化"和"未建的新增"两类创作意图。

### 🏛️ 建筑（大尺度，整栋楼级别）
| value | label | emoji | 适用 |
|---|---|---|---|
| `teaching` | 教学楼 | 🏫 | 教学楼、阶梯教室、研讨教室 |
| `library` | 图书馆 | 📚 | 图书馆、阅览室、自习楼 |
| `dorm` | 宿舍楼 | 🛏️ | 学生公寓、教师宿舍 |
| `canteen` | 食堂 | 🍱 | 食堂、餐厅、独立餐饮门店 |
| `gym` | 体育馆 | 🏟️ | 室内体育馆、健身房、游泳馆 |
| `culture` | 文化馆 | 🎭 | 展览馆、剧场、文化活动中心、校史馆 |
| `lab` | 实验楼 | 🔬 | 实验楼、创新中心、孵化器 |

### 🌳 场地与景观（中尺度，户外）
| value | label | emoji | 适用 |
|---|---|---|---|
| `field` | 操场 | ⚽ | 标准操场、足球场、田径场 |
| `court` | 球场 | 🏀 | 篮球场、网球场、排球场、羽毛球场 |
| `park` | 绿地 | 🌳 | 公园、草坪、林荫道、生态湖 |
| `plaza` | 广场 | 🌟 | 中心广场、户外集会空间、入口广场 |
| `parking` | 停车场 | 🅿️ | 汽车停车场、电瓶车棚、临时停车 |

### ☕ 服务节点（小型独立空间）
| value | label | emoji | 适用 |
|---|---|---|---|
| `cafe` | 咖啡店 | ☕ | 咖啡馆、奶茶店、轻食吧、面包房 |
| `store` | 便利店 | 🏪 | 超市、便利店、文具店、生活服务点 |
| `studyroom` | 自习室 | 📖 | 24h 自习舱、共享自习空间、研讨小屋 |
| `logistics` | 快递医务 | 📦 | 快递柜、菜鸟驿站、医务室、心理咨询点 |

### 🛠️ 设施小品（家具级，最小尺度）
| value | label | emoji | 适用 |
|---|---|---|---|
| `bench` | 座椅 | 🪑 | 排椅、长凳、户外座椅、休憩点 |
| `lamp` | 路灯 | 💡 | 路灯、景观灯、感应夜灯、装饰灯 |
| `bike` | 单车点 | 🚲 | 自行车架、共享单车点、车棚 |
| `vending` | 售卖机 | 🥤 | 自动售货机、饮水机、自助打印机 |
| `art` | 艺术装置 | 🗿 | 雕塑、装置艺术、文化标识、地面彩绘 |

### ✨ 兜底
| value | label | emoji | 适用 |
|---|---|---|---|
| `other` | 其他 | ✨ | 未列入分类的特殊用途空间或设施 |

### 创作意图（intent，与 buildingType 正交）
- **新建 (build)**：这里目前没有，希望新增——例如"在三号宿舍楼下加一台共享打印机"
- **改造 (renovate)**：这里已有建筑/设施，希望改造——例如"把第二食堂二楼改成 24h 自习区"

意图不入库为独立字段，前端会以 `[新建] xxx` 或 `[改造] xxx` 前缀拼到 `content` 里——AI 评估时会读到这个前缀，决定从"零基础规划"还是"现状改造"角度评分。

### 维护规则（新增类型必须同步以下 4 处）
1. [lib/types.ts](lib/types.ts) — `BuildingType` 联合类型 + `BUILDING_TYPES` 数组（带 `group`/`hint`）
2. [app/api/creations/route.ts](app/api/creations/route.ts) — `BUILDING_TYPE_VALUES` 常量
3. [app/api/evaluate/route.ts](app/api/evaluate/route.ts) — `BUILDING_TYPE_VALUES` 常量
4. AI prompt 自动从 `BUILDING_TYPES` 注入，无需手动改

旧版数据（dining/leisure/study/sports/green/service/transit/innovation）通过 `LEGACY_TYPE_MAP` 自动映射到新类型，不需要清库迁移。

## 代码风格
- 文件命名：`kebab-case.tsx`，组件名 PascalCase
- 客户端组件顶部加 `"use client"`，能 server 就 server
- API 路由统一返回 `{ data, error }` 结构
- 错误用 `try/catch` + `Response.json(..., { status })`
- 不写多余注释；命名表达意图
- 不要 mock 数据，直接对接 Prisma

## 山东财经大学校区坐标（参考）
- 圣井校区（主校区）：约 [117.379, 36.681]（高德 lng/lat 顺序）
- 燕山校区：约 [117.069, 36.643]
默认地图中心 = 圣井校区，zoom = 16

## 空间推理硬规则（反复踩坑过 — 严格遵守）
1. **校园中心坐标禁止硬编码**：`SDUFE_CAMPUSES.shengjing.center` 仅作地图首次加载的占位坐标，**不允许**在 AI 评估、距离计算、区域判定等任何空间逻辑里直接使用它做参考点。
2. **校园中心必须动态获取**：进入 `/create` 页时由 `AMap.PlaceSearch` 搜索"山东财经大学(圣井校区)"，把返回的真实坐标存进 `useAnnotationStore.campusCenter`。所有后续的"标点是否在校内、属于校园哪个区域、距校园中心多远"判断都从这个动态值出发。
3. **AI 评估接口必须接收 campusCenter**：`/api/evaluate` 的 body 必须带 `campusCenter`，`evaluateAnnotation()` 缺少这个字段时直接抛错，绝不允许回退到硬编码常量（回退会让"校园中心"漂移 1km+，导致 AI 把校内标点判定为校外）。
4. **新增任何"空间方位/区域"逻辑时，复查这条规则**：从地图点击事件、标点位置展示、到 AI prompt 里的 region 字符串，链路必须始终用 `store.campusCenter`。
5. **AI 定位的唯一依据是真实周边 POI 名字，禁止把"距中心 N 米 + 方向"翻译成"南部/北部/东南部"标签喂给 AI**。校园是南北长矩形（不是圆形），距离+方位无法准确映射到功能区，且 AI 看到方位词必脑补。正确做法：
   - 评估前由前端 `lib/amap/place-search-client.ts` 调用 AMap.PlaceSearch 拿真实周边 POI（半径 250m）；
   - 把 POI 列表（带建筑名 + 距离）原样传给后端，由 AI 自己根据"附近 50m 是图书馆、80m 是二号教学楼"这种事实推断功能区；
   - 系统提示词里**严禁** AI 输出"校园南部/东南部/边缘/核心区"等无 POI 支撑的方位词；
   - POI 列表为空时，AI 必须给中性评分并说明"周边数据不足"，不允许靠想象编造区域。

## 黑客松约束
- 不写单元测试（除非明确要求），重点是 demo 跑通
- 不引入额外大依赖
- 完成一个阶段 → commit 一次，message 用规范的 conventional commits
