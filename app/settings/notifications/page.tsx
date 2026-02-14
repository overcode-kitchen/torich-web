'use client'

import { useRouter } from 'next/navigation'
import { useNotificationSettings } from '@/app/hooks/useNotificationSettings'
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
    toggleDnd,
    setDndStart,
    setDndEnd,
  } = useNotificationSettings()

  return (
    <NotificationSettingsView
      settings={settings}
      setDefaultTime={setDefaultTime}
      setPreReminder={setPreReminder}
      toggleReReminder={toggleReReminder}
      toggleStreak={toggleStreak}
      toggleServiceAnnouncements={toggleServiceAnnouncements}
      toggleDnd={toggleDnd}
      setDndStart={setDndStart}
      setDndEnd={setDndEnd}
      onBack={() => router.back()}
    />
  )
}

