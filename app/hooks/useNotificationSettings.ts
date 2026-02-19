'use client'

import { useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from './useAuth'
import type { PreReminderOption, UseNotificationSettingsReturn } from './types/useNotificationSettings'
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
      console.error('Error updating notification settings:', error)
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
  const toggleStreak = createToggle('streakOn')
  const toggleServiceAnnouncements = createToggle('serviceAnnouncementsOn')
  const toggleDnd = createToggle('dndOn')

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

