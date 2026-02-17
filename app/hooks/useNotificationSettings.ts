'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from './useAuth'
import type { PreReminderOption, NotificationSettingsState, UseNotificationSettingsReturn } from './types/useNotificationSettings'

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
  const { user } = useAuth()
  const supabase = createClient()
  const [settings, setSettings] = useState<NotificationSettingsState>(defaultSettings)
  const [loading, setLoading] = useState(true)

  // Load settings from DB
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 is not found
          console.error('Error fetching settings:', error)
          return
        }

        if (data) {
          setSettings({
            defaultTime: data.notification_default_time || defaultSettings.defaultTime,
            preReminder: (data.notification_pre_reminder as PreReminderOption) || defaultSettings.preReminder,
            reReminderOn: data.notification_re_reminder_enabled ?? defaultSettings.reReminderOn,
            streakOn: data.notification_streak_enabled ?? defaultSettings.streakOn,
            serviceAnnouncementsOn: data.notification_service_announcement_enabled ?? defaultSettings.serviceAnnouncementsOn,
            dndOn: data.notification_dnd_enabled ?? defaultSettings.dndOn,
            dndStart: data.notification_dnd_start || defaultSettings.dndStart,
            dndEnd: data.notification_dnd_end || defaultSettings.dndEnd,
          })
        }
      } catch (err) {
        console.error('Failed to load settings', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [user, supabase])

  const updateDB = useCallback(async (partial: Partial<NotificationSettingsState>) => {
    if (!user) return

    const updates: any = { user_id: user.id }

    if (partial.defaultTime !== undefined) updates.notification_default_time = partial.defaultTime
    if (partial.preReminder !== undefined) updates.notification_pre_reminder = partial.preReminder
    if (partial.reReminderOn !== undefined) updates.notification_re_reminder_enabled = partial.reReminderOn
    if (partial.streakOn !== undefined) updates.notification_streak_enabled = partial.streakOn
    if (partial.serviceAnnouncementsOn !== undefined) updates.notification_service_announcement_enabled = partial.serviceAnnouncementsOn
    if (partial.dndOn !== undefined) updates.notification_dnd_enabled = partial.dndOn
    if (partial.dndStart !== undefined) updates.notification_dnd_start = partial.dndStart
    if (partial.dndEnd !== undefined) updates.notification_dnd_end = partial.dndEnd

    const { error } = await supabase
      .from('user_settings')
      .upsert(updates, { onConflict: 'user_id' })

    if (error) {
      console.error('Error updating notification settings:', error)
    }
  }, [user, supabase])

  const updateSettings = useCallback((partial: Partial<NotificationSettingsState>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial }
      updateDB(partial) // Optimistic update
      return next
    })
  }, [updateDB])

  const setDefaultTime = useCallback((time: string) => {
    updateSettings({ defaultTime: time })
  }, [updateSettings])

  const setPreReminder = useCallback((preReminder: PreReminderOption) => {
    updateSettings({ preReminder })
  }, [updateSettings])

  const toggleReReminder = useCallback(() => {
    setSettings((prev) => {
      const next = !prev.reReminderOn
      updateDB({ reReminderOn: next })
      return { ...prev, reReminderOn: next }
    })
  }, [updateDB])

  const toggleStreak = useCallback(() => {
    setSettings((prev) => {
      const next = !prev.streakOn
      updateDB({ streakOn: next })
      return { ...prev, streakOn: next }
    })
  }, [updateDB])

  const toggleServiceAnnouncements = useCallback(() => {
    setSettings((prev) => {
      const next = !prev.serviceAnnouncementsOn
      updateDB({ serviceAnnouncementsOn: next })
      return { ...prev, serviceAnnouncementsOn: next }
    })
  }, [updateDB])

  const toggleDnd = useCallback(() => {
    setSettings((prev) => {
      const next = !prev.dndOn
      updateDB({ dndOn: next })
      return { ...prev, dndOn: next }
    })
  }, [updateDB])

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

