'use client'

import { useRef } from 'react'

export interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
  onClickCapture: (e: React.MouseEvent) => void
}

interface UseSwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  /** 스와이프로 인정할 최소 가로 이동 거리(px) */
  threshold?: number
}

/**
 * 가로 스와이프 제스처를 감지해 콜백을 호출한다.
 * 세로 스크롤과 충돌하지 않도록 가로 이동이 우세할 때만 스와이프로 판정하며,
 * 스와이프 직후 발생하는 내부 요소의 클릭은 억제한다.
 */
export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
}: UseSwipeOptions): SwipeHandlers {
  const start = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)

  const onTouchStart = (e: React.TouchEvent) => {
    swiped.current = false
    const t = e.touches[0]
    start.current = { x: t.clientX, y: t.clientY }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!start.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.current.x
    const dy = t.clientY - start.current.y
    start.current = null
    // 가로 이동이 임계값 이상이고 세로 이동보다 우세할 때만 스와이프로 판정
    if (Math.abs(dx) < threshold || Math.abs(dx) <= Math.abs(dy)) return
    swiped.current = true
    if (dx < 0) onSwipeLeft?.()
    else onSwipeRight?.()
  }

  // 스와이프로 끝난 제스처가 내부 요소(날짜 버튼 등)의 클릭으로 이어지지 않도록 차단
  const onClickCapture = (e: React.MouseEvent) => {
    if (swiped.current) e.stopPropagation()
  }

  return { onTouchStart, onTouchEnd, onClickCapture }
}
