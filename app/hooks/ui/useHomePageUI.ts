'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const BRAND_STORY_UNDO_TOAST_DURATION_MS = 5000

export function useHomePageUI() {
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
