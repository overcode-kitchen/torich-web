'use client'

import { CircleNotch } from '@phosphor-icons/react'
import { Switch } from '@/components/ui/switch'
import { SettingsSection } from './SettingsSection'
import { ThemeSelector } from '@/app/components/ThemeSections/ThemeSelector'
import { BrandStorySheet } from '@/app/components/BrandStorySheet'
import { SettingsItem } from './SettingsItem'
import type { Theme } from '@/app/components/ThemeSections/ThemeProvider'

interface SettingsViewProps {
    // Auth
    user: { id: string; email?: string } | null
    isLoading: boolean
    isLoggingOut: boolean
    handleLogout: () => Promise<void>

    // Notification
    notificationOn: boolean
    toggleNotification: () => void

    // Theme
    theme: Theme
    setTheme: (theme: Theme) => void

    // UI
    isBrandStoryOpen: boolean
    openBrandStory: () => void
    closeBrandStory: () => void
}

export default function SettingsView({
    user,
    isLoading,
    isLoggingOut,
    handleLogout,
    notificationOn,
    toggleNotification,
    theme,
    setTheme,
    isBrandStoryOpen,
    openBrandStory,
    closeBrandStory,
}: SettingsViewProps) {
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
        <main
            className="min-h-screen bg-surface"
            style={{
                // 앱바 실제 높이(safe area + 48px) + 여유 8px
                paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 44px) + 48px + 8px)',
            }}
        >
            {/* 앱바: 배경은 화면 맨 위까지, 콘텐츠는 상태바 아래로만 (Safe Area) */}
            <header
                className="fixed inset-x-0 top-0 z-30 w-full bg-surface"
                style={{
                    paddingTop: 'max(env(safe-area-inset-top, 0px), 44px)',
                }}
            >
                <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto px-4">
                    <div className="h-12 min-h-[48px] max-h-[48px] flex items-center shrink-0">
                        <h1 className="text-xl font-bold text-foreground">설정</h1>
                    </div>
                </div>
            </header>

            <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto px-4 pb-24 space-y-4">
                {/* 테마 설정 카드 (전용 스타일) */}
                <section className="bg-card rounded-2xl px-4 py-4 mt-2">
                    <ThemeSelector theme={theme} setTheme={setTheme} />
                </section>

                {/* 알림 설정 */}
                <SettingsSection title="알림">
                    <SettingsItem
                        label="전체 알림"
                        rightElement={
                            <Switch
                                checked={notificationOn}
                                onCheckedChange={toggleNotification}
                                aria-label="전체 알림"
                            />
                        }
                    />
                    <SettingsItem
                        label="알림 상세 설정"
                        href="/settings/notifications"
                    />
                </SettingsSection>

                {/* 계정 */}
                <SettingsSection title="계정">
                    <SettingsItem
                        label={user.email || '-'}
                    />
                    <SettingsItem
                        label={isLoggingOut ? '로그아웃 중...' : '로그아웃'}
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        destructive
                        showChevron={false}
                    />
                </SettingsSection>

                {/* 브랜드 스토리 */}
                <SettingsSection title="브랜드 스토리">
                    <SettingsItem
                        label="토리치가 궁금하다면"
                        onClick={openBrandStory}
                    />
                </SettingsSection>

                <BrandStorySheet
                    isOpen={isBrandStoryOpen}
                    onClose={closeBrandStory}
                />

                {/* 앱 정보 */}
                <SettingsSection title="앱 정보">
                    <SettingsItem
                        label="버전"
                        rightElement={<span className="text-muted-foreground text-sm">1.0.0</span>}
                    />
                    <SettingsItem
                        label="문의하기"
                        href="mailto:support@torich.app"
                    />
                    <SettingsItem
                        label="이용약관"
                        href="#"
                    />
                    <SettingsItem
                        label="개인정보처리방침"
                        href="#"
                    />
                </SettingsSection>
            </div>
        </main>
    )
}
