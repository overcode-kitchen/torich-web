import { useCallback, useEffect, useRef, useState } from 'react'

// 손가락 의도(빠른 슬쩍 vs 천천히 드래그)를 반영해 토글을 결정한다.
// 임계값은 평소 거리, 속도 부스트는 짧은 거리에서도 빠른 제스처를 잡기 위함.
const COLLAPSE_THRESHOLD = 24
const EXPAND_THRESHOLD = 6
const PULL_EXPAND_THRESHOLD = 30
const PULL_EXPAND_FAST_DIST = 10
// px/ms. 0.5 ≈ 손가락을 빠르게 슬쩍 움직이는 수준.
const FAST_VELOCITY = 0.5
// 직전 이벤트가 너무 오래되었으면 속도 계산을 무효화(스테일 가드).
const STALE_DT_MS = 100
// 토글 직후 잠시 스크롤/터치 이벤트를 무시. 클램프 피드백 루프 방지.
const TOGGLE_LOCK_MS = 250
// 선택된 날짜가 바뀌면 하단 콘텐츠가 스왑되며 scrollTop이 0으로 클램프된다.
// 이 클램프를 사용자 의도(상단 복귀)로 오인하지 않도록 별도 길이의 락을 건다.
const SELECTION_LOCK_MS = 350

interface UseCalendarCollapseProps {
  selectedDate: Date | null
}

export function useCalendarCollapse({ selectedDate }: UseCalendarCollapseProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const lockUntilRef = useRef(0)
  const touchStartYRef = useRef<number | null>(null)
  const lastTouchYRef = useRef<number | null>(null)
  const lastTouchTimeRef = useRef(0)
  const lastScrollTopRef = useRef(0)
  const lastScrollTimeRef = useRef(0)

  const lockToggle = () => {
    lockUntilRef.current = Date.now() + TOGGLE_LOCK_MS
  }
  const isLocked = () => Date.now() < lockUntilRef.current

  const computeVelocity = (delta: number, dt: number): number => {
    if (dt <= 0 || dt > STALE_DT_MS) return 0
    return delta / dt
  }

  const onListScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (isLocked()) return
    const top = e.currentTarget.scrollTop
    const now = Date.now()
    const velocity = computeVelocity(top - lastScrollTopRef.current, now - lastScrollTimeRef.current)
    lastScrollTopRef.current = top
    lastScrollTimeRef.current = now

    setIsCollapsed((prev) => {
      if (!prev) {
        if (velocity > FAST_VELOCITY && top > 6) {
          lockToggle()
          return true
        }
        if (top > COLLAPSE_THRESHOLD) {
          lockToggle()
          return true
        }
      } else {
        if (velocity < -FAST_VELOCITY && top < 30) {
          lockToggle()
          return false
        }
        if (top < EXPAND_THRESHOLD) {
          lockToggle()
          return false
        }
      }
      return prev
    })
  }, [])

  const onTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const y = e.touches[0]?.clientY ?? null
    touchStartYRef.current = y
    lastTouchYRef.current = y
    lastTouchTimeRef.current = Date.now()
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (isLocked()) return
    const startY = touchStartYRef.current
    const lastY = lastTouchYRef.current
    if (startY === null || lastY === null) return
    const currentY = e.touches[0]?.clientY
    if (currentY === undefined) return
    const now = Date.now()
    const dy = currentY - startY
    const velocity = computeVelocity(currentY - lastY, now - lastTouchTimeRef.current)
    lastTouchYRef.current = currentY
    lastTouchTimeRef.current = now

    if (e.currentTarget.scrollTop > 0) return
    setIsCollapsed((prev) => {
      if (!prev) return prev
      if (velocity > FAST_VELOCITY && dy > PULL_EXPAND_FAST_DIST) {
        lockToggle()
        touchStartYRef.current = null
        return false
      }
      if (dy > PULL_EXPAND_THRESHOLD) {
        lockToggle()
        touchStartYRef.current = null
        return false
      }
      return prev
    })
  }, [])

  const onTouchEnd = useCallback(() => {
    touchStartYRef.current = null
    lastTouchYRef.current = null
  }, [])

  const toggleCollapsed = useCallback(() => {
    lockToggle()
    setIsCollapsed((prev) => !prev)
  }, [])

  // 날짜 선택이 바뀔 때 콘텐츠 스왑으로 발생하는 스크롤 클램프를 무시.
  useEffect(() => {
    lockUntilRef.current = Math.max(lockUntilRef.current, Date.now() + SELECTION_LOCK_MS)
  }, [selectedDate])

  return {
    isCollapsed,
    onListScroll,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    toggleCollapsed,
  }
}
