import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Supabase Edge Function은 Node가 아니라 Deno에서 돈다.
  // `/// <reference types="..." />`는 Deno에서 타입을 붙이는 정식 문법이라
  // import로 바꿀 수 없다. Node 기준 규칙이 오탐하는 것이므로 이 경로에서만 끈다.
  {
    files: ["supabase/functions/**/*.ts"],
    rules: {
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Capacitor가 웹 빌드(out/)를 복사해 넣는 iOS 네이티브 디렉토리 — 압축된 번들이라 lint 대상이 아님.
    "ios/**",
  ]),
]);

export default eslintConfig;
