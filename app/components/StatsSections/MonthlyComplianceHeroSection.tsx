'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface MonthlyComplianceHeroSectionProps {
  /** 투자 기록 보유 여부 — false면 빈 상태 카드 렌더 */
  hasRecords: boolean
  thisMonth: {
    totalPayment: number
    completedPayment: number
    progress: number
    remainingPayment: number
  }
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
      {/* 헤드라인: 차가운 숫자 대신 행동을 칭찬하는 문장(토리치 격려 톤). 적립·목표를 아우르는 중립어 "이행" 사용, 숫자는 강조해 한눈에 들어오게 유지 */}
      {isMonthComplete ? (
        <h2 className="text-xl font-bold text-foreground mb-1.5">
          🎉 이번 달, 계획을 모두 이행했어요
        </h2>
      ) : (
        <h2 className="text-xl font-bold text-foreground mb-1.5">
          이번 달{' '}
          <span className="text-2xl font-extrabold text-primary tabular-nums">
            {thisMonth.progress}%
          </span>{' '}
          이행했어요
        </h2>
      )}

      {/* 금액 줄: 진행 중엔 모은/예정·남은 금액, 이번 달 다 채우면 모은 금액 강조 */}
      {isMonthComplete ? (
        <p className="text-sm font-semibold text-primary mb-3">
          {thisMonth.totalPayment.toLocaleString()}원 모으기 성공!
        </p>
      ) : (
        <p className="text-sm text-foreground-muted mb-3">
          {thisMonth.completedPayment.toLocaleString()}원 / {thisMonth.totalPayment.toLocaleString()}원
          {thisMonth.remainingPayment > 0 && ` · 남은 ${thisMonth.remainingPayment.toLocaleString()}원`}
        </p>
      )}

      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${thisMonth.progress}%` }}
        />
      </div>

      {/* 월별 이행 추세 — 같은 주제의 줌아웃이라 구분선 아래 같은 카드에 묶는다 */}
      {children && <div className="mt-5 pt-5 border-t border-border">{children}</div>}
    </section>
  )
}
