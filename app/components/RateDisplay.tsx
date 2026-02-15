'use client'

import { type SearchResult } from '@/app/hooks/useStockSearch'
import RateLoading from './RateDisplay/RateLoading'
import RateError from './RateDisplay/RateError'
import RateEditing from './RateDisplay/RateEditing'
import RateView from './RateDisplay/RateView'

interface RateDisplayProps {
  // 상태
  isRateLoading: boolean
  rateFetchFailed: boolean
  isRateEditing: boolean
  isManualInput: boolean
  stockName: string
  selectedStock: SearchResult | null

  // 수익률 값
  annualRate: number
  originalSystemRate: number | null
  editingRate: string

  // 핸들러
  onStartEditing: () => void
  onConfirmEdit: () => void
  onCancelEdit: () => void
  onRateChange: (value: string) => void
  onRateHelpClick: () => void
}

export default function RateDisplay({
  isRateLoading,
  rateFetchFailed,
  isRateEditing,
  isManualInput,
  stockName,
  selectedStock,
  annualRate,
  originalSystemRate,
  editingRate,
  onStartEditing,
  onConfirmEdit,
  onCancelEdit,
  onRateChange,
  onRateHelpClick,
}: RateDisplayProps) {
  // 선택된 종목 수익률 안내 (로딩/실패/편집/표시 모드)
  if (!isManualInput && (selectedStock || isRateLoading)) {
    if (isRateLoading) {
      return <RateLoading />
    }

    if (rateFetchFailed) {
      return (
        <RateError
          annualRate={annualRate}
          onStartEditing={onStartEditing}
        />
      )
    }

    if (isRateEditing) {
      return (
        <RateEditing
          editingRate={editingRate}
          onRateChange={onRateChange}
          onConfirmEdit={onConfirmEdit}
          onCancelEdit={onCancelEdit}
          isManualInput={false}
        />
      )
    }

    return (
      <RateView
        isManualInput={false}
        stockName={stockName}
        annualRate={annualRate}
        originalSystemRate={originalSystemRate}
        onStartEditing={onStartEditing}
        onRateHelpClick={onRateHelpClick}
      />
    )
  }

  // 직접 입력 종목 수익률 안내
  if (isManualInput && stockName) {
    if (isRateEditing) {
      return (
        <RateEditing
          editingRate={editingRate}
          onRateChange={onRateChange}
          onConfirmEdit={onConfirmEdit}
          onCancelEdit={onCancelEdit}
          isManualInput={true}
        />
      )
    }

    return (
      <RateView
        isManualInput={true}
        stockName={stockName}
        annualRate={annualRate}
        originalSystemRate={originalSystemRate}
        onStartEditing={onStartEditing}
        onRateHelpClick={onRateHelpClick}
      />
    )
  }

  return null
}
