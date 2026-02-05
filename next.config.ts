import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 브라우저 지원 여부를 확인하고 포맷 순서대로 변환
    // 1순위: avif (최강 압축), 2순위: webp (표준 압축)
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
