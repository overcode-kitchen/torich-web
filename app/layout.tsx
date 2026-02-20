import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// import { GoogleAnalytics } from "@next/third-parties/google";
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
  title: "토리치 - 투자 알림",
  description: "매달 꾸준히 적립 투자, 복리로 미래를 계산해보세요.",
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
          </NotificationProvider>
          {/* <GoogleAnalytics gaId="G-C8E4VZ883Y" /> */}
        </ThemeProvider>
      </body>
    </html>
  );
}
