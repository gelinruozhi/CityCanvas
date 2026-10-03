---
name: amap-dev
description: 高德地图（AMap）开发参考。在本项目中使用或调试高德地图 JS API 2.0、处理地图坐标/POI/路线/天气/地理编码、排查高德 API 报错（如 USERKEY_PLAT_NOMATCH、INVALID_USER_SCODE）、或需要调用 amap MCP 工具时使用。
---

# 高德地图开发参考（CityCanvas）

## Key 类型速查（最容易踩的坑）

高德开放平台一个应用下可建多种类型的 Key，**类型互不通用**：

| Key 类型 | 用途 | 使用场景 |
|---|---|---|
| Web 服务 | REST API（restapi.amap.com） | 服务端 / 任意 HTTP 客户端 |
| Web 端(JS API) | 浏览器地图 JS API 2.0 | 前端页面，需配安全密钥 securityJsCode |
| Android / iOS / 微信小程序 | 对应平台原生 SDK | 原生 App |

- 本插件的 MCP 工具（geocode / search_place_text 等）用的是 **Web 服务** Key，从环境变量 `AMAP_KEY` 读取。
- CityCanvas 前端 `@amap/amap-jsapi-loader` 用的是 **Web端(JS API)** Key，两者不能混用；用错类型会报 `USERKEY_PLAT_NOMATCH`（infocode 10003）。

## JS API 2.0 标准加载（本项目模式）

```ts
// 仅浏览器上下文；Next.js 中放 "use client" 组件的 useEffect 里
import AMapLoader from "@amap/amap-jsapi-loader";

window._AMapSecurityConfig = { securityJsCode: "安全密钥" }; // 必须在 load 之前挂到 window
const AMap = await AMapLoader.load({
  key: "JS_API_KEY",
  version: "2.0",
  plugins: ["AMap.Geocoder", "AMap.PlaceSearch", "AMap.Driving"],
});
```

- 2021-12 之后创建的 JS API Key 都绑定安全密钥，未配置会报 `INVALID_USER_SCODE` 或地图加载白屏。
- SSR 环境（Next.js App Router）不能在模块顶层执行加载；必须等浏览器阶段。
- 地图样式：`map.setMapStyle("amap://styles/dark")` / `"amap://styles/normal"`。项目常量见 `lib/constants.ts` 的 `AMAP_DARK_STYLE` / `AMAP_LIGHT_STYLE`（UI 暗色玻璃拟态 + 地图默认亮色，FAB 可切夜景）。

## 坐标系

高德全体系坐标为 **GCJ-02**（火星坐标）：

- GPS 原始坐标（WGS84）、百度（BD-09）都不能直接混用，需转换：JS API 用 `AMap.convertFrom`，服务端用 REST `/v3/assistant/coordinate/convert`（本插件 `convert_coords` 工具）。
- 从后端/数据库拿到的坐标如果来源是 GPS 设备或百度，先转换再上屏，否则位置偏移数百米。
- REST 接口入参格式统一为 `经度,纬度`（lng,lat），小数不超过 6 位。

## 常用 REST 接口 ↔ 本插件 MCP 工具对照

| MCP 工具 | REST 接口 | 用途 |
|---|---|---|
| geocode | /v3/geocode/geo | 地址 → 坐标 |
| regeocode | /v3/geocode/regeo | 坐标 → 地址 + 附近 POI |
| search_place_text / search_place_around / place_detail | /v3/place/* | POI 关键词/周边/详情 |
| route_driving / route_walking / route_transit | /v3/direction/* | 驾车/步行/公交路线 |
| measure_distance | /v3/distance | 直线/步行测距 |
| weather | /v3/weather/weatherInfo | 实况 + 4 日预报（入参 adcode，城市名会自动换算） |
| district | /v3/config/district | 行政区划层级/边界 |
| convert_coords | /v3/assistant/coordinate/convert | 坐标系转换 |
| static_map | /v3/staticmap | 生成静态地图图片 URL |

## 错误排查

REST 返回 `status: "0"` 时看 `info` + `infocode`：

- `10001`：Key 无效或未激活 → 检查 `AMAP_KEY` 值与类型。
- `10003`：Key 类型与服务不匹配 → REST 必须用「Web 服务」Key。
- `10005` / `INVALID_USER_SCODE`：数字签名或安全密钥问题 → 控制台若开启数字签名，需设置 `AMAP_SECURITY_CODE`；JS API 则检查 `window._AMapSecurityConfig`。
- `20003`：日配额超限（个人认证开发者各接口每日有限额）。
- 网络层：`restapi.amap.com` 走 HTTPS GET，服务端 fetch 需带超时（本插件默认 15s）。

## CityCanvas 项目上下文

- 地图库：`@amap/amap-jsapi-loader ^1.0.1`，JS API version 2.0；地图组件在 `components/map/canvas-map.tsx`。
- 默认视野：山东财经大学圣井校区，zoom 16。需要精确坐标时，**用 amap MCP 的 geocode 工具查真实坐标**，不要凭记忆硬编码。
- 标注、足迹等多边形数据均为 GCJ-02，直接存 Prisma/PostgreSQL 的 JSON 字段即可，无需再转 WGS84。
- 若前端需要展示路线/POI，优先复用 amap MCP 工具在服务端取数，浏览器端 JS API 配额更宝贵。
