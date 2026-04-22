'use client'

import InvestmentPreviewCard from '@/app/components/Common/Investments/InvestmentPreviewCard'

interface PreviewSectionProps {
  stockName: string
  monthlyAmount: string
  period: string
  annualRate: number
  isRateLoading: boolean
  isHabitMode?: boolean
}

export default function PreviewSection({
  stockName,
  monthlyAmount,
  period,
  annualRate,
  isRateLoading,
  isHabitMode,
}: PreviewSectionProps) {
  return (
    <InvestmentPreviewCard
      stockName={stockName}
      monthlyAmount={monthlyAmount}
      period={period}
      annualRate={annualRate}
      isRateLoading={isRateLoading}
      isHabitMode={isHabitMode}
    />
  )
}
