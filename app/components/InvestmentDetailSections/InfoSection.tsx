'use client'

import React from 'react'
import { InvestmentField } from '@/app/components/Common/InvestmentField'
import { formatContributionLabel, formatContributionValue } from '@/app/utils/investment-display'
import { useInvestmentDetailContext } from './InvestmentDetailContext'
import { InvestmentDaysField } from './InvestmentDaysField'
import PeriodInput from '@/app/components/Common/PeriodInput'
import { isHabitMode as checkIsHabitMode } from '@/app/types/investment'

interface InfoSectionProps {
  infoRef: React.RefObject<HTMLElement | null>
}

export function InfoSection({ infoRef }: InfoSectionProps) {
  const { item, isEditMode, investmentData, ui } = useInvestmentDetailContext()

  const {
    editMonthlyAmount,
    editPeriodYears,
    editInvestmentDays,
    editIsHabitMode,
    setEditIsHabitMode,
    setEditMonthlyAmount,
    setEditPeriodYears,
    setEditInvestmentDays,
    handleNumericInput,
  } = investmentData || {}

  const setIsDaysPickerOpen = ui?.setIsDaysPickerOpen

  if (!item) return null

  const habit = isEditMode
    ? !!editIsHabitMode
    : checkIsHabitMode(item)

  // 목표 기간 표시/편집 필드
  const periodValueText = habit ? '없음 (적립 중)' : `${item.period_years}년`

  const handlePeriodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^0-9]/g, '')
    setEditPeriodYears?.(cleaned)
  }
  const adjustEditPeriod = (delta: number) => {
    const current = parseInt(editPeriodYears || '0')
    const next = Math.max(1, current + delta)
    setEditPeriodYears?.(String(next))
  }

  return (
    <section ref={infoRef} className="py-8">
      <h3 className="text-lg font-semibold tracking-tight text-foreground mb-4">
        {isEditMode ? '투자 정보 수정' : '투자 정보'}
      </h3>
      <div className="space-y-6">
        <InvestmentField
          label={formatContributionLabel(item)}
          value={formatContributionValue(item)}
          editValue={editMonthlyAmount}
          editPlaceholder="100"
          editUnit="만원"
          isEditMode={isEditMode}
          onEdit={(value) => handleNumericInput(value, setEditMonthlyAmount)}
        />

        {/* 목표 기간: 수정 모드에서는 habit 토글 포함 PeriodInput, 뷰에서는 텍스트 표기 */}
        {isEditMode ? (
          <div>
            <label className="block text-sm font-medium text-foreground-soft mb-2">목표 기간</label>
            <PeriodInput
              value={editPeriodYears || ''}
              onChange={handlePeriodChange}
              onAdjust={adjustEditPeriod}
              isHabitMode={!!editIsHabitMode}
              onToggleHabitMode={(habitOn) => {
                setEditIsHabitMode?.(habitOn)
                if (habitOn) {
                  setEditPeriodYears?.('')
                }
              }}
            />
          </div>
        ) : (
          <InvestmentField
            label="목표 기간"
            value={periodValueText}
            isEditMode={false}
          />
        )}

        <InvestmentDaysField
          isEditMode={isEditMode}
          investmentDays={isEditMode ? editInvestmentDays : item.investment_days}
          onToggleDay={(day) => setEditInvestmentDays((prev: number[]) => prev.filter((d) => d !== day))}
          onOpenDaysPicker={() => setIsDaysPickerOpen(true)}
        />
      </div>
    </section>
  )
}
