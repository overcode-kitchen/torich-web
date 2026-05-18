'use client'

import InvestmentPreviewCard from '@/app/components/Common/Investments/InvestmentPreviewCard'

interface PreviewSectionProps {
  stockName: string
  monthlyAmount: string
  period: string
  isHabitMode?: boolean
}

export default function PreviewSection({
  stockName,
  monthlyAmount,
  period,
  isHabitMode,
}: PreviewSectionProps) {
  return (
    <InvestmentPreviewCard
      stockName={stockName}
      monthlyAmount={monthlyAmount}
      period={period}
      isHabitMode={isHabitMode}
    />
  )
}
