'use client'

import { formatCurrency } from '@/lib/utils'
import { TappableField } from '@/app/components/Common/TappableField'
import type { Goal, GoalProgress } from '@/app/types/goal'

export interface GoalInfoSectionProps {
  goal: Goal
  progress: GoalProgress
  /**
   * 정보 행을 탭하면 호출 (해당 필드 편집 진입). 미지정 시 각 행은 정적 표시.
   * 예적금·현금·투자 상세와 같은 규약이다. (이슈 #72)
   */
  onFieldTap?: (field: string) => void
}

export function GoalInfoSection({
  goal,
  progress,
  onFieldTap,
}: GoalInfoSectionProps) {
  const hasTarget = goal.target_amount > 0
  const remaining = Math.max(0, goal.target_amount - progress.currentValue)

  const tap = (field: string): (() => void) | undefined =>
    onFieldTap ? () => onFieldTap(field) : undefined

  // 금액 없이 만든 목적은 여기가 나중에 채우는 자리다. 빈 값을 '미설정'으로만 두면
  // 어디서 채우는지 알 수 없으므로 값 자리에 유도 칩을 둔다. 행 전체가 이미 button이라
  // 칩은 비인터랙티브 span이어야 한다(중첩 button 금지 — TappableField 주석 참고).
  const targetValue = hasTarget ? (
    formatCurrency(goal.target_amount)
  ) : onFieldTap ? (
    <span className="rounded-full bg-surface-hover px-3 py-1 text-sm font-medium text-foreground-soft">
      정하기
    </span>
  ) : (
    '미설정'
  )

  return (
    <section className="py-6">
      <h3 className="text-lg font-semibold tracking-tight text-foreground mb-4">
        목적 정보
      </h3>
      <div className="space-y-6">
        <TappableField
          label="목표 금액"
          value={targetValue}
          onTap={tap('target_amount')}
        />

        <TappableField
          label="이미 모은 돈"
          value={formatCurrency(goal.external_amount)}
          onTap={tap('external_amount')}
        />

        {/* 남은 금액은 목표−모은 금액으로 계산된 값이라 고칠 대상이 없다. 탭 불가로 유지하되,
            위 두 행과 같은 틀(TappableField, onTap 없음)을 써야 높이·오른쪽 끝이 맞는다. */}
        {hasTarget && (
          <TappableField label="남은 금액" value={formatCurrency(remaining)} />
        )}
      </div>
    </section>
  )
}
