'use client'

import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { PreReminderOption, NotificationSettingsState, UseNotificationSettingsReturn } from './types/useNotificationSettings'

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

export function useNotificationSettings(): UseNotificationSettingsReturn {
  const [settings, setSettings] = useLocalStorage<NotificationSettingsState>(
    STORAGE_KEY,
    defaultSettings
  )

  const updateSettings = useCallback((partial: Partial<NotificationSettingsState>) => {
    setSettings((prev) => ({
      ...prev,
      ...partial,
    }))
  }, [setSettings])

  const setDefaultTime = useCallback((time: string) => {
    updateSettings({ defaultTime: time })
  }, [updateSettings])

  const setPreReminder = useCallback((preReminder: PreReminderOption) => {
    updateSettings({ preReminder })
  }, [updateSettings])

  const toggleReReminder = useCallback(() => {
    updateSettings({ reReminderOn: !settings.reReminderOn })
  }, [updateSettings, settings.reReminderOn])

  const toggleStreak = useCallback(() => {
    updateSettings({ streakOn: !settings.streakOn })
  }, [updateSettings, settings.streakOn])

  const toggleServiceAnnouncements = useCallback(() => {
    updateSettings({ serviceAnnouncementsOn: !settings.serviceAnnouncementsOn })
  }, [updateSettings, settings.serviceAnnouncementsOn])

  const toggleDnd = useCallback(() => {
    updateSettings({ dndOn: !settings.dndOn })
  }, [updateSettings, settings.dndOn])

  const setDndStart = useCallback((time: string) => {
    updateSettings({ dndStart: time })
  }, [updateSettings])

  const setDndEnd = useCallback((time: string) => {
    updateSettings({ dndEnd: time })
  }, [updateSettings])

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

