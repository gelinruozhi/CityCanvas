#!/usr/bin/env node
// 高德地图 Web 服务 MCP server（stdio，零依赖）。
// Key 只从环境变量读取，不落盘：AMAP_KEY（Web 服务类型），可选 AMAP_SECURITY_CODE（数字签名）。
import { createInterface } from "node:readline";
import { createHash } from "node:crypto";

const KEY = process.env.AMAP_KEY?.trim();
const SECURITY_CODE = process.env.AMAP_SECURITY_CODE?.trim();
const BASE = "https://restapi.amap.com";
const SERVER_INFO = { name: "amap", version: "0.1.0" };

const pretty = (v) => JSON.stringify(v, null, 2);
const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined && obj[k] !== "").map((k) => [k, obj[k]]));
const clean = (params) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""));

const INFO_HINTS = {
  "10001": "（AMAP_KEY 无效或未激活，检查 Key 值与「Web 服务」类型）",
  "10003": "（Key 类型不匹配：本工具集需要「Web 服务」类型 Key，浏览器 JS API 的 Key 不通用）",
  "10004": "（并发调用超出配额，稍后重试）",
  "10005": "（数字签名校验失败：若控制台开启了数字签名，需设置 AMAP_SECURITY_CODE）",
  "10008": "（IP 白名单限制或安全码错误）",
  "10009": "（IP 白名单校验失败）",
  "10044": "（该服务对此 Key 类型不可用）",
  "20003": "（今日调用配额已用尽）",
};

function sigOf(path, params) {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("md5").update(`${path}?${sorted}${SECURITY_CODE}`).digest("hex");
}

async function amap(path, params = {}) {
  if (!KEY) {
    throw new Error(
      "缺少高德 Key。请设置「Web 服务」类型 Key 到环境变量 AMAP_KEY（Windows：setx AMAP_KEY \"你的Key\" 后重启 ZCode），或在本插件 .mcp.json 中为服务器加 env 配置。",
    );
  }
  const full = { key: KEY, ...clean(params) };
  const search = new URLSearchParams(full).toString();
  const qs = SECURITY_CODE ? `${search}&sig=${sigOf(path, full)}` : search;
  let body;
  try {
    const res = await fetch(`${BASE}${path}?${qs}`, { signal: AbortSignal.timeout(15000) });
    body = await res.json();
  } catch (e) {
    throw new Error(`高德 API 请求失败：${e?.message ?? e}`);
  }
  if (body.status !== "1") {
    throw new Error(`高德 API 错误：info=${body.info ?? "未知"} infocode=${body.infocode ?? "?"} ${INFO_HINTS[body.infocode] ?? ""}`.trim());
  }
  return body;
}

const lnglat = (s) => (typeof s === "string" ? s.trim() : "");

function condenseSteps(steps) {
  return (steps ?? []).map((s) => `${s.instruction || s.road || ""}（${s.distance}米）`.replace(/（0米）$/, ""));
}

function condenseDrivingWalking(route) {
  const paths = route?.paths ?? [];
  return paths.map((p) => ({
    总距离_米: Number(p.distance),
    总时长_秒: Number(p.duration),
    策略: p.strategy,
    步骤: condenseSteps(p.steps),
  }));
}

function condenseTransit(route) {
  return (route?.transits ?? []).map((t, i) => ({
    方案: i + 1,
    总时长_秒: Number(t.duration),
    步行距离_米: Number(t.walking_distance ?? 0),
    段落: (t.segments ?? []).flatMap((seg) => {
      const parts = [];
      if (seg.walking?.steps?.length)
        parts.push({ 类型: "步行", 描述: condenseSteps(seg.walking.steps).join("；") });
      for (const line of seg.bus?.buslines ?? [])
        parts.push({
          类型: "公交",
          线路: line.name,
          上车: line.departure_stop?.name,
          下车: line.arrival_stop?.name,
          途经站数: Number(line.via_num ?? 0),
          首末班: [line.first_time, line.last_time].filter(Boolean).join("~") || undefined,
        });
      if (seg.railway)
        parts.push({
          类型: "火车",
          线路: seg.railway.name,
          出发: seg.railway.departure_stop?.name,
          到达: seg.railway.arrival_stop?.name,
        });
      if (seg.entrance?.name) parts.push({ 类型: "入口", 名称: seg.entrance.name });
      if (seg.exit?.name) parts.push({ 类型: "出口", 名称: seg.exit.name });
      return parts;
    }),
  }));
}

