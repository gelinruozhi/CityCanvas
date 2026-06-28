import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;
const baseURL = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";

export const anthropic = new Anthropic({
  apiKey: apiKey ?? "missing",
  baseURL,
});

// 优先尝试的模型链，第一个失败自动回退到下一个
export const MODEL_CHAIN = {
  default: ["claude-sonnet-4-6", "claude-3-5-sonnet-20241022", "claude-3-5-sonnet-latest"],
  deep: ["claude-opus-4-8", "claude-3-opus-20240229"],
} as const;
