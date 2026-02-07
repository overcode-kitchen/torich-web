'use client'

import { useState, useEffect } from 'react'

export function useGlobalNotification() {
  const [notificationOn, setNotificationOn] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('torich_notification_global')
      setNotificationOn(stored === null ? true : stored === '1')
    }
  }, [])

  const toggleNotification = () => {
    const next = !notificationOn
    setNotificationOn(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem('torich_notification_global', next ? '1' : '0')
    }
  }

  return {
    notificationOn,
    toggleNotification,
  }
}
