'use client'

import type { PaymentEvent } from '@/app/utils/stats'
import type { Investment } from '@/app/types/investment'
import { formatMonthlyContribution } from '@/app/utils/investment-display'
import { getInvestmentAvatarLabel } from '@/app/utils/investmentAvatarLabel'

interface PaymentEventRowProps {
  event: PaymentEvent
  investment?: Investment
  isCompleted: boolean
  onClick: () => void
  onComplete: () => void
  showDivider: boolean
}

export function PaymentEventRow({
  event,
  investment,
  isCompleted,
  onClick,
  onComplete,
  showDivider,
}: PaymentEventRowProps) {
  const contribution = investment ? formatMonthlyContribution(investment).main : null
  const isUS = investment?.market === 'US'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault()
          onClick()
        }
      }}
      className={`flex items-center justify-between gap-3 py-2.5 cursor-pointer transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        showDivider ? 'border-b border-border-subtle-lighter' : ''
      }`}
      aria-label={`${event.title} 상세 보기`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
            isCompleted
              ? 'bg-surface-hover text-foreground-subtle'
              : isUS
                ? 'bg-blue-100 text-blue-600'
                : 'bg-[var(--brand-accent-bg)] text-[var(--brand-accent-text)]'
          }`}
        >
          {getInvestmentAvatarLabel(event.title)}
        </div>
        <div className="min-w-0">
          <p
            className={`text-base font-semibold truncate ${
              isCompleted ? 'text-muted-foreground' : 'text-foreground'
            }`}
          >
            {event.title}
          </p>
          {contribution && (
            <p className="text-sm text-muted-foreground truncate">{contribution}</p>
          )}
        </div>
      </div>
      {isCompleted ? (
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          ✓ 완료됨
        </span>
      ) : (
        <button
          type="button"
          onClick={(ev) => {
            ev.stopPropagation()
            onComplete()
          }}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
          aria-label="납입 완료 체크"
        >
          완료하기
        </button>
      )}
    </div>
  )
}
