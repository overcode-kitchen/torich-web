'use client'

import { useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
import type { User } from '@supabase/supabase-js'
import {
  getNativeDeviceId,
  getOrCreateWebDeviceId,
  getNativeFCMToken,
  getWebFCMToken,
  saveTokenToDB,
  isGlobalNotificationEnabled,
  type Platform,
} from '@/app/utils/fcm-token'

/**
 * FCM 토큰 등록 훅
 */
export function useFCMToken() {
  /**
   * FCM 토큰을 등록하고 DB에 저장
   */
  const registerFCMToken = useCallback(async (user: User | null): Promise<boolean> => {
    if (!user) {
      console.log('No user logged in. Skipping FCM token registration.')
      return false
    }

    // 전역 알림 설정 확인
    const isEnabled = await isGlobalNotificationEnabled(user)
    if (!isEnabled) {
      console.log('Global notifications disabled. Skipping FCM token registration.')
      return false
    }

    try {
      const isNative = Capacitor.isNativePlatform()
      const platform: Platform = isNative ? 'ios' : 'web'

      // device_id 결정
      const deviceId = isNative ? await getNativeDeviceId() : getOrCreateWebDeviceId()

      // FCM 토큰 가져오기
      const token = isNative ? await getNativeFCMToken() : await getWebFCMToken()

      if (!token) {
        console.warn('Failed to get FCM token')
        return false
      }

      console.log(`✅ FCM Token received (${platform}):`, token)

      // DB에 저장
      const success = await saveTokenToDB(user, token, platform, deviceId)
      return success
    } catch (error) {
      console.error('❌ FCM token registration error:', error)
      return false
    }
  }, [])

  return {
    registerFCMToken,
  }
}
