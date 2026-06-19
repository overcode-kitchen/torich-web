'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import RotatingInsights from '@/app/components/StatsSections/RotatingInsights'

interface MonthlyComplianceHeroSectionProps {
  /** 투자 기록 보유 여부 — false면 빈 상태 카드 렌더 */
  hasRecords: boolean
  thisMonth: {
    totalPayment: number
    completedPayment: number
    progress: number
    remainingPayment: number
  }
  /** 회전 칭찬 인사이트(누적 원금·지난달보다 더 등) — 진행바 아래에서 번갈아 노출 */
  insights?: React.ReactNode[]
  /** 월별 이행 추세 블록 — 같은 주제(이행)의 줌아웃이라 구분선 아래 같은 카드에 합쳐 렌더 */
  children?: React.ReactNode
}

/**
 * 통계 화면 주인공 — "이번 달 이행"을 위에, 구분선 아래 "월별 이행 추세"(children)를
 * 한 카드에 묶는다. 같은 주제(이행)의 줌아웃이므로 공통 영역(한 카드)으로 연결감을 유지하되,
 * 추세 블록이 자체 헤더+필터를 가져 "필터가 추세를 제어"한다는 점은 자명하게 둔다.
 */
export default function MonthlyComplianceHeroSection({
  hasRecords,
  thisMonth,
  insights,
  children,
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
      {/* 헤드라인: 이행률(%)을 주인공으로 — 금액은 홈(가리기 토글)과 중복·민감정보라 Hero에서 제외하고,
          통계 고유 지표인 '이번 달 이행' 정도를 크게 보여준다(토리치 이행·꾸준함 톤). */}
      {isMonthComplete ? (
        <div className="mb-3">
          <p className="text-sm text-foreground-muted mb-1">🎉 이번 달</p>
          <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
            100<span className="ml-0.5 text-xl font-semibold">% 이행 완료</span>
          </p>
        </div>
      ) : (
        <div className="mb-3">
          <p className="text-sm text-foreground-muted mb-1">이번 달 이행률</p>
          <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {thisMonth.progress}<span className="ml-0.5 text-xl font-semibold">% 이행 중</span>
          </p>
        </div>
      )}

      {/* 진행바만 — 이행률 수치는 헤드라인이 주인공이라 여기선 막대로만 보강. 금액은 비노출(홈 가리기 정책과 일관). */}
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${thisMonth.progress}%` }}
        />
      </div>

      {/* 회전 칭찬 인사이트 — 토스풍으로 아래에서 위로 슬라이드하며 번갈아 노출 */}
      {insights && insights.length > 0 && (
        <div className="mt-3">
          <RotatingInsights items={insights} />
        </div>
      )}

      {/* 월별 이행 추세 — 같은 주제의 줌아웃이라 구분선 아래 같은 카드에 묶는다 */}
      {children && <div className="mt-5 pt-5 border-t border-border">{children}</div>}
    </section>
  )
}
