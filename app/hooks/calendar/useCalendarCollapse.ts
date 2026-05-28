import { useCallback, useRef, useState } from 'react'

// 떨림 방지를 위한 히스테리시스 임계값.
// 접힘 진입은 둔감(40px), 펼침 복귀는 민감(8px).
const COLLAPSE_THRESHOLD = 40
const EXPAND_THRESHOLD = 8
// 접힌 상태에서 콘텐츠가 짧아 스크롤이 없을 때, 손가락을 아래로 당겨
// 펼침을 트리거하기 위한 임계값.
const PULL_EXPAND_THRESHOLD = 40
// 토글 직후 잠시 스크롤/터치 이벤트를 무시한다. 캘린더 높이 변화로 인한
// scrollTop 자동 클램프가 즉시 반대 토글을 일으키는 피드백 루프 방지.
const TOGGLE_LOCK_MS = 400

export function useCalendarCollapse() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const lockUntilRef = useRef(0)
  const touchStartYRef = useRef<number | null>(null)

  const lockToggle = () => {
    lockUntilRef.current = Date.now() + TOGGLE_LOCK_MS
  }
  const isLocked = () => Date.now() < lockUntilRef.current

  const onListScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (isLocked()) return
    const top = e.currentTarget.scrollTop
    setIsCollapsed((prev) => {
      if (!prev && top > COLLAPSE_THRESHOLD) {
        lockToggle()
        return true
      }
      if (prev && top < EXPAND_THRESHOLD) {
        lockToggle()
        return false
      }
      return prev
    })
  }, [])

  const onTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    touchStartYRef.current = e.touches[0]?.clientY ?? null
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (isLocked()) return
    const startY = touchStartYRef.current
    if (startY === null) return
    const currentY = e.touches[0]?.clientY
    if (currentY === undefined) return
    const atTop = e.currentTarget.scrollTop <= 0
    const dy = currentY - startY
    if (!atTop || dy <= PULL_EXPAND_THRESHOLD) return
    setIsCollapsed((prev) => {
      if (!prev) return prev
      lockToggle()
      return false
    })
    touchStartYRef.current = null
  }, [])

  const onTouchEnd = useCallback(() => {
    touchStartYRef.current = null
  }, [])

  const toggleCollapsed = useCallback(() => {
    lockToggle()
    setIsCollapsed((prev) => !prev)
  }, [])

  return {
    isCollapsed,
    onListScroll,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    toggleCollapsed,
  }
}
