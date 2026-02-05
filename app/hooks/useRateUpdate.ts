'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type CheckResponse = {
  needsUpdate?: boolean
}

type UpdateResponse = {
  success?: boolean
  updated?: boolean
  updatedRecords?: number
}

type UseRateUpdateOptions = {
  onUpdateComplete?: () => void | Promise<void>
}

type UseRateUpdateReturn = {
  isUpdating: boolean
  showToast: boolean
  checkAndUpdate: () => Promise<boolean>
  hideToast: () => void
}

const TOAST_AUTO_HIDE_MS: number = 4000

export const useRateUpdate = (userId?: string, options?: UseRateUpdateOptions): UseRateUpdateReturn => {
  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const [showToast, setShowToast] = useState<boolean>(false)

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearToastTimer = useCallback((): void => {
    if (toastTimerRef.current !== null) {
      clearTimeout(toastTimerRef.current)
      toastTimerRef.current = null
    }
  }, [])

  const hideToast = useCallback((): void => {
    clearToastTimer()
    setShowToast(false)
  }, [clearToastTimer])

  const scheduleAutoHide = useCallback((): void => {
    clearToastTimer()
    toastTimerRef.current = setTimeout((): void => {
      setShowToast(false)
      toastTimerRef.current = null
    }, TOAST_AUTO_HIDE_MS)
  }, [clearToastTimer])

  useEffect((): (() => void) => {
    return (): void => {
      clearToastTimer()
    }
  }, [clearToastTimer])

  const checkAndUpdate = useCallback(async (): Promise<boolean> => {
    if (!userId) return false

    try {
      const checkResponse: Response = await fetch(`/api/update-user-rates?userId=${encodeURIComponent(userId)}`)
      const checkData: CheckResponse = (await checkResponse.json()) as CheckResponse

      if (!checkData.needsUpdate) {
        return false
      }

      setIsUpdating(true)

      const updateResponse: Response = await fetch('/api/update-user-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const updateData: UpdateResponse = (await updateResponse.json()) as UpdateResponse

      const updated: boolean = Boolean(updateData.success && updateData.updated)

      if (updated) {
        setShowToast(true)
        scheduleAutoHide()
        await options?.onUpdateComplete?.()
      }

      return updated
    } catch {
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [options, scheduleAutoHide, userId])

  return {
    isUpdating,
    showToast,
    checkAndUpdate,
    hideToast,
  }
}
