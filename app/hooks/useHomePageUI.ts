'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Investment } from '@/app/types/investment'

const BRAND_STORY_UNDO_TOAST_DURATION_MS = 5000

interface UseHomePageUIProps {
  userId?: string
  records: Investment[]
  checkAndUpdate: () => Promise<boolean>
  refetch: () => void
}

export function useHomePageUI({ userId, records, checkAndUpdate, refetch }: UseHomePageUIProps) {
  const [detailItem, setDetailItem] = useState<Investment | null>(null)
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

  useEffect((): void => {
    if (!userId || records.length === 0) return
    void checkAndUpdate().then((updated: boolean) => {
      if (updated) void refetch()
    })
  }, [userId, records.length, checkAndUpdate, refetch])

  useEffect(() => {
    return () => {
      if (brandStoryUndoTimeoutRef.current) clearTimeout(brandStoryUndoTimeoutRef.current)
    }
  }, [])

  return {
    detailItem,
    setDetailItem,
    isBrandStoryOpen,
    setIsBrandStoryOpen,
    showBrandStoryCard,
    setShowBrandStoryCard,
    pendingBrandStoryUndo,
    dismissBrandStoryCard,
    undoBrandStoryDismiss
  }
}
