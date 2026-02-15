'use client'

import Image from 'next/image'
import { formatCurrency } from '@/lib/utils'
import type { Investment } from '@/app/types/investment'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { formatPaymentDateShort } from '@/app/utils/date'
import { useUpcomingInvestments, PRESET_OPTIONS } from '@/app/hooks/useUpcomingInvestments'

interface UpcomingInvestmentsProps {
  records: Investment[]
}

export default function UpcomingInvestments({ records }: UpcomingInvestmentsProps) {
  const {
    selectedPreset,
    customDateRange,
    setCustomDateRange,
    expanded,
    setExpanded,
    pendingUndo,
    handleUndo,
    toggleComplete,
    selectPreset,
    selectCustomPreset,
    displayItems,
    hasMore,
    remainingCount,
    rangeLabel,
    visibleItemsCount,
  } = useUpcomingInvestments(records)

  if (records.length === 0) return null

  return (
    <div className="bg-card rounded-3xl p-6 pb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-1">
          <Image
            src="/icons/3d/bell-yellow.png"
            alt="다가오는 투자 알림 아이콘"
            width={24}
            height={24}
            className="w-6 h-6"
          />
          <span>다가오는 투자</span>
        </h2>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-border border-border hover:border-surface-strong-hover"
              >
                {rangeLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[140px]">
              {PRESET_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.days}
                  onClick={() => selectPreset(opt.days)}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={selectCustomPreset}>
                기간 선택
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 커스텀 기간 선택 */}
      {selectedPreset === 'custom' && (
        <div className="mb-4">
          <DateRangePicker
            value={customDateRange}
            onChange={setCustomDateRange}
            placeholder="기간 선택"
            buttonClassName="w-full"
          />
        </div>
      )}

      {visibleItemsCount === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          {rangeLabel} 이내 예정된 투자가 없어요
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {displayItems.map((item) => (
              <div
                key={`${item.investment.id}-${item.paymentDate.getTime()}-${item.dayOfMonth}`}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-surface"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {formatPaymentDateShort(item.paymentDate)} · {item.investment.title}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-bold text-foreground">
                    {formatCurrency(item.investment.monthly_amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleComplete(item.investment.id, item.paymentDate, item.dayOfMonth)}
                    className="px-3 py-1.5 rounded-lg border border-border text-foreground-muted text-xs font-medium hover:bg-surface-hover hover:border-surface-strong-hover transition-colors"
                    aria-label="납입 완료 체크"
                  >
                    완료하기
                  </button>
                </div>
              </div>
            ))}
          </div>
          {hasMore && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="w-full mt-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-hover rounded-xl transition-colors"
              aria-expanded={expanded}
            >
              {expanded ? '접기' : `${remainingCount}건 더 보기`}
            </button>
          )}
        </>
      )}

      {/* 되돌리기 토스트 */}
      {pendingUndo && (
        <div
          className="fixed bottom-24 left-4 right-4 z-50 flex items-center justify-between gap-3 rounded-xl bg-surface-dark text-white px-4 py-3 shadow-lg"
          role="status"
        >
          <span className="text-sm font-medium">완료됨</span>
          <button
            type="button"
            onClick={handleUndo}
            className="text-sm font-semibold text-brand-300 hover:text-brand-200 transition-colors"
          >
            되돌리기
          </button>
        </div>
      )}
    </div>
  )
}
