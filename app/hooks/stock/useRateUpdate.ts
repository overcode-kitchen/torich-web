'use client'

import { useCallback, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import type { CheckResponse, UpdateResponse, UseRateUpdateOptions, UseRateUpdateReturn } from '../types/useRateUpdate'

export const useRateUpdate = (userId?: string, options?: UseRateUpdateOptions): UseRateUpdateReturn => {
  const [isUpdating, setIsUpdating] = useState<boolean>(false)

  const checkAndUpdate = useCallback(async (signal?: AbortSignal): Promise<boolean> => {
    if (!userId) return false

    try {
      const checkData: CheckResponse = await apiClient(
        `/api/update-user-rates?userId=${encodeURIComponent(userId)}`,
        { signal },
      )

      if (!checkData.needsUpdate) {
        return false
      }

      setIsUpdating(true)

      const updateData: UpdateResponse = await apiClient('/api/update-user-rates', {
        method: 'POST',
        body: JSON.stringify({ userId }),
        signal,
      })

      if (updateData.success === false) {
        // 홈 진입 시 자동으로 도는 백그라운드 수익률 갱신이다.
        // 사용자가 직접 실행한 동작이 아니므로 실패해도 토스트로 알리지 않고 조용히 넘어간다.
        console.warn('[useRateUpdate] 수익률 자동 갱신 실패(서버 응답 success=false)')
        return false
      }

      const updated: boolean = Boolean(updateData.success && updateData.updated)

      if (updated) {
        await options?.onUpdateComplete?.()
      }

      return updated
    } catch (error) {
      // 언마운트/재실행으로 요청이 취소된 경우(AbortError)는 정상 흐름이므로 로그조차 남기지 않는다.
      // 이 취소가 "Failed to fetch"로 잡혀 예전엔 네트워크 에러 토스트가 반복되던 원인이었다.
      if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
        return false
      }
      // 그 외 실제 실패도 백그라운드 작업이므로 토스트로 사용자를 방해하지 않고 콘솔에만 남긴다.
      console.warn('[useRateUpdate] 수익률 자동 갱신 실패', error)
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
