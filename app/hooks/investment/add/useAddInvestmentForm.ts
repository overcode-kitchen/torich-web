'use client'

import { useStockSearch } from '../../stock/useStockSearch'
import { useManualInput } from '../../stock/useManualInput'
import { useRateEditor } from '../../stock/useRateEditor'
import { useAddInvestmentUI } from './useAddInvestmentUI'
import { useAddInvestmentCalculations } from './useAddInvestmentCalculations'
import { useAddInvestmentSubmit } from './useAddInvestmentSubmit'
import type { UseAddInvestmentFormReturn } from '../../types/useAddInvestmentForm'

export function useAddInvestmentForm(): UseAddInvestmentFormReturn {
  // 기존 훅들 사용
  const stockSearch = useStockSearch('', false)
  const manualInput = useManualInput()
  const rateEditor = useRateEditor()
  
  // 새로운 분리된 훅들
  const ui = useAddInvestmentUI({
    stockSearch,
    manualInput,
    rateEditor,
  })
  
  const calculations = useAddInvestmentCalculations({
    monthlyAmount: ui.monthlyAmount,
    setMonthlyAmount: ui.setMonthlyAmount,
    period: ui.period,
    setPeriod: ui.setPeriod,
  })

  // 주식 검색 훅에 stockName 전달
  const updatedStockSearch = useStockSearch(ui.stockName, manualInput.isManualInput)

  // 제출 훅 사용
  const submit = useAddInvestmentSubmit({
    stockName: ui.stockName,
    monthlyAmount: ui.monthlyAmount,
    period: ui.period,
    startDate: ui.startDate,
    investmentDays: ui.investmentDays,
    annualRate: updatedStockSearch.annualRate,
    isManualInput: manualInput.isManualInput,
    originalSystemRate: updatedStockSearch.originalSystemRate,
    selectedStock: updatedStockSearch.selectedStock,
  })

  return {
    // 기본 폼 상태
    stockName: ui.stockName,
    setStockName: ui.setStockName,
    monthlyAmount: ui.monthlyAmount,
    period: ui.period,
    startDate: ui.startDate,
    setStartDate: ui.setStartDate,
    investmentDays: ui.investmentDays,
    setInvestmentDays: ui.setInvestmentDays,

    // 제출 상태
    isSubmitting: submit.isSubmitting,
    userId: submit.userId,

    // 입력 처리
    handleAmountChange: calculations.handleAmountChange,
    adjustAmount: calculations.adjustAmount,
    handlePeriodChange: calculations.handlePeriodChange,
    adjustPeriod: calculations.adjustPeriod,

    // 주식 검색 관련 (업데이트된 훅 사용)
    ...updatedStockSearch,

    // 수동 입력 관련
    isManualModalOpen: manualInput.isManualModalOpen,
    setIsManualModalOpen: manualInput.setIsManualModalOpen,
    manualStockName: manualInput.manualStockName,
    setManualStockName: manualInput.setManualStockName,
    manualRate: manualInput.manualRate,
    setManualRate: manualInput.setManualRate,
    isManualInput: manualInput.isManualInput,
    setIsManualInput: manualInput.setIsManualInput,
    handleManualConfirm: manualInput.handleManualConfirm,
    closeAndResetManual: manualInput.closeAndReset,

    // 수익률 편집 관련
    isRateEditing: rateEditor.isRateEditing,
    editingRate: rateEditor.editingRate,
    startEditing: rateEditor.startEditing,
    confirmEdit: rateEditor.confirmEdit,
    cancelEdit: rateEditor.cancelEdit,
    handleRateChange: rateEditor.handleRateChange,

    // 폼 제출
    handleSubmit: submit.handleSubmit,

    // 유틸리티
    handleMarketChange: ui.handleMarketChange,
  }
}
