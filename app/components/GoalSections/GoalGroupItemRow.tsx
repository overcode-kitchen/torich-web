'use client'

import { Check } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { formatInvestmentDays } from '@/app/types/investment'
import { getInvestmentAvatarLabel } from '@/app/utils/investmentAvatarLabel'
import type { Investment } from '@/app/types/investment'

export interface GoalGroupItemRowProps {
  record: Investment
  /** 이번 달 납입 완료 여부 */
  isPaid: boolean
  /** 이번 달 납입 완료 토글 */
  onTogglePaid: (record: Investment) => void
  /** 행(완료 버튼 외 영역) 탭 → 투자 상세 */
  onSelect: (recordId: string) => void
}

/**
 * 목적 그룹 카드 안의 적립 항목 1행.
 * - 좌: 아바타 + 항목명 / 납입일
 * - 우: 월 납입액 + "완료하기" 버튼 (다가오는 투자 완료 UI와 동일)
 * - 버튼 외 행 영역 탭 → /investment?id={record.id}
 */
export function GoalGroupItemRow({
  record,
  isPaid,
  onTogglePaid,
  onSelect,
}: GoalGroupItemRowProps) {
  const amountLabel =
    record.unit_type === 'shares' && record.monthly_shares
      ? `${record.monthly_shares}주`
      : formatCurrency(record.monthly_amount)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(record.id)}
      onKeyDown={(ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault()
          onSelect(record.id)
        }
      }}
      aria-label={`${record.title} 상세 보기`}
      className="flex cursor-pointer items-center justify-between gap-3 border-b border-border-subtle px-2 py-2.5 transition-colors last:border-b-0 hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex min-w-0 items-center gap-2">
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                record.market === 'US'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-[var(--brand-accent-bg)] text-[var(--brand-accent-text)]'
              }`}
              aria-hidden
            >
              {getInvestmentAvatarLabel(record.title)}
            </div>
            <h4 className="min-w-0 truncate text-base font-semibold text-foreground">
              {record.title}
            </h4>
          </div>
          <div className="pl-2">
            <p className="truncate text-sm text-muted-foreground">
              {formatInvestmentDays(record.investment_days)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="text-sm font-bold tabular-nums text-foreground">
          {amountLabel}
        </span>
        {isPaid ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="shrink-0 gap-1 px-3 text-muted-foreground"
            onClick={(ev) => {
              ev.stopPropagation()
              onTogglePaid(record)
            }}
            aria-label="이번 달 납입 완료 취소"
          >
            <Check className="h-3.5 w-3.5" weight="bold" />
            완료
          </Button>
        ) : (
          <Button
            type="button"
            variant="soft"
            size="xs"
            className="shrink-0 px-3"
            onClick={(ev) => {
              ev.stopPropagation()
              onTogglePaid(record)
            }}
            aria-label="이번 달 납입 완료"
          >
            완료하기
          </Button>
        )}
      </div>
    </div>
  )
}
