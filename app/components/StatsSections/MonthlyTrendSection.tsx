'use client'

import { useState } from 'react'
import { Target, Flame } from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts'
import type { DateRange } from 'react-day-picker'
import type { PeriodPreset } from '@/app/hooks/stats/usePeriodFilter'
import type { ConsistencyInsight } from '@/app/hooks/chart/useChartData'

interface MonthlyTrendSectionProps {
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
 * 월별 이행 추세 블록 — 기간 필터·막대 차트·꾸준함 인사이트를 담당.
 * 이번 달 현황과 같은 주제(이행)의 줌아웃이라 Hero 카드 안에 구분선으로 합쳐 렌더한다.
 * 필터를 차트 바로 위(이 블록 헤더)에 두어 "필터가 무엇을 제어하는지"를 자명하게 만든다.
 */
export default function MonthlyTrendSection({
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
}: MonthlyTrendSectionProps) {
  // 막대 탭 → 그 달 요약(차트 아래). 같은 막대 재탭 시 해제. 기간 필터 변경 시 선택 초기화.
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const handlePreset = (p: PeriodPreset) => {
    setSelectedIndex(null)
    setPeriodPreset(p)
  }
  const handleCustom = () => {
    setSelectedIndex(null)
    handleCustomPeriod()
  }

  // 추세로 볼 만한 데이터(2개월 이상 납입 활동)가 있는지 — 없으면 빈 차트 대신 안내.
  const hasTrend = !!consistency && consistency.activeMonths >= 2

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-sm font-semibold text-foreground-muted">월별 적립 기록</h2>
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
            <DropdownMenuItem onClick={() => handlePreset('1')}>이번 달</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePreset('3')}>최근 3개월</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePreset('6')}>최근 6개월</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePreset('12')}>최근 12개월</DropdownMenuItem>
            <DropdownMenuItem onClick={handleCustom}>기간 선택</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

      {hasTrend ? (
        <>
          {/* 결론(요약) 먼저 → 근거(차트) 나중. 평균도 문장으로 풀어 격려 톤 유지 */}
          <p className="text-sm text-foreground-muted">
            {periodLabel} 평균{' '}
            <span className="font-semibold text-foreground tabular-nums">{periodCompletionRate}%</span>{' '}
            완료했어요
          </p>

          {/* 꾸준함 인사이트 — 통계 고유 집계 (캘린더·홈과 중복 없음).
              연속 2개월 이상이면 스트릭으로 강조, 아니면 기존 집계/최고 기록으로 폴백. */}
          {consistency.currentPerfectStreak >= 2 ? (
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary">
              <Flame className="w-3.5 h-3.5" weight="fill" />
              {consistency.currentPerfectStreak}개월째 빠짐없이 적립 완료 중
            </p>
          ) : consistency.perfectMonths > 0 ? (
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary">
              <Target className="w-3.5 h-3.5" weight="fill" />
              {periodLabel} 중 {consistency.perfectMonths}개월 100% 완료
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              가장 잘한 달 {consistency.bestMonthLabel} {consistency.bestRate}%
            </p>
          )}

          <div className="h-28 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 22, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={28} />
                <Bar
                  dataKey="rate"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                  onClick={(_, index) => setSelectedIndex((prev) => (prev === index ? null : index))}
                >
                  <LabelList
                    dataKey="rate"
                    content={(props: unknown) => {
                      // 이번 달(마지막) 막대 위에만 '적립 중' — 아직 적립 중이라 완료율이 확정 아님을 알림
                      const { x, y, width, index } = props as {
                        x: number
                        y: number
                        width: number
                        index: number
                      }
                      if (index !== chartData.length - 1) return null
                      return (
                        <text
                          x={x + width / 2}
                          y={y - 6}
                          textAnchor="middle"
                          style={{ fontSize: 9 }}
                          className="fill-muted-foreground"
                        >
                          적립 중
                        </text>
                      )
                    }}
                  />
                  {chartData.map((_, i) => {
                    // 강조는 '선택된 달'만 — 미선택일 땐 전부 중립.
                    // (강조색이 '이번 달'과 '선택한 달' 두 의미로 혼동되지 않게, 탭하면 색이 바뀌어 피드백도 생기게)
                    const isHighlighted = selectedIndex !== null && i === selectedIndex
                    return (
                      <Cell
                        key={i}
                        fill={isHighlighted ? chartEmphasisColor : chartBarColor}
                        cursor="pointer"
                      />
                    )
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 막대 탭 시 그 달 요약(차트 아래 고정 줄). 미선택 시 탐색 안내. */}
          {selectedIndex !== null && chartData[selectedIndex] ? (
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {chartData[selectedIndex].name} · {chartData[selectedIndex].total}건 중 {chartData[selectedIndex].completed}건 ·{' '}
              <span className="font-bold text-primary">{chartData[selectedIndex].rate}%</span> 완료
            </p>
          ) : (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              막대를 눌러 월별 기록을 볼 수 있어요
            </p>
          )}
        </>
      ) : (
        // 추세를 그릴 만큼 쌓이지 않은 신규/단월 상태 — 빈 차트 대신 격려 문구.
        <p className="text-sm text-muted-foreground py-6 text-center">
          다음 달부터 월별 적립 기록이 쌓여요.
        </p>
      )}
    </div>
  )
}
