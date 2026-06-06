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
// 날짜 선택으로 인한 자동 smooth scroll은 사용자 의도의 스크롤이 아니므로 그 동안 collapse 판정을 무시한다.
// 그렇지 않으면 "날짜만 골랐는데 캘린더가 멋대로 접힘"이 발생해 사용자 입장에서 부조화가 생긴다.
// smooth scrollTo 의 브라우저 표준 duration이 명세돼 있지 않아 대체로 400~700ms 이므로 여유 있게 잡는다.
const AUTO_SCROLL_LOCK_MS = 800

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

  // 날짜 선택으로 인한 자동 smooth scroll 동안 onListScroll/onTouchMove 가 임계값을 넘어 캘린더를 멋대로 접거나 펴지 않도록 잠시 collapse 판정을 무시한다.
  // 사용자가 직접 손으로 스크롤한 경우엔 락이 풀린 뒤 정상적으로 임계값으로 접힘/펼침이 동작한다.
  // 초기 마운트(selectedDate가 today로 초기화되는 시점)에는 락이 의미 없으므로 첫 effect 실행을 스킵한다.
  const didMountRef = useRef(false)
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }
    lockUntilRef.current = Math.max(lockUntilRef.current, Date.now() + AUTO_SCROLL_LOCK_MS)
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
