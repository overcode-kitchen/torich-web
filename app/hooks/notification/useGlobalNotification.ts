'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '../auth/useAuth'
import { toastError, TOAST_MESSAGES } from '@/app/utils/toast'
import { useFCMToken } from './useFCMToken'

/** 조회 결과를 '읽었다/못 읽었다'로 갈라 돌려준다. 실패를 값으로 폴백하지 않기 위한 구분이다. */
type GlobalNotificationLoad = { ok: true; enabled: boolean } | { ok: false }

async function loadGlobalNotification(userId: string): Promise<GlobalNotificationLoad> {
  try {
    const client = createClient()
    const { data, error } = await client
      .from('user_settings')
      .select('notification_global_enabled')
      .eq('user_id', userId)
      .single()

    // PGRST116 = 행 없음 → 아직 설정을 만든 적 없는 신규 사용자. 컬럼 기본값(켜짐)으로 확정한다.
    if (error) {
      if (error.code === 'PGRST116') return { ok: true, enabled: true }
      return { ok: false }
    }

    return { ok: true, enabled: data?.notification_global_enabled ?? true }
  } catch {
    return { ok: false }
  }
}

/**
 * 전체 알림 설정.
 *
 * `notificationOn`은 세 상태다 — `null`(아직 모름·읽기 실패) / `true` / `false`.
 * boolean 하나로는 "모름"을 표현할 수 없어, 조회에 실패해도 화면이 '켜짐'을 확정처럼 보여주고
 * 그 값을 뒤집어 저장하는 문제가 있었다(#153). 모르는 값으로는 토글하지 않는다.
 */
export interface GlobalNotificationOptions {
  /**
   * 조회 실패를 토스트로 알릴지. 이 훅은 설정 화면 외에 상세 화면 2곳에서도 읽기 전용으로 쓰이므로,
   * 기본값은 조용히 두고 사용자가 값을 조작하는 설정 화면에서만 켠다.
   */
  notifyOnLoadFailure?: boolean
}

export function useGlobalNotification({ notifyOnLoadFailure = false }: GlobalNotificationOptions = {}) {
  const { user } = useAuth()
  const supabase = createClient()
  const { registerFCMToken } = useFCMToken()
  const [notificationOn, setNotificationOn] = useState<boolean | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    let alive = true

    void (async () => {
      const result = await loadGlobalNotification(userId)
      if (!alive) return

      if (!result.ok) {
        // 확정하지 않는다. 모르는 값을 켜짐으로 보여주면 그걸 뒤집어 저장하게 된다.
        setLoadFailed(true)
        if (notifyOnLoadFailure) toastError(TOAST_MESSAGES.settingsLoadFailed)
        return
      }
      setLoadFailed(false)
      setNotificationOn(result.enabled)
    })()

    return () => {
      alive = false
    }
  }, [userId, notifyOnLoadFailure])

  const retryLoad = useCallback(async () => {
    if (!userId) return

    const result = await loadGlobalNotification(userId)
    if (!result.ok) {
      setLoadFailed(true)
      if (notifyOnLoadFailure) toastError(TOAST_MESSAGES.settingsLoadFailed)
      return
    }
    setLoadFailed(false)
    setNotificationOn(result.enabled)
  }, [userId, notifyOnLoadFailure])

  const toggleNotification = async () => {
    if (!user) return
    // 값을 모르면 토글하지 않는다 — 사용자 의도와 반대로 저장되는 경로를 여기서 끊는다.
    if (notificationOn === null) return

    const next = !notificationOn
    setNotificationOn(next)

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        notification_global_enabled: next
      }, { onConflict: 'user_id' })

    if (error) {
      setNotificationOn(!next)
      toastError(TOAST_MESSAGES.notificationSettingsSaveFailed)
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
    /** 조회에 실패해 값을 확정하지 못한 상태 */
    loadFailed,
    /** 실패 후 재조회 */
    retryLoad,
  }
}
