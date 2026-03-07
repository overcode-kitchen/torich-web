'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '../auth/useAuth'
import { toastError, TOAST_MESSAGES } from '@/app/utils/toast'

export function useNotificationToggle(itemId: string) {
  const { user } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const [notificationOn, setNotificationOn] = useState(true)

  useEffect(() => {
    if (!user || !itemId) return

    const fetchSetting = async () => {
      const { data, error } = await supabase
        .from('records')
        .select('notification_enabled')
        .eq('id', itemId)
        .single()

      if (error) {
        console.warn('Failed to fetch notification_enabled for record:', itemId, error)
        return
      }
      if (data) {
        setNotificationOn(data.notification_enabled ?? true)
      }
    }

    fetchSetting()
  }, [user, itemId, supabase])

  const toggleNotification = async () => {
    if (!user || !itemId) return

    const prev = notificationOn
    const next = !prev
    setNotificationOn(next)

    const { data, error } = await supabase
      .from('records')
      .update({ notification_enabled: next })
      .eq('id', itemId)
      .eq('user_id', user.id)
      .select('id')
      .single()

    if (error || !data) {
      setNotificationOn(prev)
      toastError(TOAST_MESSAGES.notificationSettingsSaveFailed)
      return
    }

    if (!next) {
      const { error: cancelError } = await supabase
        .from('scheduled_notifications')
        .delete()
        .eq('record_id', itemId)
        .eq('status', 'pending')
      if (cancelError) {
        console.warn('Failed to cancel scheduled notifications for record:', itemId, cancelError)
      }
    }
    // 알림 ON 시 재예약은 records UPDATE 시 Database Webhook(schedule-notification)으로 처리됨
  }

  return { notificationOn, toggleNotification }
}
