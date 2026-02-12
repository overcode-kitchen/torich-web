export interface RateUpdateToastProps {
  showRateUpdateToast: boolean
}

export default function RateUpdateToast({ showRateUpdateToast }: RateUpdateToastProps) {
  if (!showRateUpdateToast) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
      <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-lg flex items-center gap-2">
        <span className="text-lg">🐿️</span>
        <span className="text-sm text-foreground-soft">지난달 시장 데이터를 반영하여 예측을 업데이트했어요!</span>
      </div>
    </div>
  )
}
