import type { NextConfig } from "next";
import { version as pkgVersion } from "./package.json";

const isApp = process.env.BUILD_TARGET === 'app';

const nextConfig: NextConfig = {
  ...(isApp && {
    output: 'export',
  }),

  env: {
    NEXT_PUBLIC_APP_VERSION: pkgVersion,
    NEXT_PUBLIC_APP_STORE_ID: process.env.NEXT_PUBLIC_APP_STORE_ID ?? '',
  },

  experimental: {
    optimizePackageImports: ["@phosphor-icons/react"],
  },
  
  images: {
    unoptimized: isApp,
    ...(!isApp && {
      formats: ["image/avif", "image/webp"],
    }),
    // 로컬 이미지 패턴 (query string 허용: 캐시 무효화용 ?v= 등)
    localPatterns: [
      { pathname: "/images/**" },
      { pathname: "/icons/**" },
    ],
  },
};

export default nextConfig;