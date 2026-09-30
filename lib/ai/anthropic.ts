import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;
const baseURL = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";

export const anthropic = new Anthropic({
  apiKey: apiKey ?? "missing",
  baseURL,
  // 防止慢网关挂死 Node 进程：单次调用 30s + 最多重试 1 次，
  // 叠加 MODEL_CHAIN 回退整体由 nginx 120s 超时兜底
  timeout: 30_000,
  maxRetries: 1,
});

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
    parseChain(process.env.ANTHROPIC_MODELS) ?? [
      "claude-sonnet-4-6",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-sonnet-latest",
    ],
  deep:
    parseChain(process.env.ANTHROPIC_MODELS_DEEP) ?? [
      "claude-opus-4-8",
      "claude-3-opus-20240229",
    ],
} as const;
