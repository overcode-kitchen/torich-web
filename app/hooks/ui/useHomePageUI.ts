'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Investment } from '@/app/types/investment'

const BRAND_STORY_UNDO_TOAST_DURATION_MS = 5000

interface UseHomePageUIProps {
  userId?: string
  records: Investment[]
  checkAndUpdate: (signal?: AbortSignal) => Promise<boolean>
  refetch: () => void
}

export function useHomePageUI({ userId, records, checkAndUpdate, refetch }: UseHomePageUIProps) {
  const [isBrandStoryOpen, setIsBrandStoryOpen] = useState<boolean>(false)
  const [showBrandStoryCard, setShowBrandStoryCard] = useState<boolean>(true)
  const [pendingBrandStoryUndo, setPendingBrandStoryUndo] = useState<boolean>(false)
  const brandStoryUndoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dismissBrandStoryCard = useCallback(() => {
    setShowBrandStoryCard(false)
    setPendingBrandStoryUndo(true)
    if (brandStoryUndoTimeoutRef.current) clearTimeout(brandStoryUndoTimeoutRef.current)
    brandStoryUndoTimeoutRef.current = setTimeout(() => {
      setPendingBrandStoryUndo(false)
      brandStoryUndoTimeoutRef.current = null
    }, BRAND_STORY_UNDO_TOAST_DURATION_MS)
  }, [])

  const undoBrandStoryDismiss = useCallback(() => {
    setShowBrandStoryCard(true)
    setPendingBrandStoryUndo(false)
    if (brandStoryUndoTimeoutRef.current) {
      clearTimeout(brandStoryUndoTimeoutRef.current)
      brandStoryUndoTimeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!userId || records.length === 0) return
    // 언마운트/재실행 시 진행 중인 백그라운드 갱신 요청을 취소한다.
    // (취소를 안 하면 개발 중 Fast Refresh 등으로 요청이 끊기며 "Failed to fetch"가 나고,
    //  이게 예전엔 네트워크 에러 토스트로 반복 노출됐다.)
    const controller = new AbortController()
    void checkAndUpdate(controller.signal).then((updated: boolean) => {
      if (updated && !controller.signal.aborted) void refetch()
    })
    return () => controller.abort()
  }, [userId, records.length, checkAndUpdate, refetch])

  useEffect(() => {
    return () => {
      if (brandStoryUndoTimeoutRef.current) clearTimeout(brandStoryUndoTimeoutRef.current)
    }
  }, [])

  return {
    isBrandStoryOpen,
    setIsBrandStoryOpen,
    showBrandStoryCard,
    setShowBrandStoryCard,
    pendingBrandStoryUndo,
    dismissBrandStoryCard,
    undoBrandStoryDismiss
  }
}
