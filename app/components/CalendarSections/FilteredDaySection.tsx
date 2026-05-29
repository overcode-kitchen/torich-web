'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { X } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { PaymentEvent } from '@/app/utils/stats'
import type { Investment } from '@/app/types/investment'
import { PaymentEventRow } from './PaymentEventRow'

interface FilteredDaySectionProps {
  filterDate: Date
  filterEvents: PaymentEvent[]
  records: Investment[]
  isEventCompleted: (event: PaymentEvent) => boolean
  handleComplete: (event: PaymentEvent) => void
  onClearFilter: () => void
}

export function FilteredDaySection({
  filterDate,
  filterEvents,
  records,
  isEventCompleted,
  handleComplete,
  onClearFilter,
}: FilteredDaySectionProps) {
  const router = useRouter()

  const investmentMap = useMemo(() => {
    const map = new Map<string, Investment>()
    for (const r of records) map.set(r.id, r)
    return map
  }, [records])

  const completedCount = filterEvents.filter((e) => isEventCompleted(e)).length
  const pendingCount = filterEvents.length - completedCount
  // 미완료 우선 — 처리할 항목이 위에 오도록
  const sorted = [...filterEvents].sort(
    (a, b) => Number(isEventCompleted(a)) - Number(isEventCompleted(b)),
  )

  const goToDetail = (investmentId: string) => {
    router.push(`/investment?id=${investmentId}`)
  }

  return (
    <div
      className="bg-card rounded-2xl p-4"
      onClick={(e) => e.stopPropagation()}
      role="presentation"
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-foreground-soft truncate">
          {format(filterDate, 'M월 d일 (E)', { locale: ko })}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            예정 {pendingCount} · 완료 {completedCount}
          </span>
        </h3>
        <button
          type="button"
          onClick={onClearFilter}
          className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-foreground-subtle hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="날짜 필터 해제"
        >
          <X size={12} weight="bold" />
          <span>전체 보기</span>
        </button>
      </div>
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">예정된 투자가 없어요</p>
      ) : (
        <div>
          {sorted.map((e, idx) => (
            <PaymentEventRow
              key={`${e.year}-${e.month}-${e.day}-${e.investmentId}`}
              event={e}
              investment={investmentMap.get(e.investmentId)}
              isCompleted={isEventCompleted(e)}
              onClick={() => goToDetail(e.investmentId)}
              onComplete={() => handleComplete(e)}
              showDivider={idx !== sorted.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
