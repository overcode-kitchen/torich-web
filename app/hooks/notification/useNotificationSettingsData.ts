'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { NotificationSettingsState } from '../types/useNotificationSettings'
import { defaultNotificationSettings, mapDbDataToSettings } from '@/app/utils/notification-settings'

export function useNotificationSettingsData(userId: string | undefined) {
  const supabase = createClient()
  const [settings, setSettings] = useState<NotificationSettingsState>(defaultNotificationSettings)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is not found
          console.error('Error fetching settings:', error)
          return
        }

        if (data) {
          setSettings(mapDbDataToSettings(data))
        }
      } catch (err) {
        console.error('Failed to load settings', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [userId, supabase])

  return {
    settings,
    setSettings,
    loading,
  }
}
