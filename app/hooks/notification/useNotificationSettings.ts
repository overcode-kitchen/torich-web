'use client'

import { useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '../auth/useAuth'
import { toastError, TOAST_MESSAGES } from '@/app/utils/toast'
import type { PreReminderOption, UseNotificationSettingsReturn } from '../types/useNotificationSettings'
import { useNotificationSettingsData } from './useNotificationSettingsData'
import { mapSettingsToDbUpdates } from '@/app/utils/notification-settings'

export function useNotificationSettings(): UseNotificationSettingsReturn {
  const { user } = useAuth()
  const supabase = createClient()
  const { settings, setSettings } = useNotificationSettingsData(user?.id)

  const updateDB = useCallback(async (partial: Partial<typeof settings>) => {
    if (!user) return

    const updates = mapSettingsToDbUpdates(partial, user.id)

    const { error } = await supabase
      .from('user_settings')
      .upsert(updates, { onConflict: 'user_id' })

    if (error) {
      toastError(TOAST_MESSAGES.notificationSettingsSaveFailed)
    }
  }, [user, supabase])

  const updateSettings = useCallback((partial: Partial<typeof settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial }
      updateDB(partial) // Optimistic update
      return next
    })
  }, [setSettings, updateDB])

  const createToggle = useCallback((key: keyof typeof settings) => {
    return () => {
      setSettings((prev) => {
        const next = !prev[key]
        updateDB({ [key]: next } as Partial<typeof settings>)
        return { ...prev, [key]: next } as typeof settings
      })
    }
  }, [setSettings, updateDB])

  const setDefaultTime = useCallback((time: string) => {
    updateSettings({ defaultTime: time })
  }, [updateSettings])

  const setPreReminder = useCallback((preReminder: PreReminderOption) => {
    updateSettings({ preReminder })
  }, [updateSettings])

  const toggleReReminder = createToggle('reReminderOn')
  const toggleServiceAnnouncements = createToggle('serviceAnnouncementsOn')
  const toggleSkipWeekendHoliday = createToggle('skipWeekendHolidayOn')

  return {
    settings,
    setDefaultTime,
    setPreReminder,
    toggleReReminder,
    toggleServiceAnnouncements,
    toggleSkipWeekendHoliday,
  }
}

