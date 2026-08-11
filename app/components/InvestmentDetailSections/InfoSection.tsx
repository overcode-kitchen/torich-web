'use client'

import React from 'react'
import { TappableField } from '@/app/components/Common/TappableField'
import { formatContributionLabel, formatContributionValue } from '@/app/utils/investment-display'
import { useInvestmentDetailContext } from './InvestmentDetailContext'
import { formatInvestmentDays, isHabitMode as checkIsHabitMode } from '@/app/types/investment'

interface InfoSectionProps {
  infoRef: React.RefObject<HTMLElement | null>
  /** 정보 행을 탭하면 호출 (편집 진입). 미지정 시 각 행은 정적 표시. */
  onFieldTap?: (field: string) => void
}

export function InfoSection({ infoRef, onFieldTap }: InfoSectionProps) {
  const { item } = useInvestmentDetailContext()

  if (!item) return null

  const habit = checkIsHabitMode(item)

  // 목표 기간 표시 필드
  const periodValueText = habit ? '없음 (적립 중)' : `${item.period_years}년`

  const tap = (field: string): (() => void) | undefined =>
    onFieldTap ? () => onFieldTap(field) : undefined

  return (
    <section ref={infoRef} className="py-6">
      <h3 className="text-lg font-semibold tracking-tight text-foreground mb-4">
        투자 정보
      </h3>
      <div className="space-y-6">
        <TappableField
          label={formatContributionLabel(item)}
          value={formatContributionValue(item)}
          onTap={tap('monthlyAmount')}
        />

        <TappableField
          label="목표 기간"
          value={periodValueText}
          onTap={tap('period')}
        />

        {/* investment_days는 nullable이다. 적립일을 하나도 고르지 않으면 null이 되므로
            빈 배열로 넘겨 "없음" 상태로 렌더한다. */}
        <TappableField
          label="매월 투자일"
          value={formatInvestmentDays(item.investment_days ?? [])}
          onTap={tap('investmentDays')}
        />
      </div>
    </section>
  )
}
