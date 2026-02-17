'use client'

'use client'

import Image from 'next/image'
import type { Investment } from '@/app/types/investment'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { PRESET_OPTIONS, DisplayItem } from '@/app/hooks/useUpcomingInvestments'
import UpcomingInvestmentsEmptyState from '@/app/components/UpcomingInvestmentsSections/UpcomingInvestmentsEmptyState'
import UpcomingInvestmentsList from '@/app/components/UpcomingInvestmentsSections/UpcomingInvestmentsList'
import type { DateRange } from 'react-day-picker'

interface UpcomingInvestmentsProps {
  records: Investment[]
  data: {
    selectedPreset: 'preset' | 'custom'
    customDateRange: DateRange | undefined
    setCustomDateRange: (range: DateRange | undefined) => void
    expanded: boolean
    setExpanded: (expanded: boolean | ((prev: boolean) => boolean)) => void
    pendingUndo: { investmentId: string; date: Date; dayOfMonth: number } | null
    handleUndo: () => void
    toggleComplete: (investmentId: string, date: Date, dayOfMonth: number) => void
    selectPreset: (days: number) => void
    selectCustomPreset: () => void
    displayItems: DisplayItem[]
    hasMore: boolean
    remainingCount: number
    rangeLabel: string
    visibleItemsCount: number
    isLoading: boolean
  }
}

export default function UpcomingInvestments({ records, data }: UpcomingInvestmentsProps) {
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
  } = data

  if (records.length === 0) return null
  if (data.isLoading) return null // Or a skeleton


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
        <UpcomingInvestmentsEmptyState rangeLabel={rangeLabel} />
      ) : (
        <UpcomingInvestmentsList
          displayItems={displayItems}
          toggleComplete={toggleComplete}
          expandState={{ expanded, setExpanded, hasMore, remainingCount }}
        />
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
