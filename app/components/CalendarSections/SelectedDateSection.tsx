import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { PaymentEvent } from '@/app/utils/stats'

function formatEventContribution(e: PaymentEvent): string {
  if (e.unitType === 'shares' && e.monthlyShares && e.monthlyShares > 0) {
    return `${e.monthlyShares}주`
  }
  return formatCurrency(e.monthlyAmount)
}

interface SelectedDateSectionProps {
  selectedDate: Date | null
  selectedEvents: PaymentEvent[]
  isEventCompleted: (event: PaymentEvent) => boolean
  handleComplete: (event: PaymentEvent) => void
}

export function SelectedDateSection({
  selectedDate,
  selectedEvents,
  isEventCompleted,
  handleComplete,
}: SelectedDateSectionProps) {
  if (!selectedDate) return null

  return (
    <div
      className="bg-card rounded-2xl p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-sm font-semibold text-foreground-soft mb-3">
        {format(selectedDate, 'M월 d일', { locale: ko })} 예정 투자
      </h3>
      {selectedEvents.length === 0 ? (
        <p className="text-sm text-muted-foreground">해당 날짜에 예정된 투자가 없어요</p>
      ) : (
        <div className="space-y-2">
          {selectedEvents.map((e) => {
            const done = isEventCompleted(e)
            return (
              <div
                key={`${e.investmentId}-${e.day}`}
                className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0"
              >
                <div>
                  <p className="font-medium text-foreground">{e.title}</p>
                  <p className="text-sm text-muted-foreground">{formatEventContribution(e)}</p>
                </div>
                {done ? (
                  <span className="text-green-600 text-sm font-medium">✓ 완료됨</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleComplete(e)}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
                    aria-label="납입 완료 체크"
                  >
                    완료하기
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
