'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY_PREFIX = 'torich_notification_'

export function useNotificationToggle(itemId: string) {
  const [notificationOn, setNotificationOn] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${itemId}`)
      setNotificationOn(stored === null ? true : stored === '1')
    }
  }, [itemId])

  const toggleNotification = () => {
    const next = !notificationOn
    setNotificationOn(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${itemId}`, next ? '1' : '0')
    }
  }

  return { notificationOn, toggleNotification }
}
