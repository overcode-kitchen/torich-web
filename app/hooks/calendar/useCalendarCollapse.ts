import { useCallback, useState } from 'react'

// 떨림 방지를 위한 히스테리시스 임계값.
// 접힘 진입은 둔감(40px), 펼침 복귀는 민감(8px).
const COLLAPSE_THRESHOLD = 40
const EXPAND_THRESHOLD = 8

export function useCalendarCollapse() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const onListScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop
    setIsCollapsed((prev) => {
      if (!prev && top > COLLAPSE_THRESHOLD) return true
      if (prev && top < EXPAND_THRESHOLD) return false
      return prev
    })
  }, [])

  return { isCollapsed, onListScroll }
}
