'use client'

import { useEffect, useState } from 'react'

type PreReminderOption = 'none' | 'same_day' | '1d' | '2d' | '3d' | '1w'

interface NotificationSettingsState {
  defaultTime: string
  preReminder: PreReminderOption
  reReminderOn: boolean
  streakOn: boolean
  serviceAnnouncementsOn: boolean
  dndOn: boolean
  dndStart: string
  dndEnd: string
}

const STORAGE_KEY = 'torich_notification_settings_v1'

const defaultSettings: NotificationSettingsState = {
  defaultTime: '09:00',
  preReminder: '1d',
  reReminderOn: true,
  streakOn: true,
  serviceAnnouncementsOn: true,
  dndOn: false,
  dndStart: '22:00',
  dndEnd: '08:00',
}

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettingsState>(defaultSettings)

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<NotificationSettingsState>
        setSettings((prev) => ({
          ...prev,
          ...parsed,
        }))
      }
    } catch (error) {
      console.error('Failed to load notification settings', error)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save notification settings', error)
    }
  }, [settings])

  const updateSettings = (partial: Partial<NotificationSettingsState>) => {
    setSettings((prev) => ({
      ...prev,
      ...partial,
    }))
  }

  const setDefaultTime = (time: string) => {
    updateSettings({ defaultTime: time })
  }

  const setPreReminder = (preReminder: PreReminderOption) => {
    updateSettings({ preReminder })
  }

  const toggleReReminder = () => {
    updateSettings({ reReminderOn: !settings.reReminderOn })
  }

  const toggleStreak = () => {
    updateSettings({ streakOn: !settings.streakOn })
  }

  const toggleServiceAnnouncements = () => {
    updateSettings({ serviceAnnouncementsOn: !settings.serviceAnnouncementsOn })
  }

  const toggleDnd = () => {
    updateSettings({ dndOn: !settings.dndOn })
  }

  const setDndStart = (time: string) => {
    updateSettings({ dndStart: time })
  }

  const setDndEnd = (time: string) => {
    updateSettings({ dndEnd: time })
  }

  return {
    settings,
    setDefaultTime,
    setPreReminder,
    toggleReReminder,
    toggleStreak,
    toggleServiceAnnouncements,
    toggleDnd,
    setDndStart,
    setDndEnd,
  }
}

