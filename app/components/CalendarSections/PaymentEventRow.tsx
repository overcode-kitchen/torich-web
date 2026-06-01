'use client'

import type { PaymentEvent } from '@/app/utils/stats'
import type { Investment } from '@/app/types/investment'
import { formatMonthlyContribution } from '@/app/utils/investment-display'
import { getInvestmentAvatarLabel } from '@/app/utils/investmentAvatarLabel'
import { getRecordAvatar } from '@/app/utils/recordAvatar'

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
  // 홈 탭과 동일한 아바타 규칙(투자=초록/파랑, 예적금·현금=중립)을 공유해
  // 같은 항목이 탭에 따라 다른 아이콘으로 보이지 않도록 한다.
  const avatarLabel = investment
    ? getRecordAvatar(investment).label
    : getInvestmentAvatarLabel(event.title)
  const avatarClassName = isCompleted
    ? 'bg-surface-hover text-foreground-subtle'
    : investment
      ? getRecordAvatar(investment).className
      : 'bg-[var(--brand-accent-bg)] text-[var(--brand-accent-text)]'

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
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${avatarClassName}`}
        >
          {avatarLabel}
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
