'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SavedMoneyHeroSection from '@/app/components/StatsSections/SavedMoneyHeroSection'
import GoalCompositionSection from '@/app/components/StatsSections/GoalCompositionSection'
import RecordTypeShareTiles from '@/app/components/StatsSections/RecordTypeShareTiles'
import StatsEmptyCard from '@/app/components/StatsSections/StatsEmptyCard'
import { useMoneyTabData } from '@/app/hooks/stats/useMoneyTabData'
import { useAmountVisibility } from '@/app/hooks/stats/useAmountVisibility'
import { useMoneyChartColors } from '@/app/hooks/stats/useMoneyChartColors'
import type {
  StatsCalculations,
  StatsData,
  StatsUI,
} from '@/app/components/StatsSections/stats-props'

interface StatsMoneyTabProps {
  data: StatsData
  ui: StatsUI
  calculations: StatsCalculations
}

/**
 * 모은 돈 탭 — "얼마 모였고 어디에 있나".
 *
 * 이름을 '자산'으로 두지 않는다. 사용자의 실제 자산은 금융앱·증권사 통합조회에서 보고,
 * 우리가 아는 건 토리치에 직접 입력하고 직접 체크한 것뿐이라 '자산'이라 부르면 그 값과 계속
 * 어긋난다. 그래서 앱이 이미 쓰는 말(지금까지 모은 돈)을 쓰고, 범위를 한 줄로 밝힌다.
 *
 * 누적 원금(hero) → 목적별 구성 → 유형 비중 순으로 "얼마"에서 "어디"로 내려간다.
 */
export default function StatsMoneyTab({ data, ui, calculations }: StatsMoneyTabProps) {
  const router = useRouter()
  const { cumulative, composition, typeShare } = useMoneyTabData({
    records: data.records,
    goals: data.goals,
  })
  const { amountsVisible, canToggle, toggle } = useAmountVisibility()
  const colors = useMoneyChartColors()

  if (!data.hasRecords) {
    return (
      <StatsEmptyCard
        title="아직 투자 기록이 없어요"
        description="첫 투자를 등록하고 매달 적립을 챙겨보세요."
        actionLabel="첫 투자 등록하기"
        onAction={() => router.push('/add')}
      />
    )
  }

  // 완료한 적립이 없으면 '0원'을 크게 띄우지 않는다 — 대신 무엇을 하면 쌓이는지 알려준다.
  if (calculations.totalPaidPrincipal <= 0) {
    return (
      <StatsEmptyCard
        title="아직 모은 돈이 없어요"
        description={'이번 달 적립을 완료로 체크하면\n여기에 쌓인 금액이 보여요.'}
        actionLabel="적립 체크하러 가기"
        onAction={() => router.push('/')}
      />
    )
  }

  return (
    <>
      <SavedMoneyHeroSection
        totalPaidPrincipal={calculations.totalPaidPrincipal}
        totalMonthlyPayment={calculations.totalMonthlyPayment}
        cumulative={cumulative}
        curveColor={colors.curve}
        dotStroke={colors.separator}
        amountsVisible={amountsVisible}
        canToggleAmounts={canToggle}
        onToggleAmounts={toggle}
        onShowContribution={ui.handleShowContribution}
      />

      <GoalCompositionSection
        slices={composition}
        colors={colors.slices}
        separator={colors.separator}
        amountsVisible={amountsVisible}
      />

      <RecordTypeShareTiles tiles={typeShare} amountsVisible={amountsVisible} />

      {/* 범위 안내 — 금융앱에서 보는 '내 자산'과 다른 값이라는 오해를 미리 닫는다 */}
      <p className="px-1 text-center text-xs text-muted-foreground">
        토리치에 기록한 것만 합산해요
      </p>

      {/* 수익률 해명은 '모은 돈'을 본 직후 떠오르는 질문이라 이 탭 마무리 각주로 둔다 */}
      <Link
        href="/faq"
        className="block text-center pt-3 pb-4 text-sm text-muted-foreground hover:text-foreground-soft transition-colors"
      >
        토리치는 왜 수익률을 안 보여주나요? →
      </Link>
    </>
  )
}
