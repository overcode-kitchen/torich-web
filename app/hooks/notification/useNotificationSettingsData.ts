'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toastError, TOAST_MESSAGES } from '@/app/utils/toast'
import type { NotificationSettingsState } from '../types/useNotificationSettings'
import { defaultNotificationSettings, mapDbDataToSettings } from '@/app/utils/notification-settings'

export function useNotificationSettingsData(userId: string | undefined) {
  const [settings, setSettings] = useState<NotificationSettingsState>(defaultNotificationSettings)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchSettings = async () => {
      const supabase = createClient()
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (error && error.code !== 'PGRST116') {
          toastError(TOAST_MESSAGES.settingsLoadFailed)
          return
        }

        if (data) {
          setSettings(mapDbDataToSettings(data))
        }
      } catch {
        toastError(TOAST_MESSAGES.settingsLoadFailed)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [userId])

  return {
    settings,
    setSettings,
    loading,
  }
}
