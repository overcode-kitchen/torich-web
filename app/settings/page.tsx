'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useSettingsAuth } from '@/app/hooks/useSettingsAuth'
import { useGlobalNotification } from '@/app/hooks/useGlobalNotification'
import { CircleNotch } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { SettingsSection } from '@/app/components/SettingsSection'
import { ThemeSelector } from '@/app/components/ThemeSelector'
import { BrandStorySheet } from '@/app/components/BrandStorySheet'
import { useTheme } from '@/app/components/ThemeProvider'

export default function SettingsPage() {
  const { user, isLoading, isLoggingOut, handleLogout } = useSettingsAuth()
  const { notificationOn, toggleNotification } = useGlobalNotification()
  const { theme, setTheme } = useTheme()
  const [isBrandStoryOpen, setIsBrandStoryOpen] = useState(false)

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
      <div className="max-w-md mx-auto px-4 py-6 pb-24 space-y-4">
        <h1 className="text-xl font-bold text-foreground mb-6">설정</h1>

        {/* 다크모드 */}
        <SettingsSection title="표시">
          <div className="px-4 pb-4">
            <ThemeSelector theme={theme} setTheme={setTheme} />
          </div>
        </SettingsSection>

        {/* 알림 설정 */}
        <SettingsSection title="알림">
          {/* 전체 알림 토글 */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border-subtle">
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
            className="flex items-center justify-between px-4 py-3 border-t border-border-subtle hover:bg-surface-hover transition-colors"
          >
            <div className="flex flex-col">
              <span className="text-foreground font-medium">알림 상세 설정</span>
              <span className="text-xs text-muted-foreground mt-1">
                투자 리마인더, 서비스 알림, 방해금지 시간을 한 번에 관리해요.
              </span>
            </div>
            <span className="ml-3 text-foreground-subtle text-lg" aria-hidden="true">
              ›
            </span>
          </Link>
        </SettingsSection>

        {/* 계정 */}
        <SettingsSection title="계정">
          <div className="px-4 py-3 border-t border-border-subtle">
            <p className="text-sm text-muted-foreground">로그인된 이메일</p>
            <p className="text-foreground font-medium mt-0.5">{user.email || '-'}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full px-4 py-3 text-left text-destructive font-medium hover:bg-destructive/10 dark:hover:bg-destructive/20 transition-colors border-t border-border-subtle"
          >
            {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
          </button>
        </SettingsSection>

        {/* 브랜드 스토리 */}
        <SettingsSection title="브랜드 스토리">
          <button
            type="button"
            onClick={() => setIsBrandStoryOpen(true)}
            className="w-full flex items-center justify-between px-4 py-3 border-t border-border-subtle hover:bg-surface-hover transition-colors"
            aria-haspopup="dialog"
            aria-expanded={isBrandStoryOpen}
          >
            <div className="flex flex-col items-start">
              <span className="text-foreground font-medium">토리치가 궁금하다면</span>
              <span className="text-sm text-muted-foreground mt-0.5">
                이름에 담긴 의미와 우리가 추구하는 방향을 소개해요.
              </span>
            </div>
            <span className="ml-3 text-foreground-subtle text-lg" aria-hidden="true">
              ›
            </span>
          </button>
        </SettingsSection>

        <BrandStorySheet
          isOpen={isBrandStoryOpen}
          onClose={() => setIsBrandStoryOpen(false)}
        />

        {/* 앱 정보 */}
        <SettingsSection title="앱 정보">
          <div className="px-4 py-3 border-t border-border-subtle flex justify-between items-center">
            <span className="text-foreground">버전</span>
            <span className="text-muted-foreground text-sm">1.0.0</span>
          </div>
          <a
            href="mailto:support@torich.app"
            className="block px-4 py-3 text-foreground font-medium hover:bg-surface-hover border-t border-border-subtle"
          >
            문의하기
          </a>
          <a
            href="#"
            className="block px-4 py-3 text-foreground-muted text-sm hover:bg-surface-hover border-t border-border-subtle"
          >
            이용약관
          </a>
          <a
            href="#"
            className="block px-4 py-3 text-foreground-muted text-sm hover:bg-surface-hover border-t border-border-subtle"
          >
            개인정보처리방침
          </a>
        </SettingsSection>
      </div>
    </main>
  )
}

