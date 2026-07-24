'use client'

import { Check, Clock } from '@phosphor-icons/react'
import type { PaymentEvent } from '@/app/utils/stats'
import type { Investment } from '@/app/types/investment'
import { Button } from '@/components/ui/button'
import { formatMonthlyContribution } from '@/app/utils/investment-display'
import { getInvestmentAvatarLabel } from '@/app/utils/investmentAvatarLabel'
import { RecordAvatar } from '@/app/components/Common/RecordAvatar'

interface PaymentEventRowProps {
  event: PaymentEvent
  investment?: Investment
  isCompleted: boolean
  isPostponed: boolean
  onClick: () => void
  onComplete: () => void
  onUncomplete: () => void
  onPostpone: () => void
  onUnpostpone: () => void
  showDivider: boolean
}

export function PaymentEventRow({
  event,
  investment,
  isCompleted,
  isPostponed,
  onClick,
  onComplete,
  onUncomplete,
  onPostpone,
  onUnpostpone,
  showDivider,
}: PaymentEventRowProps) {
  const contribution = investment ? formatMonthlyContribution(investment).main : null
  // 완료/미룸은 둘 다 "해소된" 상태로 보고 아바타·제목을 흐리게 표시한다.
  const isResolved = isCompleted || isPostponed

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
        {/* 홈 탭과 동일한 아바타 규칙(투자=초록/파랑, 예적금·현금=중립)을 공유해
            같은 항목이 탭에 따라 다른 아이콘으로 보이지 않도록 한다.
            완료·미룸(isResolved) 상태면 회색으로 강제한다. */}
        <RecordAvatar
          record={investment ?? undefined}
          label={investment ? undefined : getInvestmentAvatarLabel(event.title)}
          bgClassName={isResolved ? 'bg-surface-hover' : investment ? undefined : 'bg-[var(--brand-accent-bg)]'}
          textClassName={isResolved ? 'text-foreground-subtle' : investment ? undefined : 'text-[var(--brand-accent-text)]'}
          size="sm"
        />
        <div className="min-w-0">
          <p
            className={`text-base font-semibold truncate ${
              isResolved ? 'text-muted-foreground' : 'text-foreground'
            }`}
          >
            {event.title}
          </p>
          {contribution && (
            <p className="text-sm text-muted-foreground truncate">{contribution}</p>
          )}
        </div>
      </div>
      {/* 버튼은 항상 하나의 우측 클러스터로 묶어 오른쪽 정렬을 유지한다. */}
      <div className="flex shrink-0 items-center gap-2">
        {isCompleted ? (
          // 홈(GoalGroupItemRow)과 동일하게 ghost 버튼 + 체크 아이콘 + '완료' 텍스트로 통일하고,
          // 다시 누르면 미완료로 되돌린다.
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="shrink-0 gap-1 px-3 text-muted-foreground"
            onClick={(ev) => {
              ev.stopPropagation()
              onUncomplete()
            }}
            aria-label="납입 완료 취소"
          >
            <Check className="h-3.5 w-3.5" weight="bold" />
            완료
          </Button>
        ) : isPostponed ? (
          // 미룸 상태: 완료도 미완료도 아닌 "미룸". 다시 누르면 미룸을 해제한다.
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="shrink-0 gap-1 px-3 text-muted-foreground"
            onClick={(ev) => {
              ev.stopPropagation()
              onUnpostpone()
            }}
            aria-label="미룸 해제"
          >
            <Clock className="h-3.5 w-3.5" weight="bold" />
            미룸
          </Button>
        ) : (
          // 대기 상태: 미루기(회색) + 완료하기(프라이머리). 미루기는 납입일 전에도 미리 지정할 수 있게 항상 노출한다.
          <>
            <Button
              type="button"
              variant="soft"
              size="xs"
              className="shrink-0 px-3"
              onClick={(ev) => {
                ev.stopPropagation()
                onPostpone()
              }}
              aria-label="납입 미루기"
            >
              미루기
            </Button>
            <Button
              type="button"
              variant="default"
              size="xs"
              className="shrink-0 px-3"
              onClick={(ev) => {
                ev.stopPropagation()
                onComplete()
              }}
              aria-label="납입 완료 체크"
            >
              완료하기
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
