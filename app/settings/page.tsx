'use client'

import Link from 'next/link'
import { useSettingsAuth } from '@/app/hooks/useSettingsAuth'
import { useGlobalNotification } from '@/app/hooks/useGlobalNotification'
import { useSettingsPageUI } from '@/app/hooks/useSettingsPageUI'
import { CircleNotch } from '@phosphor-icons/react'
import { Switch } from '@/components/ui/switch'
import { SettingsSection } from '@/app/components/SettingsSection'
import { ThemeSelector } from '@/app/components/ThemeSelector'
import { BrandStorySheet } from '@/app/components/BrandStorySheet'
import { useTheme } from '@/app/components/ThemeProvider'

export default function SettingsPage() {
  const { user, isLoading, isLoggingOut, handleLogout } = useSettingsAuth()
  const { notificationOn, toggleNotification } = useGlobalNotification()
  const { theme, setTheme } = useTheme()
  const { isBrandStoryOpen, openBrandStory, closeBrandStory } = useSettingsPageUI()

  if (isLoading) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <CircleNotch className="w-8 h-8 animate-spin text-muted-foreground" />
      </main>
    )
  }

  if (!user) {
    return null
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">
        <h1 className="text-xl font-bold text-foreground mb-6">설정</h1>

        {/* 테마 설정 카드 (전용 스타일) */}
        <section className="bg-card rounded-2xl px-4 py-4">
          <ThemeSelector theme={theme} setTheme={setTheme} />
        </section>

        {/* 알림 설정 */}
        <SettingsSection title="알림">
          {/* 전체 알림 토글 */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-foreground font-medium">전체 알림</span>
            <Switch
              checked={notificationOn}
              onCheckedChange={toggleNotification}
              aria-label="전체 알림"
            />
          </div>

          {/* 알림 상세 설정으로 이동 */}
          <Link
            href="/settings/notifications"
            className="flex items-center justify-between px-4 py-3 hover:bg-surface-hover transition-colors"
          >
            <div className="flex flex-col">
              <span className="text-foreground font-medium">알림 상세 설정</span>
            </div>
            <span className="ml-3 text-foreground-subtle text-lg" aria-hidden="true">
              ›
            </span>
          </Link>
        </SettingsSection>

        {/* 계정 */}
        <SettingsSection title="계정">
          <div className="px-4 py-3">
            <p className="text-foreground font-medium">{user.email || '-'}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full px-4 py-3 text-left text-destructive font-medium hover:bg-destructive/10 dark:hover:bg-destructive/20 transition-colors"
          >
            {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
          </button>
        </SettingsSection>

        {/* 브랜드 스토리 */}
        <SettingsSection title="브랜드 스토리">
          <button
            type="button"
            onClick={openBrandStory}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-hover transition-colors"
            aria-haspopup="dialog"
            aria-expanded={isBrandStoryOpen}
          >
            <div className="flex flex-col items-start">
              <span className="text-foreground font-medium">토리치가 궁금하다면</span>
            </div>
            <span className="ml-3 text-foreground-subtle text-lg" aria-hidden="true">
              ›
            </span>
          </button>
        </SettingsSection>

        <BrandStorySheet
          isOpen={isBrandStoryOpen}
          onClose={closeBrandStory}
        />

        {/* 앱 정보 */}
        <SettingsSection title="앱 정보">
          <div className="px-4 py-3 flex justify-between items-center">
            <span className="text-foreground">버전</span>
            <span className="text-muted-foreground text-sm">1.0.0</span>
          </div>
          <a
            href="mailto:support@torich.app"
            className="block px-4 py-3 text-foreground font-medium hover:bg-surface-hover"
          >
            문의하기
          </a>
          <a
            href="#"
            className="block px-4 py-3 text-foreground-muted text-sm hover:bg-surface-hover"
          >
            이용약관
          </a>
          <a
            href="#"
            className="block px-4 py-3 text-foreground-muted text-sm hover:bg-surface-hover"
          >
            개인정보처리방침
          </a>
        </SettingsSection>
      </div>
    </main>
  )
}

