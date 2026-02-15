'use client'

import React from 'react'
import { formatCurrency } from '@/lib/utils'
import { formatInvestmentDays } from '@/app/types/investment'
import { InvestmentField } from '@/app/components/Common/InvestmentField'
import InvestmentEditSheet from '@/app/components/InvestmentEditSections/InvestmentEditSheet'
import { useInvestmentDetailContext } from './InvestmentDetailContext'
import type { InfoSectionProps as OriginalInfoSectionProps } from './types'

interface InfoSectionProps extends Partial<OriginalInfoSectionProps> {
  infoRef: React.RefObject<HTMLElement | null>
}

export function InfoSection(props: InfoSectionProps) {
  // Try to get context, but don't fail if it's missing (for InvestmentEditView)
  let contextValue: any = null
  try {
    contextValue = useInvestmentDetailContext()
  } catch (e) {
    // Context missing, will rely on props
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

  return (
    <section ref={infoRef} className="py-6">
      <h3 className="text-lg font-semibold tracking-tight text-foreground mb-4">
        {isEditMode ? '투자 정보 수정' : '투자 정보'}
      </h3>
      <div className="space-y-6">
        {/* 월 투자금 */}
        <InvestmentField
          label="월 투자금"
          value={formatCurrency(item.monthly_amount)}
          editValue={editMonthlyAmount}
          editPlaceholder="100"
          editUnit="만원"
          isEditMode={isEditMode}
          onEdit={(value) => handleNumericInput(value, setEditMonthlyAmount)}
        />

        {/* 목표 기간 */}
        <InvestmentField
          label="목표 기간"
          value={`${item.period_years}년`}
          editValue={editPeriodYears}
          editPlaceholder="10"
          editUnit="년"
          isEditMode={isEditMode}
          onEdit={(value) => handleNumericInput(value, setEditPeriodYears)}
        />

        {/* 연 수익률 */}
        <InvestmentField
          label="연 수익률"
          value={`${displayAnnualRate.toFixed(0)}%`}
          editValue={editAnnualRate}
          editPlaceholder="10"
          editUnit="%"
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

        {/* 매월 투자일 */}
        {isEditMode ? (
          <div className="space-y-1.5">
            <label className="block text-foreground font-bold text-base">
              매월 투자일
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[...editInvestmentDays].sort((a, b) => a - b).map((day) => (
                <span
                  key={day}
                  className="inline-flex items-center gap-1 bg-[var(--brand-accent-bg)] text-[var(--brand-accent-text)] px-2 py-0.5 rounded-full text-xs font-medium"
                >
                  {day}일
                  <button
                    type="button"
                    onClick={() => setEditInvestmentDays((prev: number[]) => prev.filter((d: number) => d !== day))}
                    className="hover:text-brand-900"
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => setIsDaysPickerOpen(true)}
                className="inline-flex items-center bg-surface-hover text-foreground-soft px-2 py-0.5 rounded-full text-xs font-semibold hover:bg-secondary transition-colors"
              >
                + 추가
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">매월 투자일</span>
            <span className="text-base font-semibold text-foreground">
              {formatInvestmentDays(item.investment_days)}
            </span>
          </div>
        )}

        <div className="border-t border-border-subtle-lighter my-2" />

        {/* 총 원금 */}
        <InvestmentField
          label="총 원금"
          value={formatCurrency(totalPrincipal)}
          isEditMode={false}
        />

        {/* 예상 수익 */}
        <InvestmentField
          label="예상 수익"
          value={`+ ${formatCurrency(calculatedProfit)}`}
          isEditMode={false}
        />

        {/* 만기 시 예상 금액 */}
        <InvestmentField
          label="만기 시 예상 금액"
          value={formatCurrency(calculatedFutureValue)}
          isEditMode={false}
        />
      </div>
    </section>
  )
}
