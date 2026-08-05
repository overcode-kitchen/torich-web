'use client'

// 차트 미리보기 — 로그인·실제 적립 데이터 없이 통계 차트의 그래픽만 확인한다.
// 통나무 막대는 높이에 따라 쌓이는 부품 수가 달라지므로, 픽스처의 rate는
// 100·67·33처럼 일부러 넓게 흩어 놓는다. 낮은 막대에서도 옹이·가지가 나오는지,
// 같은 무늬가 연달아 붙지 않는지를 여기서 본다.
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

export default function DesignSystemChartPage() {
  return (
    <div className="p-5 max-w-md">
      <h1 className="text-lg font-bold mb-4">차트</h1>

      <section className="bg-card rounded-2xl p-5">
        <MonthlyTrendSection
          periodPreset="6"
          setPeriodPreset={() => {}}
          periodLabel="최근 6개월"
          customDateRange={undefined}
          setCustomDateRange={() => {}}
          handleCustomPeriod={() => {}}
          chartData={CHART_FIXTURE}
          chartBarColor="#8B5E3C"
          chartEmphasisColor="#4CAF50"
          consistency={{
            activeMonths: 2,
            perfectMonths: 0,
            bestMonthLabel: '5월',
            bestRate: 67,
            currentPerfectStreak: 0,
          }}
        />
      </section>
    </div>
  )
}
