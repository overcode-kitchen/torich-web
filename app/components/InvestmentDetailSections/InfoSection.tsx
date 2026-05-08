'use client'

import React from 'react'
import { InvestmentField } from '@/app/components/Common/InvestmentField'
import { formatContributionLabel, formatContributionValue } from '@/app/utils/investment-display'
import InvestmentEditSheet from '@/app/components/InvestmentEditSections/InvestmentEditSheet'
import { useInvestmentDetailContext } from './InvestmentDetailContext'
import { MetricsSection } from './MetricsSection'
import { InvestmentDaysField } from './InvestmentDaysField'
import PeriodInput from '@/app/components/Common/PeriodInput'
import { isHabitMode as checkIsHabitMode } from '@/app/types/investment'
import type { InfoSectionProps as OriginalInfoSectionProps } from './types'

interface InfoSectionProps extends Partial<OriginalInfoSectionProps> {
  infoRef: React.RefObject<HTMLElement | null>
}

export function InfoSection(props: InfoSectionProps) {
  let contextValue: any = null
  try {
    contextValue = useInvestmentDetailContext()
  } catch (e) {
    // Context missing, will rely on props (for InvestmentEditView)
  }

  const item = props.item || contextValue?.item
  const isEditMode = props.isEditMode ?? contextValue?.isEditMode
  const investmentData = props.editMonthlyAmount !== undefined ? props : contextValue?.investmentData
  const ui = contextValue?.ui
  const config = contextValue?.config

  const {
    editMonthlyAmount = props.editMonthlyAmount,
    editPeriodYears = props.editPeriodYears,
    editAnnualRate = props.editAnnualRate,
    editInvestmentDays = props.editInvestmentDays,
    editIsHabitMode,
    setEditIsHabitMode,
    setEditMonthlyAmount = props.setEditMonthlyAmount,
    setEditPeriodYears = props.setEditPeriodYears,
    setEditAnnualRate = props.setEditAnnualRate,
    setEditInvestmentDays = props.setEditInvestmentDays,
    handleNumericInput = props.handleNumericInput,
    handleRateInput = props.handleRateInput,
    displayAnnualRate = props.displayAnnualRate,
    totalPrincipal = props.totalPrincipal,
    calculatedProfit = props.calculatedProfit,
    calculatedFutureValue = props.calculatedFutureValue,
    isRateManuallyEdited = props.isRateManuallyEdited,
    setIsRateManuallyEdited = props.setIsRateManuallyEdited,
  } = investmentData || {}

  const setIsDaysPickerOpen = props.setIsDaysPickerOpen || ui?.setIsDaysPickerOpen
  const originalRate = props.originalRate ?? config?.originalRate
  const formatRate = props.formatRate || config?.formatRate
  const rateSuggestions = props.rateSuggestions || config?.rateSuggestions
  const isCustomRate = props.isCustomRate ?? config?.isCustomRate
  const { infoRef } = props

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
    <section ref={infoRef} className="py-6">
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

        <InvestmentField
          label="연 수익률"
          value={`${displayAnnualRate.toFixed(0)}%`}
          editValue={editAnnualRate}
          isEditMode={isEditMode}
          onEdit={handleRateInput}
          badge={{
            text: isCustomRate ? '직접 입력' : '10년 평균',
            variant: isCustomRate ? 'custom' : 'default'
          }}
          tooltip="수익률을 직접 수정하면 시스템 수익률 대신 직접 입력한 값이 적용됩니다."
        >
          <div className="space-y-2">
            {isRateManuallyEdited && parseFloat(editAnnualRate) !== originalRate && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">직접 수정</span>
            )}
            <div className="flex justify-end w-full">
              <InvestmentEditSheet
                suggestions={rateSuggestions}
                onSelect={(rate) => {
                  setEditAnnualRate(formatRate(rate))
                  setIsRateManuallyEdited(rate !== originalRate)
                }}
              />
            </div>
          </div>
        </InvestmentField>

        <InvestmentDaysField
          isEditMode={isEditMode}
          investmentDays={isEditMode ? editInvestmentDays : item.investment_days}
          onToggleDay={(day) => setEditInvestmentDays((prev: number[]) => prev.filter((d) => d !== day))}
          onOpenDaysPicker={() => setIsDaysPickerOpen(true)}
        />

        {!isEditMode && !habit && (
          <MetricsSection
            totalPrincipal={totalPrincipal}
            calculatedProfit={calculatedProfit}
            calculatedFutureValue={calculatedFutureValue}
          />
        )}
      </div>
    </section>
  )
}