const poisSummary = (pois) =>
  (pois ?? []).map((p) =>
    pick(p, ["id", "name", "alias", "type", "typecode", "address", "location", "tel", "distance", "biz_ext"]),
  );

async function resolveAdcode(city) {
  if (/^\d{6}$/.test(city)) return city;
  const data = await amap("/v3/config/district", { keywords: city, subdistrict: 0 });
  const hit = (data.districts ?? []).find((d) => d.adcode);
  if (!hit) throw new Error(`未找到城市「${city}」对应的 adcode，可改用 6 位行政区划代码。`);
  return hit.adcode;
}

const TOOLS = [
  {
    name: "geocode",
    description: "地理编码：把地址转换为高德坐标（GCJ-02）。如「山东省济南市章丘区山东财经大学圣井校区」→ 经纬度。",
    inputSchema: {
      type: "object",
      properties: {
        address: { type: "string", description: "完整地址，建议「省+市+区+详细地址」" },
        city: { type: "string", description: "可选，城市名/citycode/adcode，限定查询城市提高准确率" },
      },
      required: ["address"],
    },
    async run({ address, city }) {
      const data = await amap("/v3/geocode/geo", { address, city });
      const list = data.geocodes ?? [];
      if (!list.length) return `未匹配到地址「${address}」，可尝试补充省市区前缀。`;
      return pretty(list.map((g) => pick(g, ["formatted_address", "country", "province", "city", "district", "adcode", "location", "level"])));
    },
  },
  {
    name: "regeocode",
    description: "逆地理编码：把高德坐标（GCJ-02）转换为地址描述，含省市区、道路、附近 POI。",
    inputSchema: {
      type: "object",
      properties: {
        location: { type: "string", description: "经度,纬度（GCJ-02），如 117.402,36.521" },
        extensions: { type: "string", enum: ["base", "all"], description: "默认 base；all 额外返回附近 POI、道路等" },
      },
      required: ["location"],
    },
    async run({ location, extensions }) {
      const data = await amap("/v3/geocode/regeo", { location: lnglat(location), extensions: extensions || "base" });
      const r = data.regeocode ?? {};
      const comp = r.addressComponent ?? {};
      const summary = {
        formatted_address: r.formatted_address,
        province: comp.province,
        city: comp.city,
        district: comp.district,
        township: comp.township,
        street: [comp.streetNumber?.street, comp.streetNumber?.number].filter(Boolean).join("") || undefined,
      };
      if (extensions === "all") {
        summary.附近POI = poisSummary(r.pois).slice(0, 8);
        summary.附近道路 = (r.roads ?? []).slice(0, 5).map((x) => pick(x, ["name", "distance", "direction"]));
      }
      return pretty(summary);
    },
  },
  {
    name: "search_place_text",
    description: "关键词搜索 POI：按关键字（可限城市、类型）搜索兴趣点，返回名称/地址/坐标/id。",
    inputSchema: {
      type: "object",
      properties: {
        keywords: { type: "string", description: "搜索关键词，如「山东财经大学」「图书馆」" },
        city: { type: "string", description: "可选，限定城市（城市名/citycode/adcode）" },
        types: { type: "string", description: "可选，POI 类型编码（如 141200 高校）" },
        page: { type: "integer", minimum: 1, description: "页码，默认 1" },
        offset: { type: "integer", maximum: 25, description: "每页数量，默认 10，最多 25" },
      },
      required: ["keywords"],
    },
    async run({ keywords, city, types, page, offset }) {
      const data = await amap("/v3/place/text", { keywords, city, types, page, offset: Math.min(offset || 10, 25) });
      if (!data.pois?.length) return `未搜索到与「${keywords}」相关的 POI。`;
      return pretty({ 总数: Number(data.count), POI: poisSummary(data.pois) });
    },
  },
  {
    name: "search_place_around",
    description: "周边搜索 POI：以坐标为中心搜索半径内的兴趣点。",
    inputSchema: {
      type: "object",
      properties: {
        location: { type: "string", description: "中心点 经度,纬度（GCJ-02）" },
        keywords: { type: "string", description: "可选关键词" },
        types: { type: "string", description: "可选 POI 类型编码" },
        radius: { type: "integer", maximum: 3000, description: "半径米数，默认 1000，最大 3000" },
        offset: { type: "integer", maximum: 25, description: "每页数量，默认 10" },
        sortrule: { type: "string", enum: ["distance", "weight"], description: "排序：distance 距离优先 / weight 权重优先" },
      },
      required: ["location"],
    },
    async run({ location, keywords, types, radius, offset, sortrule }) {
      const data = await amap("/v3/place/around", {
        location: lnglat(location),
        keywords,
        types,
        radius: Math.min(radius || 1000, 3000),
        offset: Math.min(offset || 10, 25),
        sortrule,
      });
      if (!data.pois?.length) return "周边未找到符合条件的 POI。";
      return pretty({ 总数: Number(data.count), POI: poisSummary(data.pois) });
    },
  },
  {
    name: "place_detail",
    description: "POI 详情：按 search_place_* 返回的 POI id 查询深层数据（营业时间、评分、图片、深度信息等）。",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "POI id（search_place_text / search_place_around 结果中的 id）" },
      },
      required: ["id"],
    },
    async run({ id }) {
      const data = await amap("/v3/place/detail", { id });
      const poi = data.pois?.[0];
      if (!poi) return `未找到 id 为 ${id} 的 POI。`;
      return pretty(poi);
    },
  },
  {
    name: "route_driving",
    description: "驾车路线规划：起点到终点的驾车方案，返回距离、时长和分步指引。",
    inputSchema: {
      type: "object",
      properties: {
        origin: { type: "string", description: "起点 经度,纬度（GCJ-02）" },
        destination: { type: "string", description: "终点 经度,纬度（GCJ-02）" },
        waypoints: { type: "string", description: "可选途经点，分号分隔：lng,lat;lng,lat" },
        strategy: { type: "integer", description: "可选策略：0 最快 / 2 最短 / 10 不走高速等" },
      },
      required: ["origin", "destination"],
    },
    async run({ origin, destination, waypoints, strategy }) {
      const data = await amap("/v3/direction/driving", {
        origin: lnglat(origin),
        destination: lnglat(destination),
        waypoints,
        strategy,
      });
      const condensed = condenseDrivingWalking(data.route);
      return condensed.length ? pretty(condensed) : pretty(data.route);
    },
  },
  {
    name: "route_walking",
    description: "步行路线规划：起点到终点的步行方案，500km 以内。",
    inputSchema: {
      type: "object",
      properties: {
        origin: { type: "string", description: "起点 经度,纬度（GCJ-02）" },
        destination: { type: "string", description: "终点 经度,纬度（GCJ-02）" },
      },
      required: ["origin", "destination"],
    },
    async run({ origin, destination }) {
      const data = await amap("/v3/direction/walking", { origin: lnglat(origin), destination: lnglat(destination) });
      const condensed = condenseDrivingWalking(data.route);
      return condensed.length ? pretty(condensed) : pretty(data.route);
    },
  },
  {
    name: "route_transit",
    description: "公交/跨城出行路线规划：起点到终点的公交+步行方案，返回各换乘方案分段明细。",
    inputSchema: {
      type: "object",
      properties: {
        origin: { type: "string", description: "起点 经度,纬度（GCJ-02）" },
        destination: { type: "string", description: "终点 经度,纬度（GCJ-02）" },
        city: { type: "string", description: "起点所在城市（城市名/adcode/citycode）" },
        cityd: { type: "string", description: "可选，终点所在城市（跨城时必填）" },
        strategy: { type: "integer", description: "可选：0 最快捷 / 1 最经济 / 2 最少换乘 / 3 最少步行 / 5 不乘地铁" },
      },
      required: ["origin", "destination", "city"],
    },
    async run({ origin, destination, city, cityd, strategy }) {
      const data = await amap("/v3/direction/transit/integrated", {
        origin: lnglat(origin),
        destination: lnglat(destination),
        city,
        cityd,
        strategy,
      });
      const condensed = condenseTransit(data.route);
      return condensed.length ? pretty(condensed) : pretty(data.route);
    },
  },
  {
    name: "measure_distance",
    description: "距离测量：计算两点间（可多点）的直线或步行距离与耗时。",
    inputSchema: {
      type: "object",
      properties: {
        origins: { type: "string", description: "起点，多个用分号分隔：lng,lat;lng,lat" },
        destination: { type: "string", description: "终点 经度,纬度" },
        type: { type: "integer", enum: [0, 1], description: "0 直线距离（默认）/ 1 步行距离" },
      },
      required: ["origins", "destination"],
    },
    async run({ origins, destination, type }) {
      const data = await amap("/v3/distance", { origins: lnglat(origins), destination: lnglat(destination), type });
      return pretty((data.results ?? []).map((r) => ({ 距离_米: Number(r.distance), 耗时_秒: Number(r.duration) })));
    },
  },
  {
    name: "weather",
    description: "天气查询：按城市名或 adcode 查询实况与 4 日预报。",
    inputSchema: {
      type: "object",
      properties: {
        city: { type: "string", description: "城市名（如 济南）或 6 位 adcode" },
        extensions: { type: "string", enum: ["base", "all"], description: "base 实况（默认）/ all 实况+预报" },
      },
      required: ["city"],
    },
    async run({ city, extensions }) {
      const adcode = await resolveAdcode(city);
      const data = await amap("/v3/weather/weatherInfo", { city: adcode, extensions: extensions || "base" });
      const live = data.lives?.[0];
      if (extensions !== "all") {
        return live
          ? pretty({
              城市: `${live.province}${live.city}`,
              天气: live.weather,
              温度: `${live.temperature}°C`,
              风向: live.winddirection,
              风力: `${live.windpower}级`,
              湿度: `${live.humidity}%`,
              报告时间: live.reporttime,
            })
          : pretty(data);
      }
      const forecast = data.forecasts?.[0];
      return forecast
        ? pretty({
            城市: `${forecast.province}${forecast.city}`,
            预报: (forecast.casts ?? []).map((c) => ({
              日期: c.date,
              白天: `${c.dayweather} ${c.daytemp}°C ${c.daywind}风${c.daypower}级`,
              夜间: `${c.nightweather} ${c.nighttemp}°C ${c.nightwind}风${c.nightpower}级`,
            })),
          })
        : pretty(data);
    },
  },
  {
    name: "district",
    description: "行政区划查询：按名称或 adcode 查询省市区层级、边界坐标、中心点。",
    inputSchema: {
      type: "object",
      properties: {
        keywords: { type: "string", description: "行政区名称/adcode/citycode，如「章丘区」" },
        subdistrict: { type: "integer", maximum: 3, description: "下级行政区级数 0-3，默认 1" },
        extensions: { type: "string", enum: ["base", "all"], description: "all 返回边界坐标（较大）" },
      },
    },
    async run({ keywords, subdistrict, extensions }) {
      const data = await amap("/v3/config/district", { keywords, subdistrict, extensions });
      return pretty(
        (data.districts ?? []).map((d) => ({
          ...pick(d, ["name", "adcode", "level", "center", "districts"]),
        })),
      );
    },
  },
  {
    name: "convert_coords",
    description: "坐标转换：把 GPS(WGS84)/百度(BD-09)/图吧 等坐标批量转为高德 GCJ-02（最多 40 对）。",
    inputSchema: {
      type: "object",
      properties: {
        locations: { type: "string", description: "坐标对，分号分隔：lng,lat;lng,lat" },
        coordsys: { type: "string", enum: ["gps", "mapbar", "baidu", "autonavi"], description: "源坐标系，gps=GPS 原始坐标，baidu=百度坐标，autonavi 仅做格式校验" },
      },
      required: ["locations"],
    },
    async run({ locations, coordsys }) {
      const data = await amap("/v3/assistant/coordinate/convert", { locations: lnglat(locations), coordsys: coordsys || "gps" });
      return pretty({ GCJ02坐标: data.locations });
    },
  },
  {
    name: "static_map",
    description: "静态地图：生成带标注点的静态地图图片 URL（不下载图片，直接在浏览器打开即可查看）。",
    inputSchema: {
      type: "object",
      properties: {
        location: { type: "string", description: "地图中心 经度,纬度；有 markers 时可省略" },
        zoom: { type: "integer", maximum: 17, description: "缩放级别 1-17，默认 10" },
        size: { type: "string", description: "图片尺寸 宽*高，如 750*300，最大 1024*1024" },
        scale: { type: "integer", enum: [1, 2], description: "1 普通 / 2 高清，默认 1" },
        markers: {
          type: "array",
          description: "标注点数组",
          items: {
            type: "object",
            properties: {
              location: { type: "string", description: "经度,纬度" },
              color: { type: "string", description: "如 0xFF6B35" },
              size: { type: "string", enum: ["small", "mid", "large"], description: "默认 mid" },
              label: { type: "string", description: "单个字母数字标签，如 A" },
            },
            required: ["location"],
          },
        },
      },
    },
    run({ location, zoom, size, scale, markers }) {
      if (!KEY) {
        throw new Error("缺少高德 Key。请设置「Web 服务」类型 Key 到环境变量 AMAP_KEY（Windows：setx AMAP_KEY \"你的Key\" 后重启 ZCode）。");
      }
      const params = new URLSearchParams(clean({ key: KEY, location: lnglat(location), zoom, size, scale }));
      for (const m of markers ?? []) {
        const group = [m.size || "mid", m.color || "0x1E90FF", m.label].filter(Boolean).join(",");
        params.append("markers", `${group}:${lnglat(m.location)}`);
      }
      return `${BASE}/v3/staticmap?${params.toString()}`;
    },
  },
];

