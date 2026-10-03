# amap 插件（高德地图 API）

ZCode 插件：**高德地图 Web 服务 MCP 工具集 + 高德地图开发参考技能**。

## 组成

- **MCP server**（`scripts/amap-server.mjs`，零依赖 Node stdio）：13 个工具封装高德 Web 服务 v3 API
  `geocode`、`regeocode`、`search_place_text`、`search_place_around`、`place_detail`、`route_driving`、`route_walking`、`route_transit`、`measure_distance`、`weather`、`district`、`convert_coords`、`static_map`
- **技能**（`skills/amap-dev/SKILL.md`）：高德 Key 类型、JS API 2.0 加载与安全密钥、GCJ-02 坐标系、错误排查、CityCanvas 项目上下文

## 配置 Key

工具读取环境变量 `AMAP_KEY`（**「Web 服务」类型**，与浏览器 JS API 的 Key 不通用）：

```powershell
setx AMAP_KEY "你的Web服务Key"
# 之后重启 ZCode 生效
```

可选：若 Key 开启了数字签名，另设 `AMAP_SECURITY_CODE`。

也可以不改系统环境变量，直接编辑本插件 `.mcp.json`，为服务器加 `env`：

```json
{ "mcpServers": { "amap": { "command": "node", "args": ["..."], "env": { "AMAP_KEY": "..." } } } }
```

申请 Key：[高德开放平台控制台](https://console.amap.com/dev/key/app) → 创建应用 → 添加 Key → 服务平台选「Web 服务」。

## 冒烟测试（开发用）

```bash
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05"}}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
  '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"geocode","arguments":{"address":"山东财经大学圣井校区","city":"济南"}}}' \
  | AMAP_KEY=<你的Key> node scripts/amap-server.mjs
```
