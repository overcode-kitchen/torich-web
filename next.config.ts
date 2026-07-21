import type { NextConfig } from "next";
import { version as pkgVersion } from "./package.json";

const isApp = process.env.BUILD_TARGET === 'app';

/**
 * 실기기 라이브 리로드 시 dev 서버에 접속하는 아이폰의 출처(맥 LAN IP).
 * Next는 dev 서버의 /_next/* 를 다른 출처에서 요청하면 경고하고, 다음 메이저에서 차단한다.
 * `npm run dev:app`이 넣어주는 NEXT_PUBLIC_API_URL에서 호스트를 뽑아 자동으로 허용한다.
 * dev 전용 옵션이므로 릴리즈 빌드에는 관여하지 않는다.
 */
const devOrigin = (() => {
  if (process.env.NODE_ENV === 'production') return null;
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? '').hostname || null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  ...(isApp && {
    output: 'export',
  }),

  ...(devOrigin && { allowedDevOrigins: [devOrigin] }),

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