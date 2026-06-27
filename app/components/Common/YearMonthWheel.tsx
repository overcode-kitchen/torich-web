'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const ITEM_H = 40 // 휠 한 칸 높이(px)
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

/**
 * 스크롤 휠 컬럼 — iOS 스타일 픽커.
 * 가운데 칸에 오는 항목이 선택값. 스크롤이 멈추면 가장 가까운 칸으로 스냅한다.
 */
function WheelColumn({
  items,
  value,
  onChange,
  format,
}: {
  items: number[]
  value: number
  onChange: (value: number) => void
  format: (value: number) => string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [active, setActive] = useState<number>(() =>
    Math.max(0, items.indexOf(value)),
  )

  // 마운트 시 현재 값 위치로 스크롤 정렬
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = active * ITEM_H
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleScroll = () => {
    const el = ref.current
    if (!el) return
    const idx = Math.max(
      0,
      Math.min(items.length - 1, Math.round(el.scrollTop / ITEM_H)),
    )
    if (idx !== active) setActive(idx)

    if (settleTimer.current) clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(() => {
      el.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' })
      if (items[idx] !== value) onChange(items[idx])
    }, 120)
  }

  const selectAt = (idx: number) => {
    setActive(idx)
    ref.current?.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' })
    if (items[idx] !== value) onChange(items[idx])
  }

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      className="h-[200px] overflow-y-auto snap-y snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {/* 첫/마지막 항목이 가운데 올 수 있도록 위아래 여백 (= (200-40)/2 = 80) */}
      <div style={{ height: ITEM_H * 2 }} />
      {items.map((it, i) => (
        <button
          key={it}
          type="button"
          onClick={() => selectAt(i)}
          className={cn(
            'flex h-10 w-full snap-center items-center justify-center text-base transition-colors',
            i === active ? 'font-bold text-foreground' : 'text-foreground-subtle',
          )}
        >
          {format(it)}
        </button>
      ))}
      <div style={{ height: ITEM_H * 2 }} />
    </div>
  )
}

interface YearMonthWheelProps {
  /** 선택 연도 */
  year: number
  /** 선택 월 (1-12) */
  month: number
  /** 휠 값 변경 시 호출 */
  onChange: (year: number, month: number) => void
  /** 연도 휠 시작 연도 (기본: 올해-10) */
  startYear?: number
  /** 연도 휠 끝 연도 (기본: 올해+30) */
  endYear?: number
}

/**
 * 연/월 스크롤 휠 픽커 (공용).
 * 가운데 선택 밴드에 맞춰 연도·월을 굴려 고른다.
 */
export default function YearMonthWheel({
  year,
  month,
  onChange,
  startYear,
  endYear,
}: YearMonthWheelProps) {
  const currentYear = new Date().getFullYear()
  // 선택값이 범위를 벗어나지 않도록 보정
  const from = Math.min(startYear ?? currentYear - 10, year)
  const to = Math.max(endYear ?? currentYear + 30, year)
  const years = Array.from({ length: to - from + 1 }, (_, i) => from + i)

  return (
    <div className="relative">
      {/* 가운데 선택 밴드 */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-10 -translate-y-1/2 rounded-lg bg-surface" />
      <div className="relative grid grid-cols-2">
        <WheelColumn
          items={years}
          value={year}
          onChange={(y) => onChange(y, month)}
          format={(y) => `${y}년`}
        />
        <WheelColumn
          items={MONTHS}
          value={month}
          onChange={(m) => onChange(year, m)}
          format={(m) => `${m}월`}
        />
      </div>
    </div>
  )
}
