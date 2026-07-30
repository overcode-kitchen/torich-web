'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

interface RotatingInsightsProps {
  /** 회전할 문구들 */
  items: ReactNode[]
  /** 전환 간격(ms) — 한 줄을 다 읽고도 잠깐 머무를 만큼 둔다 */
  intervalMs?: number
  /** 문구 한 줄의 타이포 — 쓰는 카드의 위계에 맞춰 넘긴다 */
  className?: string
}

/**
 * 넘김으로 인정할 최소 세로 이동(px).
 * 탭할 때의 미세한 흔들림을 넘김으로 오해하지 않을 만큼 두되, 엄지 한 번에 닿는 거리로 둔다.
 */
const SWIPE_THRESHOLD = 28

/**
 * 회전 서브라인 — 여러 문구를 아래→위로 슬라이드하며 번갈아 노출(토스풍).
 * - 항목 1개 이하면 회전 없이 고정 노출
 * - 위로 밀면 다음, 아래로 밀면 이전 문구로 넘어가고, 그 순간부터 자동 전환 타이머를 다시 센다
 * - prefers-reduced-motion이면 자동 회전 끔(첫 항목 고정) — 손으로 넘기는 것은 그대로 동작한다
 *
 * 손짓 방향은 애니메이션 방향과 같아야 한다. 문구가 아래에서 위로 올라오므로 넘김도 세로다.
 * 그래서 이 영역에서 시작한 세로 드래그는 페이지 스크롤로 넘기지 않고 이쪽이 가져간다(touch-pan-x).
 * 대신 그만큼 좁게 — 문구 한 줄 높이에 위아래 여유만 더한 띠에서만 가져간다.
 *
 * 높이를 h-6으로 고정해 문구가 바뀔 때 카드 높이가 흔들리지 않게 한다.
 */
export default function RotatingInsights({
  items,
  intervalMs = 4600,
  className = 'text-sm text-foreground-muted',
}: RotatingInsightsProps) {
  const [index, setIndex] = useState(0)
  // 손으로 넘긴 직후 남은 간격만큼 뒤에 또 넘어가지 않도록, 값을 바꿔 타이머를 처음부터 다시 센다
  const [timerKey, setTimerKey] = useState(0)
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const swipedRef = useRef(false)

  useEffect(() => {
    if (items.length <= 1) return
    // reduce 모션 사용자에겐 자동 전환을 하지 않는다(이펙트 본문에서 동기 setState를 피하려 콜백에서만 갱신)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length)
    }, intervalMs)
    return () => clearInterval(id)
  }, [items.length, intervalMs, timerKey])

  const step = useCallback(
    (delta: number) => {
      setIndex((prev) => (prev + delta + items.length) % items.length)
      setTimerKey((k) => k + 1)
    },
    [items.length]
  )

  const handlePointerDown = (e: React.PointerEvent) => {
    startRef.current = { x: e.clientX, y: e.clientY }
    swipedRef.current = false
  }

  /**
   * 넘김 판정을 pointerup이 아니라 move에서 한다.
   * 터치에서는 브라우저가 제스처를 가져가는 순간 pointercancel이 날아와 pointerup이 오지 않을 수 있어,
   * 문턱을 넘은 그 프레임에 바로 넘기고 startRef를 비워 한 손짓에 한 번만 반응하게 한다.
   */
  const handlePointerMove = (e: React.PointerEvent) => {
    const start = startRef.current
    if (!start || items.length <= 1) return

    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    // 세로 이동이 가로보다 커야 넘김이다 — 가로가 더 크면 문구를 넘기려던 손짓이 아니다
    if (Math.abs(dy) < SWIPE_THRESHOLD || Math.abs(dy) <= Math.abs(dx)) return

    startRef.current = null
    swipedRef.current = true
    // 위로 밀면(dy<0) 다음 문구 — 문구가 아래에서 위로 올라오는 애니메이션과 방향을 맞춘다
    step(dy < 0 ? 1 : -1)
  }

  const handlePointerEnd = () => {
    startRef.current = null
  }

  /**
   * 이 줄을 감싼 hero 카드 전체가 목적 상세로 가는 버튼이다.
   * 넘김으로 판정한 손짓의 click이 그대로 버블링하면 문구만 넘기려다 화면이 바뀐다.
   */
  const handleClick = (e: React.MouseEvent) => {
    if (!swipedRef.current) return
    swipedRef.current = false
    e.stopPropagation()
  }

  if (items.length === 0) return null

  const safeIndex = index % items.length

  return (
    // 문구 한 줄(24px)만으로는 손가락이 얹힐 면이 너무 얇다.
    // -my-1.5 py-1.5로 위아래 12px을 더해 잡을 면을 넓히면서 카드 레이아웃은 그대로 둔다.
    //
    // touch-pan-x: 이 띠에서 시작한 세로 제스처를 브라우저에 내주지 않는다.
    // 기본값이면 손을 대는 순간 페이지 스크롤로 판정돼 pointermove가 끊기고 넘김이 성립하지 않는다.
    // select-none: 드래그가 텍스트 선택으로 바뀌면 넘김 도중 파란 하이라이트가 남는다.
    <div
      className="-my-1.5 touch-pan-x select-none py-1.5"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
      onClick={handleClick}
    >
      <div className="h-6 overflow-hidden">
        {/* key로 항목이 바뀔 때마다 슬라이드 애니메이션 재생 */}
        <p key={safeIndex} className={`animate-insight leading-6 ${className}`}>
          {items[safeIndex]}
        </p>
      </div>
    </div>
  )
}
