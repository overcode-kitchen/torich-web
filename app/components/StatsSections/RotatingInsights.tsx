'use client'

import { useEffect, useState, type ReactNode } from 'react'

interface RotatingInsightsProps {
  /** 회전할 인사이트 문구들 (칭찬·맥락 전용) */
  items: ReactNode[]
  /** 전환 간격(ms) */
  intervalMs?: number
}

/**
 * 이행 Hero 상단 회전 서브라인 — 여러 칭찬 인사이트를 아래→위로 슬라이드하며 번갈아 노출(토스풍).
 * - 항목 1개 이하면 회전 없이 고정 노출
 * - prefers-reduced-motion이면 자동 회전 끔(첫 항목 고정) — 접근성
 */
export default function RotatingInsights({ items, intervalMs = 3800 }: RotatingInsightsProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (items.length <= 1) return
    // reduce 모션 사용자에겐 자동 전환을 하지 않는다(이펙트 본문에서 동기 setState를 피하려 콜백에서만 갱신)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length)
    }, intervalMs)
    return () => clearInterval(id)
  }, [items.length, intervalMs])

  if (items.length === 0) return null

  const safeIndex = index % items.length

  return (
    <div className="h-6 overflow-hidden">
      {/* key로 항목이 바뀔 때마다 슬라이드 애니메이션 재생 */}
      <p key={safeIndex} className="animate-insight text-sm text-foreground-muted leading-6">
        {items[safeIndex]}
      </p>
    </div>
  )
}