const TOOL_MAP = new Map(TOOLS.map((t) => [t.name, t]));

function reply(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n");
}

function replyError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }) + "\n");
}

async function handle(message) {
  const { id, method, params } = message;
  if (id === undefined) return; // 通知无需应答
  try {
    if (method === "initialize") {
      reply(id, {
        protocolVersion: params?.protocolVersion,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });
    } else if (method === "ping") {
      reply(id, {});
    } else if (method === "tools/list") {
      reply(id, {
        tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
      });
    } else if (method === "tools/call") {
      const tool = TOOL_MAP.get(params?.name);
      if (!tool) {
        reply(id, { content: [{ type: "text", text: `未知工具：${params?.name}` }], isError: true });
        return;
      }
      try {
        const text = await tool.run(params?.arguments ?? {});
        reply(id, { content: [{ type: "text", text: String(text) }] });
      } catch (e) {
        reply(id, { content: [{ type: "text", text: `【${params?.name}】${e?.message ?? e}` }], isError: true });
      }
    } else {
      replyError(id, -32601, `Method not found: ${method}`);
    }
  } catch (e) {
    replyError(id, -32603, `Internal error: ${e?.message ?? e}`);
  }
}

for await (const line of createInterface({ input: process.stdin })) {
  const trimmed = line.trim();
  if (!trimmed) continue;
  let message;
  try {
    message = JSON.parse(trimmed);
  } catch {
    continue;
  }
  await handle(message);
}
