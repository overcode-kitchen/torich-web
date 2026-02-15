'use client'

import InvestmentPreviewCard from '@/app/components/Common/Investments/InvestmentPreviewCard'

interface PreviewSectionProps {
  stockName: string
  monthlyAmount: string
  period: string
  annualRate: number
  isRateLoading: boolean
}

export default function PreviewSection({
  stockName,
  monthlyAmount,
  period,
  annualRate,
  isRateLoading
}: PreviewSectionProps) {
  return (
    <InvestmentPreviewCard
      stockName={stockName}
      monthlyAmount={monthlyAmount}
      period={period}
      annualRate={annualRate}
      isRateLoading={isRateLoading}
    />
  )
}
