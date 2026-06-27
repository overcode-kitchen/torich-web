import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
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
