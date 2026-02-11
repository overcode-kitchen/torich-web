'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const TOAST_AUTO_HIDE_MS = 4000

export interface UseToastReturn {
  showToast: boolean
  show: () => void
  hide: () => void
}

export function useToast(autoHideMs: number = TOAST_AUTO_HIDE_MS): UseToastReturn {
  const [showToast, setShowToast] = useState<boolean>(false)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearToastTimer = useCallback((): void => {
    if (toastTimerRef.current !== null) {
      clearTimeout(toastTimerRef.current)
      toastTimerRef.current = null
    }
  }, [])

  const hide = useCallback((): void => {
    clearToastTimer()
    setShowToast(false)
  }, [clearToastTimer])

  const show = useCallback((): void => {
    setShowToast(true)
    scheduleAutoHide()
  }, [])

  const scheduleAutoHide = useCallback((): void => {
    clearToastTimer()
    toastTimerRef.current = setTimeout((): void => {
      setShowToast(false)
      toastTimerRef.current = null
    }, autoHideMs)
  }, [clearToastTimer, autoHideMs])

  useEffect((): (() => void) => {
    return (): void => {
      clearToastTimer()
    }
  }, [clearToastTimer])

  return {
    showToast,
    show,
    hide,
  }
}
