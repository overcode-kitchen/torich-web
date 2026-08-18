'use client'

// 차트 미리보기 — 로그인·실제 적립 데이터 없이 통계 차트의 그래픽만 확인한다.
// 통나무 막대는 높이에 따라 쌓이는 부품 수가 달라지므로, 픽스처의 rate는
// 100·67·33처럼 일부러 넓게 흩어 놓는다. 낮은 막대에서도 옹이·가지가 나오는지,
// 같은 무늬가 연달아 붙지 않는지를 여기서 본다.
import { useMemo } from 'react'
import MonthlyTrendSection from '@/app/components/StatsSections/MonthlyTrendSection'

const CHART_FIXTURE = [
  { name: '8월', rate: 100, completed: 3, total: 3 },
  { name: '9월', rate: 67, completed: 2, total: 3 },
  { name: '10월', rate: 100, completed: 3, total: 3 },
  { name: '11월', rate: 33, completed: 1, total: 3 },
  { name: '12월', rate: 100, completed: 3, total: 3 },
  { name: '1월', rate: 50, completed: 1, total: 2 },
  { name: '2월', rate: 100, completed: 2, total: 2 },
  { name: '3월', rate: 75, completed: 3, total: 4 },
  { name: '4월', rate: 100, completed: 4, total: 4 },
  { name: '5월', rate: 67, completed: 2, total: 3 },
  { name: '6월', rate: 90, completed: 9, total: 10 },
  { name: '7월', rate: 33, completed: 1, total: 3 },
]

/**
 * 실제 화면(useChartData)과 같은 방식으로 차트 색을 구한다.
 * Recharts는 색을 SVG 속성으로 받아 Tailwind 클래스가 닿지 않으므로, 값을 박지 않고
 * 토큰을 런타임에 읽는다. 여기서 값을 따로 적으면 테마가 바뀔 때 미리보기만 어긋난다.
 */
function useChartTokenColors() {
  return useMemo(() => {
    // SSR에는 document가 없다. 미리보기 전용이라 근사색 fallback을 두지 않고,
    // 값을 읽을 수 있을 때만 차트를 그린다.
    if (typeof window === 'undefined') return null
    const root = getComputedStyle(document.documentElement)
    return {
      bar: root.getPropertyValue('--foreground-subtle').trim(),
      emphasis: root.getPropertyValue('--primary').trim(),
    }
  }, [])
}

export default function DesignSystemChartPage() {
  const colors = useChartTokenColors()

  return (
    <div className="p-4 max-w-md">
      <h1 className="text-heading font-bold mb-4">차트</h1>

      <section className="bg-card rounded-2xl p-4">
        {colors && (
          <MonthlyTrendSection
            periodPreset="6"
            setPeriodPreset={() => {}}
            periodLabel="최근 6개월"
            customDateRange={undefined}
            setCustomDateRange={() => {}}
            handleCustomPeriod={() => {}}
            chartData={CHART_FIXTURE}
            chartBarColor={colors.bar}
            chartEmphasisColor={colors.emphasis}
            consistency={{
              activeMonths: 2,
              perfectMonths: 0,
              bestMonthLabel: '5월',
              bestRate: 67,
              currentPerfectStreak: 0,
            }}
          />
        )}
      </section>
    </div>
  )
}
