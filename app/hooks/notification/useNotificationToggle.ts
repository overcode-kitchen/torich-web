'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '../auth/useAuth'

export function useNotificationToggle(itemId: string) {
  const { user } = useAuth()
  const supabase = createClient()
  const [notificationOn, setNotificationOn] = useState(true)

  useEffect(() => {
    if (!user || !itemId) return

    const fetchSetting = async () => {
      const { data, error } = await supabase
        .from('records')
        .select('notification_enabled')
        .eq('id', itemId)
        .single()

      if (!error && data) {
        setNotificationOn(data.notification_enabled ?? true)
      }
    }

    fetchSetting()
  }, [user, itemId, supabase])

  const toggleNotification = async () => {
    if (!user || !itemId) return

    const next = !notificationOn
    setNotificationOn(next)

    const { error } = await supabase
      .from('records')
      .update({ notification_enabled: next })
      .eq('id', itemId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Failed to toggle notification for item', error)
    }
  }

  return { notificationOn, toggleNotification }
}
