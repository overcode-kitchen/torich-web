'use client'

import React from 'react'
import { InvestmentField } from '@/app/components/Common/InvestmentField'
import { formatContributionLabel, formatContributionValue } from '@/app/utils/investment-display'
import { useInvestmentDetailContext } from './InvestmentDetailContext'
import { InvestmentDaysField } from './InvestmentDaysField'
import { isHabitMode as checkIsHabitMode } from '@/app/types/investment'

interface InfoSectionProps {
  infoRef: React.RefObject<HTMLElement | null>
}

export function InfoSection({ infoRef }: InfoSectionProps) {
  const { item } = useInvestmentDetailContext()

  if (!item) return null

  const habit = checkIsHabitMode(item)

  // 목표 기간 표시 필드
  const periodValueText = habit ? '없음 (적립 중)' : `${item.period_years}년`

  return (
    <section ref={infoRef} className="py-6">
      <h3 className="text-lg font-semibold tracking-tight text-foreground mb-4">
        투자 정보
      </h3>
      <div className="space-y-6">
        <InvestmentField
          label={formatContributionLabel(item)}
          value={formatContributionValue(item)}
        />

        <InvestmentField
          label="목표 기간"
          value={periodValueText}
        />

        {/* investment_days는 nullable이다. 적립일을 하나도 고르지 않으면 null이 되는데,
            InvestmentDaysField가 .length를 바로 읽어 크래시한다. 빈 배열이면 "없음" 상태로 정상 렌더된다. */}
        <InvestmentDaysField
          investmentDays={item.investment_days ?? []}
        />
      </div>
    </section>
  )
}
