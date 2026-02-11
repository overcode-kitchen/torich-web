'use client'

import { useCallback, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { useToast } from './useToast'
import type { CheckResponse, UpdateResponse, UseRateUpdateOptions, UseRateUpdateReturn } from './types/useRateUpdate'

export const useRateUpdate = (userId?: string, options?: UseRateUpdateOptions): UseRateUpdateReturn => {
  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const toast = useToast()

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

      const updated: boolean = Boolean(updateData.success && updateData.updated)

      if (updated) {
        toast.show()
        await options?.onUpdateComplete?.()
      }

      return updated
    } catch {
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [options, toast, userId])

  return {
    isUpdating,
    showToast: toast.showToast,
    checkAndUpdate,
    hideToast: toast.hide,
  }
}
