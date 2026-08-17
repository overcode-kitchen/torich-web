'use client'

import { useRef, useState, useCallback } from 'react'
import { toastError, TOAST_MESSAGES } from '@/app/utils/toast'

/**
 * 열기·닫기 공통 임계값. 노출 폭 대비 비율이다.
 *
 * 고정 px이 아니라 비율인 이유: 액션이 1개(삭제)냐 2개(미루기+삭제)냐에 따라 노출 폭이
 * 80px·160px로 갈리는데, 고정 px을 쓰면 같은 제스처가 행마다 다른 비율로 판정된다.
 * 비율로 두면 "끝까지의 1/4을 끌면 넘어간다"가 어느 행에서나 같다.
 *
 * 열기와 닫기가 같은 값인 이유: 두 방향의 감도가 다르면 방금 연 것을 같은 크기로
 * 되돌렸는데 안 닫히는 비대칭이 생긴다. 이 이슈의 원인이 그 비대칭이었다.
 */
const THRESHOLD_RATIO = 0.25
/** 액션 버튼 1개 폭(px). 노출 폭 = actionCount * 이 값. */
const ACTION_WIDTH = 80

interface UseSwipeToDeleteOptions {
  onDelete: () => Promise<void>
  enabled?: boolean
  /** 스와이프로 노출되는 액션 버튼 개수(예: 미루기+삭제면 2). 기본 1. */
  actionCount?: number
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
  actionCount = 1,
}: UseSwipeToDeleteOptions): UseSwipeToDeleteReturn {
  const revealWidth = Math.max(1, actionCount) * ACTION_WIDTH

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

      const base = isRevealed ? -revealWidth : 0
      const next = base + deltaX
      setTranslateX(Math.max(-revealWidth, Math.min(0, next)))
    },
    [enabled, isDragging, isRevealed, revealWidth],
  )

  const onTouchEnd = useCallback(() => {
    if (!enabled) return
    setIsDragging(false)

    // 최종 위치가 아니라 "이번 제스처가 얼마나 움직였는지"로 판정한다.
    // 위치만 보면 열린 상태(-revealWidth)에서 되돌릴 때도 위치가 여전히 임계값 바깥이라,
    // 닫으려는 의도가 다시 열림으로 뒤집혔다.
    // (세로 스크롤로 취소된 제스처는 translateX가 base 그대로라 moved=0 → 직전 상태 유지)
    const base = isRevealed ? -revealWidth : 0
    const moved = translateX - base
    const threshold = revealWidth * THRESHOLD_RATIO

    if (isRevealed) {
      const shouldClose = moved > threshold
      setTranslateX(shouldClose ? 0 : -revealWidth)
      setIsRevealed(!shouldClose)
      return
    }

    const shouldOpen = moved < -threshold
    setTranslateX(shouldOpen ? -revealWidth : 0)
    setIsRevealed(shouldOpen)
  }, [enabled, isRevealed, translateX, revealWidth])

  const onDeleteButtonClick = useCallback(() => {
    setIsDeleteModalOpen(true)
  }, [])

  const onDeleteConfirm = useCallback(async () => {
    setIsSubmitting(true)
    try {
      await onDelete()
    } catch {
      // 삭제 실패 시 낙관적 UI가 롤백되어 항목이 되살아난다.
      // 토스트가 없으면 "삭제했는데 그대로"로 보여 원인 파악이 어렵다(상세 화면과 동일하게 알린다).
      toastError(TOAST_MESSAGES.deleteFailed)
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
