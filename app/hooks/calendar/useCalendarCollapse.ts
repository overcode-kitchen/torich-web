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
// 날짜 선택/월 이동으로 인한 자동 smooth scroll은 사용자 의도의 스크롤이 아니므로 그 동안 collapse 판정을 무시한다.
// 그렇지 않으면 "날짜만 골랐는데 캘린더가 멋대로 접힘"이 발생한다. 해제는 scroller의 scrollend 이벤트가 담당하므로
// 이동 거리(짧은 점프 vs 1일→말일 같은 긴 점프)와 무관하게 정확히 스크롤이 멈출 때 풀린다.
// scrollend 는 iOS WebKit 18.2+ 부터만 지원되므로, 미지원(18.0~18.1) 환경 대비 넉넉한 상한 타임아웃을 fallback으로 둔다.
const PROGRAMMATIC_SCROLL_SAFETY_MS = 2000

interface UseCalendarCollapseProps {
  // 사용자 탭/월 이동 시 증가하는 트리거. 증가 = 프로그램적 smooth scroll이 시작됨을 의미.
  scrollTick: number
}

export function useCalendarCollapse({ scrollTick }: UseCalendarCollapseProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const lockUntilRef = useRef(0)
  // 프로그램적(자동) 스크롤이 진행 중인 동안 true. 이 동안 접힘/펼침 판정을 하지 않는다.
  const programmaticScrollRef = useRef(false)
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
    // 락 여부와 무관하게 속도 기준점은 항상 갱신해야, 락 해제 직후 첫 스크롤에서 거대한 가짜 delta가 잡히지 않는다.
    const top = e.currentTarget.scrollTop
    const now = Date.now()
    const delta = top - lastScrollTopRef.current
    const velocity = computeVelocity(delta, now - lastScrollTimeRef.current)
    lastScrollTopRef.current = top
    lastScrollTimeRef.current = now

    // 토글 직후 짧은 락 + 프로그램적 자동 스크롤 중에는 접힘/펼침 판정을 하지 않는다.
    if (isLocked() || programmaticScrollRef.current) return

    // 자동 접힘은 리스트를 "아래로" 내릴 때만 일어나야 한다. 위로 올리는 중에는
    // 임계값을 넘긴 위치라도 접지 않는다 (펼침은 아래 else 분기에서 그대로 처리).
    const isScrollingDown = delta > 0

    setIsCollapsed((prev) => {
      if (!prev) {
        if (!isScrollingDown) return prev
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
    if (isLocked() || programmaticScrollRef.current) return
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

  // scrollTick 증가 = 날짜 탭/월 이동으로 인한 프로그램적 smooth scroll 시작.
  // 그 동안 onListScroll/onTouchMove 가 임계값을 넘어 캘린더를 멋대로 접지 않도록 collapse 판정을 무시하고,
  // 스크롤이 실제로 멈추는 scrollend 시점에 해제한다 → 이동 거리와 무관하게 정확히 풀려, 긴 점프에서 접히던 버그를 막는다.
  // scrollend 미지원(iOS 18.0~18.1) 대비 상한 타임아웃을 fallback으로 둔다.
  // 초기 마운트(selectedDate가 today로 초기화되는 시점)에는 의미 없으므로 첫 effect 실행을 스킵한다.
  const didMountRef = useRef(false)
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }
    const scroller = document.querySelector('[data-calendar-scroll]')
    if (!(scroller instanceof HTMLElement)) return

    programmaticScrollRef.current = true
    const release = () => {
      programmaticScrollRef.current = false
      scroller.removeEventListener('scrollend', release)
      clearTimeout(safety)
    }
    const safety = setTimeout(release, PROGRAMMATIC_SCROLL_SAFETY_MS)
    scroller.addEventListener('scrollend', release)
    return () => {
      scroller.removeEventListener('scrollend', release)
      clearTimeout(safety)
    }
  }, [scrollTick])

  return {
    isCollapsed,
    onListScroll,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    toggleCollapsed,
  }
}
