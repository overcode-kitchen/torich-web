import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Toaster } from "sonner";
import "./globals.css";
import AppLayout from "./components/AppLayout";
import ThemeProvider from "./components/ThemeSections/ThemeProvider";

import NotificationProvider from "@/providers/NotificationProvider";
import AuthDeepLinkHandler from "./components/AuthDeepLinkHandler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://torich.app"),
  title: "토리치 - 매달 투자, 까먹지 않게",
  description:
    "적립식 투자 알림과 납입 관리를 한 곳에서. 매월 투자일 알림, 완료 체크, 투자 현황을 한눈에 확인하세요.",
  keywords: ["적립식 투자", "투자 알림", "복리 계산기", "투자 관리", "납입 관리"],
  authors: [{ name: "토리치" }],
  creator: "토리치",
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.png?v=7",
  },
  openGraph: {
    title: "토리치 - 매달 투자, 까먹지 않게",
    description: "적립식 투자 알림과 납입 관리를 한 곳에서.",
    url: "https://torich.app",
    siteName: "토리치",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "토리치 - 적립식 투자 관리",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "토리치 - 매달 투자, 까먹지 않게",
    description: "적립식 투자 알림과 납입 관리를 한 곳에서.",
    images: ["/og-image.png"],
  },
};

/**
 * Capacitor WebView: viewport-fit=cover로 상태바/노치 대응.
 * maximumScale + userScalable로 더블탭/핀치 확대 완화(앱형 UI).
 * (브라우저 접근성상 확대 불가 — 동일 빌드로 웹 배포 시 정책 검토)
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <NotificationProvider>
            <AuthDeepLinkHandler />
            <AppLayout>{children}</AppLayout>
            <Toaster richColors position="top-center" closeButton />
          </NotificationProvider>
          {process.env.NEXT_PUBLIC_GA_ID && (
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
