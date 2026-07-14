'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/** collapsed 상태에서 카드 아래로 삐져나온 손잡이 높이(px). 화살표가 온전히 보일 만큼만 얇게 확보 */
export const HANDLE_PEEK = 13
/** 완전히 열렸을 때 서랍 노출 높이(px) */
export const OPEN_HEIGHT = 72
/** 이만큼(peek 기준) 당겨야 열림 확정 → 이 미만이면 다시 올라가고 이동하지 않음 */
const OPEN_THRESHOLD = 30
/** 방향 확정에 필요한 최소 세로 이동(px) */
const DIR_LOCK = 6

interface UseDrawerPullOptions {
  /** 열림 확정(임계점 통과) 또는 탭 시 실행 */
  onCommit: () => void
  enabled?: boolean
}

export interface UseDrawerPullReturn {
  /** 드래그를 감지할 손잡이 요소에 부착 */
  ref: React.RefObject<HTMLDivElement | null>
  /** 현재 노출 높이(px). HANDLE_PEEK ~ OPEN_HEIGHT */
  revealed: number
  /** 드래그 중 여부 (CSS transition 조절용) */
  isDragging: boolean
  /** 키보드 등 명시적 조작에서 직접 실행 (탭/터치로는 실행되지 않음) */
  commit: () => void
}

/**
 * 손잡이를 세로로 잡아당겨 서랍을 여는 제스처 훅.
 *
 * ⚠️ React의 JSX `onTouchMove`는 passive로 부착되어 `preventDefault`가 무시된다.
 * 세로 드래그는 페이지 스크롤과 같은 축이라 반드시 native
 * `addEventListener('touchmove', h, { passive: false })` 로 붙여야 스크롤을 막을 수 있다.
 * (usePullToRefresh.ts 의 검증된 패턴을 따른다)
 */
export function useDrawerPull({
  onCommit,
  enabled = true,
}: UseDrawerPullOptions): UseDrawerPullReturn {
  const ref = useRef<HTMLDivElement | null>(null)

  const [revealed, setRevealed] = useState(HANDLE_PEEK)
  const [isDragging, setIsDragging] = useState(false)

  // native 리스너에서 최신 값을 읽기 위한 미러 ref (usePullToRefresh 관례)
  const onCommitRef = useRef(onCommit)
  const revealedRef = useRef(HANDLE_PEEK)
  const startYRef = useRef<number | null>(null)
  const isVerticalRef = useRef<boolean | null>(null)

  useEffect(() => {
    onCommitRef.current = onCommit
  }, [onCommit])

  useEffect(() => {
    revealedRef.current = revealed
  }, [revealed])

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return

    const onStart = (e: TouchEvent) => {
      startYRef.current = e.touches[0].clientY
      isVerticalRef.current = null
      setIsDragging(true)
    }

    const onMove = (e: TouchEvent) => {
      if (startYRef.current === null) return
      const dy = e.touches[0].clientY - startYRef.current // 아래로 당기면 +

      // 방향 확정 (첫 유효 이동에서만)
      if (isVerticalRef.current === null) {
        if (Math.abs(dy) < DIR_LOCK) return
        isVerticalRef.current = true
      }

      // 세로 드래그 확정 → 페이지 스크롤 억제 + document 레벨 pull-to-refresh 차단
      if (e.cancelable) e.preventDefault()
      e.stopPropagation()

      const next = Math.max(HANDLE_PEEK, Math.min(OPEN_HEIGHT, HANDLE_PEEK + dy))
      setRevealed(next)
    }

    const onEnd = () => {
      setIsDragging(false)
      startYRef.current = null

      if (revealedRef.current - HANDLE_PEEK >= OPEN_THRESHOLD) {
        setRevealed(OPEN_HEIGHT)
        onCommitRef.current()
      } else {
        setRevealed(HANDLE_PEEK)
      }
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd)
    el.addEventListener('touchcancel', onEnd)

    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
    }
  }, [enabled])

  const commit = useCallback(() => {
    onCommitRef.current()
  }, [])

  return { ref, revealed, isDragging, commit }
}
