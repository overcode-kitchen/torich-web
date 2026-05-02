'use client'

import SubPageScaffold from '@/app/components/SubPageScaffold'
import { SettingsSection } from './SettingsSection'
import { NotificationReminderSection } from '@/app/components/SettingsSections/NotificationReminderSection'
import { NotificationServiceSection } from '@/app/components/SettingsSections/NotificationServiceSection'
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
    toggleSkipWeekendHoliday,
    onBack,
}: NotificationSettingsViewProps) {
    return (
        <SubPageScaffold onBack={onBack} contentClassName="py-2 space-y-6">
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
                    skipWeekendHolidayOn={settings.skipWeekendHolidayOn}
                    onToggleSkipWeekendHoliday={toggleSkipWeekendHoliday}
                />
            </SettingsSection>

            {/* 서비스 알림 */}
            <SettingsSection title="서비스 알림">
                <NotificationServiceSection
                    serviceAnnouncementsOn={settings.serviceAnnouncementsOn}
                    onToggleServiceAnnouncements={toggleServiceAnnouncements}
                />
            </SettingsSection>
        </SubPageScaffold>
    )
}
