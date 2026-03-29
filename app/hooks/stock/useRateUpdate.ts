'use client'

import { useCallback, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { showErrorToast, TOAST_MESSAGES } from '@/app/utils/toast'
import type { CheckResponse, UpdateResponse, UseRateUpdateOptions, UseRateUpdateReturn } from '../types/useRateUpdate'

export const useRateUpdate = (userId?: string, options?: UseRateUpdateOptions): UseRateUpdateReturn => {
  const [isUpdating, setIsUpdating] = useState<boolean>(false)

  const checkAndUpdate = useCallback(async (): Promise<boolean> => {
    if (!userId) return false

    try {
      const checkData: CheckResponse = await apiClient(`/api/update-user-rates?userId=${encodeURIComponent(userId)}`)

      if (!checkData.needsUpdate) {
        return false
      }

      setIsUpdating(true)

      const updateData: UpdateResponse = await apiClient('/api/update-user-rates', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      })

      if (updateData.success === false) {
        showErrorToast(TOAST_MESSAGES.rateUpdateFailed)
        return false
      }

      const updated: boolean = Boolean(updateData.success && updateData.updated)

      if (updated) {
        await options?.onUpdateComplete?.()
      }

      return updated
    } catch (error) {
      showErrorToast(TOAST_MESSAGES.rateUpdateFailed, error)
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [options, userId])

  return {
    isUpdating,
    checkAndUpdate,
  }
}
