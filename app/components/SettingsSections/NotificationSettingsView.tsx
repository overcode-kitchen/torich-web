'use client'

import { ArrowLeft } from '@phosphor-icons/react'
import { SettingsSection } from './SettingsSection'
import { NotificationReminderSection } from '@/app/components/SettingsSections/NotificationReminderSection'
import { NotificationServiceSection } from '@/app/components/SettingsSections/NotificationServiceSection'
import { NotificationDndSection } from '@/app/components/SettingsSections/NotificationDndSection'
import type { UseNotificationSettingsReturn } from '@/app/hooks/types/useNotificationSettings'

interface NotificationSettingsViewProps extends UseNotificationSettingsReturn {
    onBack: () => void
}

export default function NotificationSettingsView({
    settings,
    setDefaultTime,
    setPreReminder,
    toggleReReminder,
    toggleStreak,
    toggleServiceAnnouncements,
    toggleDnd,
    setDndStart,
    setDndEnd,
    onBack,
}: NotificationSettingsViewProps) {
    return (
        <main className="min-h-screen bg-surface">
            {/* 상단 헤더 */}
            <header className="h-[52px] flex items-center px-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="p-2 text-foreground-soft hover:text-foreground transition-colors"
                    aria-label="뒤로가기"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
            </header>

            <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto px-4 py-2 pb-20 space-y-6">
                <div className="mb-4">
                    <h1 className="text-xl font-bold text-foreground mb-1">알림 설정</h1>
                    <p className="text-sm text-foreground-subtle">
                        투자 리마인더와 서비스 알림, 방해금지 시간을 한 번에 관리해요.
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
                        streakOn={settings.streakOn}
                        onToggleStreak={toggleStreak}
                    />
                </SettingsSection>

                {/* 서비스 알림 */}
                <SettingsSection title="서비스 알림">
                    <NotificationServiceSection
                        serviceAnnouncementsOn={settings.serviceAnnouncementsOn}
                        onToggleServiceAnnouncements={toggleServiceAnnouncements}
                    />
                </SettingsSection>

                {/* 방해금지 */}
                <SettingsSection title="방해금지">
                    <NotificationDndSection
                        dndOn={settings.dndOn}
                        onToggleDnd={toggleDnd}
                        dndStart={settings.dndStart}
                        dndEnd={settings.dndEnd}
                        onDndStartChange={setDndStart}
                        onDndEndChange={setDndEnd}
                    />
                </SettingsSection>
            </div>
        </main>
    )
}
