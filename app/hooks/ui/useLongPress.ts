'use client'

import { useCallback, useRef } from 'react'

interface UseLongPressOptions {
  /** 롱프레스가 인정되면 호출된다. */
  onLongPress: () => void
  /** 짧은 탭일 때 호출된다(롱프레스가 발동하지 않은 경우만). */
  onClick?: () => void
  enabled?: boolean
  /** 롱프레스로 인정하는 누름 시간(ms). 기본 500. */
  delay?: number
  /** 이 픽셀 이상 움직이면 스크롤로 간주해 롱프레스를 취소한다. 기본 10. */
  moveThreshold?: number
}

export interface UseLongPressHandlers {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: () => void
  onMouseDown: (e: React.MouseEvent) => void
  onMouseUp: () => void
  onMouseLeave: () => void
  onClick: (e: React.MouseEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
}

/**
 * 길게 누르기(long press) 제스처. 기존 터치 훅(useSwipeToDelete)과 같은
 * `onTouch*` + `useRef` 컨벤션을 따른다. 마우스도 지원해 웹에서 검증할 수 있다.
 *
 * - `delay`(기본 500ms) 동안 누르고 있으면 `onLongPress`가 발동한다.
 * - 누른 채로 `moveThreshold` 이상 움직이면(스크롤/스와이프) 취소된다.
 * - 롱프레스가 발동하면, 손을 뗄 때 뒤따르는 `click`(탭 이동)은 삼켜서
 *   상세로 이동하지 않게 한다.
 */
export function useLongPress({
  onLongPress,
  onClick,
  enabled = true,
  delay = 500,
  moveThreshold = 10,
}: UseLongPressOptions): UseLongPressHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startXRef = useRef<number>(0)
  const startYRef = useRef<number>(0)
  // 롱프레스가 발동했는가. 발동했다면 뒤따르는 click(상세 이동)을 무시한다.
  const triggeredRef = useRef<boolean>(false)

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const start = useCallback(
    (x: number, y: number) => {
      if (!enabled) return
      triggeredRef.current = false
      startXRef.current = x
      startYRef.current = y
      clear()
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        triggeredRef.current = true
        onLongPress()
      }, delay)
    },
    [enabled, delay, onLongPress, clear],
  )

  const move = useCallback(
    (x: number, y: number) => {
      if (timerRef.current === null) return
      if (
        Math.abs(x - startXRef.current) > moveThreshold ||
        Math.abs(y - startYRef.current) > moveThreshold
      ) {
        clear()
      }
    },
    [moveThreshold, clear],
  )

  return {
    onTouchStart: (e) => start(e.touches[0].clientX, e.touches[0].clientY),
    onTouchMove: (e) => move(e.touches[0].clientX, e.touches[0].clientY),
    onTouchEnd: clear,
    onMouseDown: (e) => start(e.clientX, e.clientY),
    onMouseUp: clear,
    onMouseLeave: clear,
    onClick: (e) => {
      // 롱프레스로 이미 메뉴를 띄웠다면, 손을 뗄 때 발생하는 click은 삼킨다.
      if (triggeredRef.current) {
        e.preventDefault()
        e.stopPropagation()
        triggeredRef.current = false
        return
      }
      onClick?.()
    },
    // 모바일 롱프레스 시 뜨는 브라우저 컨텍스트 메뉴/텍스트 선택 콜아웃을 억제한다.
    onContextMenu: (e) => e.preventDefault(),
  }
}
