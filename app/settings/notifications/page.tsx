'use client'

import { useRouter } from 'next/navigation'
import { useNotificationSettings } from '@/app/hooks/notification/useNotificationSettings'
import NotificationSettingsView from '@/app/components/SettingsSections/NotificationSettingsView'
import { useFlowBack } from '@/app/hooks/navigation/useFlowBack'

export default function NotificationSettingsPage() {
  const router = useRouter()
  const {
    settings,
    setDefaultTime,
    setPreReminder,
    toggleReReminder,
    toggleStreak,
    toggleServiceAnnouncements,
  } = useNotificationSettings()
  const { goBack } = useFlowBack({
    rootPath: '/settings',
    enableHistoryFallback: false,
  })

  return (
    <NotificationSettingsView
      settings={settings}
      setDefaultTime={setDefaultTime}
      setPreReminder={setPreReminder}
      toggleReReminder={toggleReReminder}
      toggleStreak={toggleStreak}
      toggleServiceAnnouncements={toggleServiceAnnouncements}
      onBack={goBack}
    />
  )
}

