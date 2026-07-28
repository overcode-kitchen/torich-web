'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import RotatingInsights from '@/app/components/StatsSections/RotatingInsights'
import { track } from '@/app/lib/analytics'

interface AchievementHeroSectionProps {
  /** 투자 기록 보유 여부 — false면 빈 상태 카드 렌더 */
  hasRecords: boolean
  /** 누적 적립 완료 건수(자동+소급) — 헤드라인 주인공 */
  totalCompleted: number
  /** 헤드라인 아래 회전 칭찬 인사이트(지난달보다 더 모았어요 등) */
  insights?: React.ReactNode[]
}

/**
 * 통계 화면 주인공 — "지금까지 몇 번 적립했나"(누적 성취).
 *
 * 이전에는 '이번 달 이행률(%)'이 이 자리에 있었다. 그러나 이번 달 상태는 홈(체크리스트)이 담당하는
 * 실행 정보이고, 바로 아래 월별 추세 차트의 마지막 막대와 중복이라 이행 현황은 그 카드로 내렸다.
 * 통계 탭은 회고("얼마나 해왔나")를 맡으므로, 줄어들지 않는 누적 건수를 헤드라인으로 둔다.
 *
 * 기간 필터에 종속된 값(스트릭·기간 내 100% 개월·최고 기록)은 필터가 있는 추세 카드에만 둔다.
 * 그러지 않으면 아래쪽 필터를 바꿀 때 이 카드의 문구가 함께 흔들려 무슨 기간의 이야기인지 알 수 없다.
 */
export default function AchievementHeroSection({
  hasRecords,
  totalCompleted,
  insights,
}: AchievementHeroSectionProps) {
  const router = useRouter()

  useEffect(() => {
    if (!hasRecords) return
    track('stats_achievement_view', { total_completed: totalCompleted })
    // 진입 시 1회만 — 누적 건수 분포로 이 카드가 실제 의미를 갖는 사용자 비중을 확인한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRecords])

  if (!hasRecords) {
    return (
      <section className="bg-card rounded-2xl p-6 mb-4 text-center">
        <h2 className="text-base font-bold text-foreground mb-1">아직 투자 기록이 없어요</h2>
        <p className="text-sm text-muted-foreground mb-4">
          첫 투자를 등록하고 매달 적립을 챙겨보세요.
        </p>
        <Button onClick={() => router.push('/add')}>첫 투자 등록하기</Button>
      </section>
    )
  }

  // 아직 완료한 적립이 없으면 '0번'을 크게 띄우지 않는다 — 의욕을 꺾고, 담을 내용도 없다.
  // (이때 통계 첫 화면은 StatsContent의 저데이터 순서에 따라 목적 진척이 맡는다)
  if (totalCompleted === 0) return null

  return (
    <section className="bg-card rounded-2xl p-5 mb-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-foreground-muted mb-1">지금까지 적립</p>
          <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {totalCompleted}
            <span className="ml-0.5 text-xl font-semibold">번 완료</span>
          </p>
        </div>
        <Image src="/icons/3d/acorn-1.png" alt="" width={48} height={48} className="w-12 h-12" />
      </div>

      {/* 회전 칭찬 인사이트 — 토스풍으로 아래에서 위로 슬라이드하며 번갈아 노출 */}
      {insights && insights.length > 0 && (
        <div className="mt-3">
          <RotatingInsights items={insights} />
        </div>
      )}
    </section>
  )
}
