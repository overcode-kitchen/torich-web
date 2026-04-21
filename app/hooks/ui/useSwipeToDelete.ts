'use client'

import { useRef, useState, useCallback } from 'react'

const SWIPE_THRESHOLD = 40
const SWIPE_REVEAL_WIDTH = 80

interface UseSwipeToDeleteOptions {
  onDelete: () => Promise<void>
  enabled?: boolean
}

export interface UseSwipeToDeleteReturn {
  translateX: number
  isRevealed: boolean
  isDragging: boolean
  isDeleteModalOpen: boolean
  isSubmitting: boolean
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: () => void
  onDeleteButtonClick: () => void
  onDeleteConfirm: () => Promise<void>
  onDeleteModalClose: () => void
  close: () => void
}

export function useSwipeToDelete({
  onDelete,
  enabled = true,
}: UseSwipeToDeleteOptions): UseSwipeToDeleteReturn {
  const touchStartXRef = useRef<number>(0)
  const touchStartYRef = useRef<number>(0)
  const isHorizontalRef = useRef<boolean | null>(null)

  const [translateX, setTranslateX] = useState<number>(0)
  const [isRevealed, setIsRevealed] = useState<boolean>(false)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const close = useCallback(() => {
    setTranslateX(0)
    setIsRevealed(false)
  }, [])

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return
      touchStartXRef.current = e.touches[0].clientX
      touchStartYRef.current = e.touches[0].clientY
      isHorizontalRef.current = null
      setIsDragging(true)
    },
    [enabled],
  )

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !isDragging) return

      const deltaX = e.touches[0].clientX - touchStartXRef.current
      const deltaY = e.touches[0].clientY - touchStartYRef.current

      // 방향 결정 (첫 이동에서만)
      if (isHorizontalRef.current === null) {
        if (Math.abs(deltaX) < 5 && Math.abs(deltaY) < 5) return
        isHorizontalRef.current = Math.abs(deltaX) > Math.abs(deltaY)
      }

      // 세로 스크롤 우선 → 스와이프 취소
      if (!isHorizontalRef.current) {
        setIsDragging(false)
        return
      }

      e.preventDefault()

      const base = isRevealed ? -SWIPE_REVEAL_WIDTH : 0
      const next = base + deltaX
      setTranslateX(Math.max(-SWIPE_REVEAL_WIDTH, Math.min(0, next)))
    },
    [enabled, isDragging, isRevealed],
  )

  const onTouchEnd = useCallback(() => {
    if (!enabled) return
    setIsDragging(false)

    if (translateX < -SWIPE_THRESHOLD) {
      setTranslateX(-SWIPE_REVEAL_WIDTH)
      setIsRevealed(true)
    } else {
      setTranslateX(0)
      setIsRevealed(false)
    }
  }, [enabled, translateX])

  const onDeleteButtonClick = useCallback(() => {
    setIsDeleteModalOpen(true)
  }, [])

  const onDeleteConfirm = useCallback(async () => {
    setIsSubmitting(true)
    try {
      await onDelete()
    } finally {
      setIsSubmitting(false)
      setIsDeleteModalOpen(false)
      close()
    }
  }, [onDelete, close])

  const onDeleteModalClose = useCallback(() => {
    if (isSubmitting) return
    setIsDeleteModalOpen(false)
    close()
  }, [isSubmitting, close])

  return {
    translateX,
    isRevealed,
    isDragging,
    isDeleteModalOpen,
    isSubmitting,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onDeleteButtonClick,
    onDeleteConfirm,
    onDeleteModalClose,
    close,
  }
}
