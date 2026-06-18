'use client'

import { useRouter } from 'next/navigation'
import { TrendUp, TrendDown } from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'
import type { DateRange } from 'react-day-picker'
import type { PeriodPreset } from '@/app/hooks/stats/usePeriodFilter'
import type { MonthlyPaymentDelta } from '@/app/utils/stats'

interface MonthlyComplianceHeroSectionProps {
  /** 투자 기록 보유 여부 — false면 빈 상태 카드 렌더 */
  hasRecords: boolean
  thisMonth: {
    totalPayment: number
    completedPayment: number
    progress: number
    remainingPayment: number
  }
  delta?: Pick<MonthlyPaymentDelta, 'deltaAmount' | 'hasComparison'>
  // 기간 필터
  periodPreset: PeriodPreset
  setPeriodPreset: (preset: PeriodPreset) => void
  periodLabel: string
  customDateRange: DateRange | undefined
  setCustomDateRange: (range: DateRange | undefined) => void
  handleCustomPeriod: () => void
  // 차트
  periodCompletionRate: number
  chartData: Array<{ name: string; rate: number; completed: number; total: number }>
  chartBarColor: string
  chartEmphasisColor: string
}

/**
 * 통계 화면 주인공 — 이번 달 이행률을 중심으로 한 단일 Hero 카드.
 * 기존 MonthlyStatusSection(이번 달 현황) + CompletionRateSection(필터+추세차트)을 흡수.
 */
export default function MonthlyComplianceHeroSection({
  hasRecords,
  thisMonth,
  delta,
  periodPreset,
  setPeriodPreset,
  periodLabel,
  customDateRange,
  setCustomDateRange,
  handleCustomPeriod,
  periodCompletionRate,
  chartData,
  chartBarColor,
  chartEmphasisColor,
}: MonthlyComplianceHeroSectionProps) {
  const router = useRouter()

  if (!hasRecords) {
    return (
      <section className="bg-card rounded-2xl p-6 mb-4 text-center">
        <h2 className="text-base font-bold text-foreground mb-1">아직 투자 기록이 없어요</h2>
        <p className="text-sm text-muted-foreground mb-4">
          첫 투자를 등록하고 이번 달 이행률을 확인해보세요.
        </p>
        <Button onClick={() => router.push('/add')}>첫 투자 등록하기</Button>
      </section>
    )
  }

  const showDelta = delta?.hasComparison
  const isUp = (delta?.deltaAmount ?? 0) > 0
  const isDown = (delta?.deltaAmount ?? 0) < 0
  const deltaTone = isUp ? 'text-primary' : isDown ? 'text-muted-foreground' : 'text-foreground-muted'
  const deltaText = isUp
    ? `지난달 대비 +${delta!.deltaAmount.toLocaleString()}원`
    : isDown
      ? `지난달 대비 ${delta!.deltaAmount.toLocaleString()}원`
      : '지난달과 동일'

  return (
    <section className="bg-card rounded-2xl p-5 mb-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-sm font-semibold text-foreground-muted">이번 달 이행</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-border border-border hover:border-surface-strong-hover"
            >
              {periodLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[140px]">
            <DropdownMenuItem onClick={() => setPeriodPreset('1')}>이번 달</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPeriodPreset('3')}>최근 3개월</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPeriodPreset('6')}>최근 6개월</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPeriodPreset('12')}>최근 12개월</DropdownMenuItem>
            <DropdownMenuItem onClick={handleCustomPeriod}>기간 선택</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-end gap-3 mb-1">
        <span className="text-4xl font-extrabold tracking-tight text-foreground tabular-nums">
          {thisMonth.progress}%
        </span>
        {showDelta && (
          <span className={`inline-flex items-center gap-0.5 text-sm font-medium mb-1.5 ${deltaTone}`}>
            {isUp && <TrendUp className="w-4 h-4" weight="bold" />}
            {isDown && <TrendDown className="w-4 h-4" weight="bold" />}
            {deltaText}
          </span>
        )}
      </div>

      <p className="text-sm text-foreground-muted mb-3">
        {thisMonth.completedPayment.toLocaleString()}원 / {thisMonth.totalPayment.toLocaleString()}원
        {thisMonth.remainingPayment > 0 && ` · 남은 ${thisMonth.remainingPayment.toLocaleString()}원`}
      </p>

      <div className="h-2 bg-secondary rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${thisMonth.progress}%` }}
        />
      </div>

      {periodPreset === 'custom' && (
        <div className="mb-3">
          <DateRangePicker
            value={customDateRange}
            onChange={setCustomDateRange}
            placeholder="기간 선택"
            buttonClassName="w-full"
          />
        </div>
      )}

      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={28} />
            <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell
                  key={i}
                  fill={i === chartData.length - 1 ? chartEmphasisColor : chartBarColor}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {periodLabel} 월별 완료율 · 평균 {periodCompletionRate}%
      </p>
    </section>
  )
}
