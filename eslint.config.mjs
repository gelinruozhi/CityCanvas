import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // 高德地图 / Anthropic SDK 等第三方库无官方 TS 类型，允许使用 any
      "@typescript-eslint/no-explicit-any": "warn",
      // useEffect cleanup 的 ref 警告 — 我们已经手动确保不会内存泄漏
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default eslintConfig;
