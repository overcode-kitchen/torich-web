'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '../auth/useAuth'
import { useFCMToken } from './useFCMToken'

export function useGlobalNotification() {
  const { user } = useAuth()
  const supabase = createClient()
  const { registerFCMToken } = useFCMToken()
  const [notificationOn, setNotificationOn] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchSetting = async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('notification_global_enabled')
        .eq('user_id', user.id)
        .single()

      if (!error && data) {
        setNotificationOn(data.notification_global_enabled ?? true)
      }
    }

    fetchSetting()
  }, [user, supabase])

  const toggleNotification = async () => {
    if (!user) return

    const next = !notificationOn
    setNotificationOn(next)

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        notification_global_enabled: next
      }, { onConflict: 'user_id' })

    if (error) {
      console.error('Failed to update global notification', error)
      // Optionally revert state
      return
    }

    // notification_global_enabled가 ON으로 바뀔 때 FCM 토큰 등록
    if (next) {
      await registerFCMToken(user)
    }
  }

  return {
    notificationOn,
    toggleNotification,
  }
}
