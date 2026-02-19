'use client'

import { useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { FirebaseMessaging } from '@capacitor-firebase/messaging'
import { getMessaging, getToken, type Messaging } from 'firebase/messaging'
import { app } from '@/lib/firebase'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'

type Platform = 'ios' | 'web'

/**
 * UUID v4 생성 함수
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Web 플랫폼의 device_id를 localStorage에서 가져오거나 생성
 */
function getOrCreateWebDeviceId(): string {
  if (typeof window === 'undefined') {
    return generateUUID()
  }

  const stored = localStorage.getItem('device_id')
  if (stored) {
    return stored
  }

  const newDeviceId = generateUUID()
  localStorage.setItem('device_id', newDeviceId)
  return newDeviceId
}

/**
 * Native 플랫폼의 device_id 가져오기
 */
async function getNativeDeviceId(): Promise<string> {
  try {
    // @capacitor/device 패키지가 설치되어 있다면 사용
    const { Device } = await import('@capacitor/device')
    const deviceInfo = await Device.getId()
    return deviceInfo.identifier
  } catch (error) {
    // 패키지가 없거나 실패 시 UUID 생성
    console.warn('Failed to get device ID, using UUID:', error)
    return generateUUID()
  }
}

/**
 * Native 플랫폼에서 FCM 토큰 가져오기
 */
async function getNativeFCMToken(): Promise<string | null> {
  try {
    // PushNotifications 등록
    await PushNotifications.register()

    // FirebaseMessaging에서 토큰 가져오기
    const { token } = await FirebaseMessaging.getToken()
    return token || null
  } catch (error) {
    console.error('Failed to get native FCM token:', error)
    return null
  }
}

/**
 * Web 플랫폼에서 FCM 토큰 가져오기
 */
async function getWebFCMToken(): Promise<string | null> {
  try {
    // 브라우저 환경 확인
    if (typeof window === 'undefined') {
      console.warn('getWebFCMToken can only be called in browser environment')
      return null
    }

    // Notification 권한 요청
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn('Notification permission not granted')
      return null
    }

    // Firebase Messaging 초기화
    const messaging = getMessaging(app) as Messaging

    // VAPID 키 확인
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    if (!vapidKey) {
      console.error('NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set')
      return null
    }

    // FCM 토큰 가져오기
    const token = await getToken(messaging, { vapidKey })
    return token || null
  } catch (error) {
    console.error('Failed to get web FCM token:', error)
    return null
  }
}

/**
 * FCM 토큰을 Supabase에 저장
 */
async function saveTokenToDB(
  user: User,
  token: string,
  platform: Platform,
  deviceId: string
): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('user_push_tokens')
      .upsert(
        {
          user_id: user.id,
          token,
          platform,
          device_id: deviceId,
        },
        { onConflict: 'user_id, device_id' }
      )

    if (error) {
      console.error('Failed to save FCM token to DB:', error)
      return false
    }

    console.log('✅ FCM token saved to DB')
    return true
  } catch (error) {
    console.error('Error saving FCM token:', error)
    return false
  }
}

/**
 * 전역 알림 설정이 활성화되어 있는지 확인
 */
async function isGlobalNotificationEnabled(user: User): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('user_settings')
      .select('notification_global_enabled')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking notification settings:', error)
      return true // 기본값으로 true 반환
    }

    return data?.notification_global_enabled ?? true
  } catch (error) {
    console.error('Error checking notification settings:', error)
    return true // 기본값으로 true 반환
  }
}

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
