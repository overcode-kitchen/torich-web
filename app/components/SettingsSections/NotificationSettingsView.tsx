'use client'

import { ArrowLeft } from '@phosphor-icons/react'
import { SettingsSection } from './SettingsSection'
import { NotificationReminderSection } from '@/app/components/SettingsSections/NotificationReminderSection'
import { NotificationServiceSection } from '@/app/components/SettingsSections/NotificationServiceSection'
import { useIsNativeApp } from '@/app/hooks/platform/useIsNativeApp'
import type { UseNotificationSettingsReturn } from '@/app/hooks/types/useNotificationSettings'

interface NotificationSettingsViewProps extends UseNotificationSettingsReturn {
    onBack: () => void
}

export default function NotificationSettingsView({
    settings,
    setDefaultTime,
    setPreReminder,
    toggleReReminder,
    toggleServiceAnnouncements,
    onBack,
}: NotificationSettingsViewProps) {
    const isNativeApp = useIsNativeApp()
    // SettingsView와 동일: 앱(WebView)에서 상태바·노치 아래로 헤더를 내림
    const headerSafeTop = isNativeApp ? 'max(env(safe-area-inset-top, 0px), 44px)' : '0px'
    const toolbarHeightPx = 52
    const contentPaddingTop = isNativeApp
        ? `calc(max(env(safe-area-inset-top, 0px), 44px) + ${toolbarHeightPx}px + 8px)`
        : `${toolbarHeightPx + 8}px`

    return (
        <main className="min-h-screen bg-surface" style={{ paddingTop: contentPaddingTop }}>
            {/* 상단 헤더: safe area 아래에 툴바 고정 (AppLayout이 상단 SafeArea 패딩을 끈 화면) */}
            <header
                className="fixed inset-x-0 top-0 z-30 w-full bg-surface"
                style={{ paddingTop: headerSafeTop }}
            >
                <div className="h-[52px] flex items-center px-2">
                    <button
                        type="button"
                        onClick={onBack}
                        className="p-2 text-foreground-soft hover:text-foreground transition-colors"
                        aria-label="뒤로가기"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                </div>
            </header>

            <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto px-4 py-2 pb-20 space-y-6">
                <div className="mb-4">
                    <h1 className="text-xl font-bold text-foreground mb-1">알림 설정</h1>
                    <p className="text-sm text-foreground-subtle">
                        투자 리마인더와 서비스 알림을 한 번에 관리해요.
                    </p>
                </div>

                {/* 투자 리마인더 */}
                <SettingsSection title="투자 리마인더">
                    <NotificationReminderSection
                        defaultTime={settings.defaultTime}
                        onDefaultTimeChange={setDefaultTime}
                        preReminder={settings.preReminder}
                        onPreReminderChange={setPreReminder}
                        reReminderOn={settings.reReminderOn}
                        onToggleReReminder={toggleReReminder}
                    />
                </SettingsSection>

                {/* 서비스 알림 */}
                <SettingsSection title="서비스 알림">
                    <NotificationServiceSection
                        serviceAnnouncementsOn={settings.serviceAnnouncementsOn}
                        onToggleServiceAnnouncements={toggleServiceAnnouncements}
                    />
                </SettingsSection>
            </div>
        </main>
    )
}
