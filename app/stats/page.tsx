'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { CircleNotch, Info } from '@phosphor-icons/react'
import { formatCurrency } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Investment, getStartDate } from '@/app/types/investment'
import { isCompleted } from '@/app/utils/date'
import {
  getThisMonthStats,
  getMonthlyCompletionRates,
  getMonthlyCompletionRatesForRange,
} from '@/app/utils/stats'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import type { DateRange } from 'react-day-picker'
import { subDays } from 'date-fns'
import CashHoldItemsSheet from '@/app/components/CashHoldItemsSheet'
import MonthlyContributionSheet from '@/app/components/MonthlyContributionSheet'
import AssetGrowthChart from '@/app/components/AssetGrowthChart'

const calculateSimulatedValue = (
  monthlyAmount: number,
  T: number,
  P: number,
  R: number = 0.10
): number => {
  const monthlyRate = R / 12
  if (T <= P) {
    const totalMonths = T * 12
    return monthlyAmount * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate)
  }
  const maturityMonths = P * 12
  return monthlyAmount * ((Math.pow(1 + monthlyRate, maturityMonths) - 1) / monthlyRate) * (1 + monthlyRate)
}

export default function StatsPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [records, setRecords] = useState<Investment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<number>(5)
  const [showCashHoldSheet, setShowCashHoldSheet] = useState(false)
  const [showContributionSheet, setShowContributionSheet] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)
      if (u) {
        const { data } = await supabase
          .from('records')
          .select('*')
          .order('created_at', { ascending: false })
        setRecords(data || [])
      }
      setIsLoading(false)
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        supabase.from('records').select('*').order('created_at', { ascending: false }).then(({ data }) => {
          setRecords(data || [])
        })
      } else {
        setRecords([])
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  type PeriodPreset = '1' | '3' | '6' | '12' | 'custom'
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('6')
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(() => {
    const end = new Date()
    const start = subDays(end, 6)
    return { from: start, to: end }
  })

  const isCustomRange = periodPreset === 'custom' && customDateRange?.from && customDateRange?.to
  const effectiveMonths = periodPreset === 'custom' ? 6 : parseInt(periodPreset, 10)

  const activeRecords = useMemo(() => {
    return records.filter((r) => {
      const start = getStartDate(r)
      return !isCompleted(start, r.period_years)
    })
  }, [records])

  const { totalExpectedAsset, totalMonthlyPayment, hasMaturedInvestments } = useMemo(() => {
    if (records.length === 0) {
      return { totalExpectedAsset: 0, totalMonthlyPayment: 0, hasMaturedInvestments: false }
    }
    const totalExpectedAsset = records.reduce((sum, record) => {
      const P = record.period_years
      const R = record.annual_rate ? record.annual_rate / 100 : 0.10
      return sum + calculateSimulatedValue(record.monthly_amount, selectedYear, P, R)
    }, 0)
    const totalMonthlyPayment = records.reduce((sum, record) => sum + record.monthly_amount, 0)
    const hasMaturedInvestments = records.some((r) => r.period_years < selectedYear)
    return { totalExpectedAsset, totalMonthlyPayment, hasMaturedInvestments }
  }, [records, selectedYear])

  const thisMonth = useMemo(() => getThisMonthStats(activeRecords), [activeRecords])

  const monthlyRates = useMemo(() => {
    if (isCustomRange) {
      return getMonthlyCompletionRatesForRange(activeRecords, customDateRange!.from!, customDateRange!.to!)
    }
    return getMonthlyCompletionRates(activeRecords, effectiveMonths)
  }, [activeRecords, effectiveMonths, isCustomRange, customDateRange])

  const periodCompletionRate = useMemo(() => {
    const rates = monthlyRates
    if (rates.length === 0) return 0
    const totalEvents = rates.reduce((s, r) => s + r.total, 0)
    const totalCompleted = rates.reduce((s, r) => s + r.completed, 0)
    return totalEvents > 0 ? Math.round((totalCompleted / totalEvents) * 100) : 0
  }, [monthlyRates])

  const chartData = useMemo(() => {
    return [...monthlyRates].reverse().map((r) => ({
      name: r.monthLabel,
      rate: r.rate,
      completed: r.completed,
      total: r.total,
    }))
  }, [monthlyRates])

  // 차트 바 색상: 라이트/다크 공통으로 coolgray 계열 사용
  const chartBarColor = useMemo(() => {
    if (typeof window === 'undefined') {
      // 서버 사이드 렌더링 시에는 대략적인 coolgray 색상으로 fallback
      return '#9c9ea6'
    }
    const root = getComputedStyle(document.documentElement)
    const fromToken = root.getPropertyValue('--foreground-soft').trim()
    return fromToken || '#9c9ea6'
  }, [])

  const periodLabel =
    periodPreset === '1'
      ? '이번 달'
      : periodPreset === 'custom' && isCustomRange
        ? `${customDateRange!.from!.toLocaleDateString('ko-KR', { month: 'short', year: 'numeric' })} - ${customDateRange!.to!.toLocaleDateString('ko-KR', { month: 'short', year: 'numeric' })}`
        : `최근 ${effectiveMonths}개월`

  if (isLoading) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center">
        <CircleNotch className="w-8 h-8 animate-spin text-muted-foreground" />
      </main>
    )
  }

  if (!user) {
    router.replace('/login')
    return null
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        <h1 className="text-xl font-bold text-foreground mb-6">통계</h1>

        {/* 예상 자산 */}
        {records.length > 0 && (
          <section className="bg-card rounded-2xl p-5 mb-4 relative">
            <div className="flex items-center gap-3 mb-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-border border-border hover:border-surface-strong-hover"
                  >
                    {selectedYear}년 뒤
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[120px]">
                  <DropdownMenuItem onClick={() => setSelectedYear(1)}>1년 뒤</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedYear(3)}>3년 뒤</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedYear(5)}>5년 뒤</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedYear(10)}>10년 뒤</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedYear(30)}>30년 뒤</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <h2 className="text-sm font-semibold text-foreground-muted">예상 자산</h2>
            </div>
            <p className="text-2xl font-extrabold tracking-tight text-foreground mb-3">
              {formatCurrency(totalExpectedAsset)}
            </p>
            {hasMaturedInvestments && (
              <button
                onClick={() => setShowCashHoldSheet(true)}
                className="flex items-center gap-1.5 w-full text-left group mb-3"
              >
                <Info className="w-4 h-4 text-foreground-subtle flex-shrink-0 group-hover:text-muted-foreground transition-colors" />
                <span className="text-xs text-foreground-subtle leading-relaxed group-hover:text-muted-foreground transition-colors">
                  만기가 지난 상품은 현금으로 보관한다고 가정했어요.
                </span>
              </button>
            )}
            <button
              onClick={() => setShowContributionSheet(true)}
              className="inline-flex items-center rounded-full border border-border bg-muted-darker text-foreground-soft font-semibold text-sm px-3 py-1.5 hover:brightness-95 transition-colors"
            >
              월 {formatCurrency(totalMonthlyPayment)}씩 투자 중
            </button>
          </section>
        )}

        {/* 예상 수익 차트 */}
        {records.length > 0 && (
          <section className="bg-card rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-border border-border hover:border-surface-strong-hover"
                  >
                    {selectedYear}년 뒤
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[120px]">
                  <DropdownMenuItem onClick={() => setSelectedYear(3)}>3년 뒤</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedYear(5)}>5년 뒤</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedYear(10)}>10년 뒤</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedYear(15)}>15년 뒤</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedYear(20)}>20년 뒤</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedYear(25)}>25년 뒤</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedYear(30)}>30년 뒤</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <h2 className="text-sm font-semibold text-foreground-muted">예상 수익 차트</h2>
            </div>
            <AssetGrowthChart investments={records} selectedYear={selectedYear} />
          </section>
        )}

        {/* 이번 달 현황 */}
        <section className="bg-card rounded-2xl p-5 mb-4">
          <h2 className="text-sm font-semibold text-foreground-muted mb-3">이번 달 납입 현황</h2>
          <p className="text-lg font-bold text-foreground mb-2">
            {thisMonth.total}건 중 {thisMonth.completed}건 완료
          </p>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground-soft rounded-full transition-all duration-500"
              style={{ width: thisMonth.total > 0 ? `${(thisMonth.completed / thisMonth.total) * 100}%` : '0%' }}
            />
          </div>
        </section>

        {/* 기간별 완료율 */}
        <section className="bg-card rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-border border-border hover:border-surface-strong-hover"
                >
                  {periodLabel}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[140px]">
                <DropdownMenuItem onClick={() => setPeriodPreset('1')}>이번 달</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPeriodPreset('3')}>최근 3개월</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPeriodPreset('6')}>최근 6개월</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPeriodPreset('12')}>최근 12개월</DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setPeriodPreset('custom')
                    const end = new Date()
                    setCustomDateRange({ from: subDays(end, 6), to: end })
                  }}
                >
                  기간 선택
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <h2 className="text-sm font-semibold text-foreground-muted">완료율</h2>
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
          <p className="text-2xl font-bold text-foreground mb-4">{periodCompletionRate}%</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={28} />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={chartBarColor} fillOpacity={0.7 + (i / chartData.length) * 0.3} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{periodLabel} 월별 완료율</p>
        </section>

      </div>

      {showCashHoldSheet && (
        <CashHoldItemsSheet
          items={records}
          selectedYear={selectedYear}
          onClose={() => setShowCashHoldSheet(false)}
          calculateFutureValue={calculateSimulatedValue}
        />
      )}

      {showContributionSheet && (
        <MonthlyContributionSheet
          items={records}
          totalAmount={totalMonthlyPayment}
          onClose={() => setShowContributionSheet(false)}
        />
      )}
    </main>
  )
}
