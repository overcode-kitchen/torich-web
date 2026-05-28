import { useCallback, useEffect, useState } from 'react'

// 떨림 방지를 위한 히스테리시스 임계값.
// 접힘 진입은 둔감(40px), 펼침 복귀는 민감(8px).
const COLLAPSE_THRESHOLD = 40
const EXPAND_THRESHOLD = 8

interface UseCalendarCollapseProps {
  selectedDate: Date | null
}

export function useCalendarCollapse({ selectedDate }: UseCalendarCollapseProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // 날짜 선택 시 자동으로 주 보기로 접고, 선택 해제 시 월 보기로 복원.
  // 짧은 리스트(SelectedDateSection)는 실제 스크롤이 발생하지 않아
  // 스크롤 기반 collapse만으로는 트리거되지 않기에 선택 자체를 토글 신호로 사용.
  useEffect(() => {
    setIsCollapsed(selectedDate !== null)
  }, [selectedDate])

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
