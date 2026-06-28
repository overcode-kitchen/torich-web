'use client'

import { useEffect, useRef } from 'react'
import { useStockSearch } from '../../stock/useStockSearch'
import { useManualInput } from '../../stock/useManualInput'
import { useRateEditor } from '../../stock/useRateEditor'
import { useAddInvestmentUI } from './useAddInvestmentUI'
import { useAddInvestmentCalculations } from './useAddInvestmentCalculations'
import { useAddInvestmentSubmit } from './useAddInvestmentSubmit'
import { isHabitMode } from '@/app/types/investment'
import type { Investment } from '@/app/types/investment'
import type { UseAddInvestmentFormReturn } from '../../types/useAddInvestmentForm'

export interface UseAddInvestmentFormOptions {
  /** 목적 만들기 흐름에서 넘어온 경우, 생성될 투자를 이 목적에 연결한다. */
  goalId?: string
  /** 'create'(기본) | 'edit' — edit 모드면 recordId 필수 */
  mode?: 'create' | 'edit'
  /** edit 모드에서 수정할 records.id */
  recordId?: string
  /** edit 모드에서 기존 record로 폼을 프리필하기 위한 원본 데이터 */
  initData?: Investment | null
}

export function useAddInvestmentForm(
  options?: UseAddInvestmentFormOptions,
): UseAddInvestmentFormReturn {
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

  // 주식 검색 훅에 stockName 전달, market은 stockSearch와 동기화(탭 선택이 반영되도록)
  const updatedStockSearch = useStockSearch(ui.stockName, manualInput.isManualInput, {
    market: stockSearch.market,
    setMarket: stockSearch.setMarket,
  })

  // 제출 훅 사용
  const submit = useAddInvestmentSubmit({
    stockName: ui.stockName,
    monthlyAmount: ui.monthlyAmount,
    period: ui.period,
    isHabitMode: ui.isHabitMode,
    startDate: ui.startDate,
    investmentDays: ui.investmentDays,
    annualRate: updatedStockSearch.annualRate,
    isManualInput: manualInput.isManualInput,
    originalSystemRate: updatedStockSearch.originalSystemRate,
    selectedStock: updatedStockSearch.selectedStock,
    market: updatedStockSearch.market,
    unitType: ui.unitType,
    monthlyShares: ui.monthlyShares,
    goalId: options?.goalId,
    mode: options?.mode,
    recordId: options?.recordId,
    initData: options?.initData,
  })

  // 편집 모드 프리필: 기존 record로 폼을 채운다. (record당 1회)
  // 검색종목은 selectedStock을 원본에서 복원해 저장 시 종목코드·주수 시세(=monthly_amount)가
  // 유실되지 않도록 한다. 수동입력(symbol 없음)은 manual 모드로 둔다.
  const prefilledIdRef = useRef<string | null>(null)
  const initData = options?.initData
  useEffect(() => {
    if (!initData) return
    if (initData.record_type && initData.record_type !== 'investment') return
    if (prefilledIdRef.current === initData.id) return
    prefilledIdRef.current = initData.id

    ui.setStockName(initData.title ?? '')

    const shares = initData.unit_type === 'shares'
    ui.setUnitType(shares ? 'shares' : 'amount')
    if (shares) {
      ui.handleSharesChange(
        initData.monthly_shares != null ? String(initData.monthly_shares) : '',
      )
    } else {
      ui.setMonthlyAmount(
        initData.monthly_amount
          ? Math.round(initData.monthly_amount / 10000).toLocaleString()
          : '',
      )
    }

    const habit = isHabitMode(initData)
    ui.setIsHabitMode(habit)
    ui.setPeriod(
      habit ? '' : initData.period_years != null ? String(initData.period_years) : '',
    )
    ui.setStartDate(initData.start_date ? new Date(initData.start_date) : new Date())
    ui.setInvestmentDays(initData.investment_days ?? [])

    updatedStockSearch.setMarket((initData.market as 'KR' | 'US') ?? 'KR')
    updatedStockSearch.setAnnualRate(initData.annual_rate ?? 0)
    updatedStockSearch.setOriginalSystemRate(initData.annual_rate ?? null)

    if (initData.symbol) {
      manualInput.setIsManualInput(false)
      if (shares && initData.monthly_shares) {
        // 주수 모드: 원본 monthly_amount/monthly_shares로 1주 시세를 역산해 보존(저장 시 금액 불변)
        updatedStockSearch.setSelectedStock({
          symbol: initData.symbol,
          name: initData.title ?? '',
          averageRate: initData.annual_rate ?? 0,
          currentPrice: initData.monthly_amount / initData.monthly_shares,
        })
      } else {
        // 금액 모드: 시세가 없으면 주수 모드로 전환할 수 없으므로(시세 필요) 실제 현재가를 받아온다.
        // handleSelectStock이 시세 fetch + selectedStock 설정을 하되 수익률을 시스템값으로 덮으므로
        // 직후 저장된 수익률로 복원한다.
        const symbol = initData.symbol
        const name = initData.title ?? ''
        const savedRate = initData.annual_rate ?? 0
        void (async () => {
          await updatedStockSearch.handleSelectStock({ symbol, name })
          updatedStockSearch.setAnnualRate(savedRate)
          updatedStockSearch.setOriginalSystemRate(savedRate)
        })()
      }
    } else {
      manualInput.setIsManualInput(true)
      updatedStockSearch.setSelectedStock(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initData])

  return {
    // 기본 폼 상태
    stockName: ui.stockName,
    setStockName: ui.setStockName,
    monthlyAmount: ui.monthlyAmount,
    period: ui.period,
    isHabitMode: ui.isHabitMode,
    setIsHabitMode: ui.setIsHabitMode,
    startDate: ui.startDate,
    setStartDate: ui.setStartDate,
    investmentDays: ui.investmentDays,
    setInvestmentDays: ui.setInvestmentDays,

    // 매수 단위 (금액/주수)
    unitType: ui.unitType,
    setUnitType: ui.setUnitType,
    monthlyShares: ui.monthlyShares,
    handleSharesChange: ui.handleSharesChange,

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
