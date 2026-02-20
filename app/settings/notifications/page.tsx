'use client'

import { useRouter } from 'next/navigation'
import { useNotificationSettings } from '@/app/hooks/notification/useNotificationSettings'
import NotificationSettingsView from '@/app/components/SettingsSections/NotificationSettingsView'

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

  return (
    <NotificationSettingsView
      settings={settings}
      setDefaultTime={setDefaultTime}
      setPreReminder={setPreReminder}
      toggleReReminder={toggleReReminder}
      toggleStreak={toggleStreak}
      toggleServiceAnnouncements={toggleServiceAnnouncements}
      onBack={() => router.back()}
    />
  )
}

