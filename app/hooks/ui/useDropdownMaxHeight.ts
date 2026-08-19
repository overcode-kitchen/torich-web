'use client'

import { useEffect, useState, type RefObject } from 'react'

/** 드롭다운과 아래쪽 장애물(고정 바·화면 끝) 사이 최소 여백 */
const GAP_PX = 8
/** 이보다 낮아지면 목록 구실을 못 하므로, 이 아래로는 줄이지 않는다 */
const MIN_HEIGHT_PX = 160
/** 공간이 넉넉해도 이보다 길게 늘이지 않는다 (기존 max-h-80과 동일) */
const MAX_HEIGHT_PX = 320

/** 가려질 수 있는 고정 요소에 붙이는 표식. 이 요소의 top이 드롭다운의 하한선이 된다. */
export const FIXED_BOTTOM_BAR_ATTR = 'data-fixed-bottom-bar'

/**
 * 앵커(입력창) 아래에 펼쳐지는 드롭다운의 최대 높이를 실제 가용 공간으로 제한한다.
 *
 * 고정 CTA 바가 드롭다운보다 위(z-index)에 그려지는 화면에서는, 높이를 고정값으로 두면
 * 목록 끝부분이 바에 덮여 보이지도 눌리지도 않는다(#207). 그래서 높이를 화면 상황에 맞춰 계산한다.
 * 모바일 키보드가 올라오면 뷰포트가 줄어들므로 `visualViewport` 변화도 함께 따라간다.
 */
export function useDropdownMaxHeight(
  anchorRef: RefObject<HTMLElement | null>,
  isOpen: boolean
): number {
  const [maxHeight, setMaxHeight] = useState<number>(MAX_HEIGHT_PX)

  useEffect(() => {
    if (!isOpen) return

    const measure = (): void => {
      const anchor = anchorRef.current
      if (!anchor) return

      const anchorBottom = anchor.getBoundingClientRect().bottom
      const viewport = window.visualViewport
      const viewportBottom = viewport ? viewport.height + viewport.offsetTop : window.innerHeight

      // 고정 바가 있으면 그 윗변이, 없으면 뷰포트 아래끝이 하한선이다.
      const bar = document.querySelector(`[${FIXED_BOTTOM_BAR_ATTR}]`)
      const barTop = bar ? bar.getBoundingClientRect().top : viewportBottom
      const limit = Math.min(viewportBottom, barTop)

      const available = limit - anchorBottom - GAP_PX
      setMaxHeight(Math.max(MIN_HEIGHT_PX, Math.min(MAX_HEIGHT_PX, Math.round(available))))
    }

    // 첫 측정은 레이아웃이 확정된 다음 프레임에 한다.
    const raf = requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    // 페이지가 스크롤되면 입력창 위치가 바뀌므로 캡처 단계에서 모든 스크롤을 듣는다.
    window.addEventListener('scroll', measure, true)
    window.visualViewport?.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('scroll', measure)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      window.visualViewport?.removeEventListener('resize', measure)
      window.visualViewport?.removeEventListener('scroll', measure)
    }
  }, [anchorRef, isOpen])

  return maxHeight
}
