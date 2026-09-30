import Anthropic from "@anthropic-ai/sdk";

// 变量名用 AI_GATEWAY_* 而不是 ANTHROPIC_*：后者常被用户全局环境变量
// （如给其他工具配置的 ANTHROPIC_BASE_URL）占用，优先级高于 .env 文件会污染本应用。
// 旧的 ANTHROPIC_* 命名保留为回退。
const apiKey =
  process.env.AI_GATEWAY_API_KEY ?? process.env.ANTHROPIC_API_KEY;
const baseURL =
  process.env.AI_GATEWAY_BASE_URL ??
  process.env.ANTHROPIC_BASE_URL ??
  "https://api.anthropic.com";
const styleRaw =
  process.env.AI_GATEWAY_API_STYLE ?? process.env.ANTHROPIC_API_STYLE;
const modelsRaw = process.env.AI_GATEWAY_MODELS ?? process.env.ANTHROPIC_MODELS;

export const anthropic = new Anthropic({
  apiKey: apiKey ?? "missing",
  baseURL,
  // 防止慢网关挂死 Node 进程：单次调用 30s + 最多重试 1 次，
  // 叠加 MODEL_CHAIN 回退整体由 nginx 120s 超时兜底
  timeout: 30_000,
  maxRetries: 1,
});

// API 风格：anthropic（默认，SDK 走 {base}/v1/messages）
//          | openai（网关只提供 OpenAI 兼容 {base}/chat/completions 时，如 qianwenaiapi.com）
export const API_STYLE: "anthropic" | "openai" =
  styleRaw === "openai" ? "openai" : "anthropic";

// 仅允许 https 公网地址，拒绝环回/内网/保留段（SSRF 防护）
function assertPublicHttpsUrl(raw: string): URL {
  const url = new URL(raw);
  if (url.protocol !== "https:") {
    throw new Error("AI 网关地址必须是 https");
  }
  const host = url.hostname;
  const blocked =
    /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|\[::1\]$)/.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /\.local$/i.test(host);
  if (blocked) {
    throw new Error(`AI 网关地址不允许指向内网/保留地址: ${host}`);
  }
  return url;
}

let cachedEndpoint: string | null = null;

// OpenAI 兼容 /chat/completions 调用（零依赖 fetch 实现）
export async function openaiChatComplete(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  maxTokens: number
): Promise<string> {
  if (!apiKey) throw new Error("缺少 ANTHROPIC_API_KEY");
  cachedEndpoint ??= (() => {
    const base = assertPublicHttpsUrl(baseURL);
    return `${base.origin}${base.pathname.replace(/\/+$/, "")}/chat/completions`;
  })();

  const res = await fetch(cachedEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`[ai] openai 风格调用失败 endpoint=${cachedEndpoint} status=${res.status} body=${detail.slice(0, 200)}`);
    throw new Error(`${res.status} ${detail.slice(0, 200)}`.trim());
  }
  const json = await res.json();
  const content = String(json?.choices?.[0]?.message?.content ?? "").trim();
  if (!content) {
    throw new Error("AI 响应缺少文本内容");
  }
  return content;
}

// 模型链可用环境变量覆盖（逗号分隔），代理网关一般按 token 绑定模型组，
// 换网关/模型时改 .env 即可，无需改代码重新构建
function parseChain(value: string | undefined): string[] | null {
  const list = value
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list && list.length > 0 ? list : null;
}

// 优先尝试的模型链，第一个失败自动回退到下一个
export const MODEL_CHAIN = {
  default:
    parseChain(modelsRaw) ?? [
      "claude-sonnet-4-6",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-sonnet-latest",
    ],
  deep: parseChain(process.env.AI_GATEWAY_MODELS_DEEP) ?? [
    "claude-opus-4-8",
    "claude-3-opus-20240229",
  ],
} as const;
