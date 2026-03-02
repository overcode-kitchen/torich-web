'use client'

import { useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { defaultNotificationSettings } from '@/app/utils/notification-settings'

/**
 * 로그인된 유저에 대해 user_settings 행이 없으면 최초 1회 디폴트값으로 생성.
 * user_id는 불변값이므로, 동일 유저에 대해 한 번만 upsert 시도.
 */
export function useEnsureUserSettings(userId: string | undefined) {
  const supabase = useMemo(() => createClient(), [])
  const ensuredIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!userId) return
    if (ensuredIdsRef.current.has(userId)) return

    const ensure = async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle()

      // 행이 없을 때만 디폴트로 upsert (PGRST116 = no rows, 또는 data === null)
      const hasNoRow = error?.code === 'PGRST116' || (!error && data === null)
      if (!hasNoRow) {
        if (data) ensuredIdsRef.current.add(userId)
        return
      }

      const { error: upsertError } = await supabase.from('user_settings').upsert(
        {
          user_id: userId,
          notification_global_enabled: true,
          notification_default_time: defaultNotificationSettings.defaultTime,
          notification_pre_reminder: defaultNotificationSettings.preReminder,
          notification_re_reminder_enabled: defaultNotificationSettings.reReminderOn,
          notification_streak_enabled: defaultNotificationSettings.streakOn,
          notification_service_announcement_enabled: defaultNotificationSettings.serviceAnnouncementsOn,
          theme: 'system',
          show_monthly_amount: true,
        },
        { onConflict: 'user_id' }
      )

      if (!upsertError) {
        ensuredIdsRef.current.add(userId)
      } else {
        console.warn('Failed to ensure user_settings:', upsertError)
      }
    }

    ensure()
  }, [userId])
}
