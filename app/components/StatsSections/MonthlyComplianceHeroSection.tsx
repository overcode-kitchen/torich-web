'use client'

import { useRouter } from 'next/navigation'
import { Target } from '@phosphor-icons/react'
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
import type { ConsistencyInsight } from '@/app/hooks/chart/useChartData'

interface MonthlyComplianceHeroSectionProps {
  /** 투자 기록 보유 여부 — false면 빈 상태 카드 렌더 */
  hasRecords: boolean
  thisMonth: {
    totalPayment: number
    completedPayment: number
    progress: number
    remainingPayment: number
  }
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
  /** 꾸준함 인사이트 — 통계 고유 집계 지표 (캘린더·홈과 중복되지 않음) */
  consistency: ConsistencyInsight | null
}

/**
 * 통계 화면 주인공 — 이번 달 이행률을 중심으로 한 단일 Hero 카드.
 * 기존 MonthlyStatusSection(이번 달 현황) + CompletionRateSection(필터+추세차트)을 흡수.
 */
export default function MonthlyComplianceHeroSection({
  hasRecords,
  thisMonth,
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
  consistency,
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

  // 이번 달 예정 납입을 모두 완료했는지 (성취 마일스톤 표시 조건)
  const isMonthComplete = thisMonth.totalPayment > 0 && thisMonth.remainingPayment === 0

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
      </div>

      {/* 금액 줄: 진행 중엔 모은/예정·남은 금액, 이번 달 다 채우면 성취 축하로 전환 */}
      {isMonthComplete ? (
        <p className="text-sm font-semibold text-primary mb-3">
          🎉 이번 달 {thisMonth.totalPayment.toLocaleString()}원 모으기 성공!
        </p>
      ) : (
        <p className="text-sm text-foreground-muted mb-3">
          {thisMonth.completedPayment.toLocaleString()}원 / {thisMonth.totalPayment.toLocaleString()}원
          {thisMonth.remainingPayment > 0 && ` · 남은 ${thisMonth.remainingPayment.toLocaleString()}원`}
        </p>
      )}

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

      {/* 꾸준함 인사이트 — 2개월 이상 데이터가 있을 때만. 단일 월은 위 대형 %와 중복이라 숨김 */}
      {consistency && consistency.activeMonths >= 2 && (
        consistency.perfectMonths > 0 ? (
          <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary">
            <Target className="w-3.5 h-3.5" weight="fill" />
            {periodLabel} 중 {consistency.perfectMonths}개월 100% 이행 달성
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-muted-foreground">
            최고 이행 {consistency.bestMonthLabel} {consistency.bestRate}%
          </p>
        )
      )}
    </section>
  )
}
