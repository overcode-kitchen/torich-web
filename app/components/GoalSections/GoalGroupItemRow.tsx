'use client'

import { Checkbox } from '@/components/ui/checkbox'
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
  /** 행(체크박스 외 영역) 탭 → 투자 상세 */
  onSelect: (recordId: string) => void
}

/**
 * 목적 그룹 카드 안의 적립 항목 1행.
 * - 좌: 이번 달 납입 완료 체크박스 (토글)
 * - 중앙: 항목명 + 납입일 + 모드
 * - 우: 월 납입액
 * - 체크박스를 제외한 행 영역 탭 → /investment?id={record.id}
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
    <div className="flex items-center gap-3 border-b border-border-subtle px-2 py-2.5 last:border-b-0">
      <Checkbox
        checked={isPaid}
        onCheckedChange={() => onTogglePaid(record)}
        aria-label={`${record.title} 이번 달 납입 완료`}
        className="size-5 shrink-0"
      />

      <button
        type="button"
        onClick={() => onSelect(record.id)}
        className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
        aria-label={`${record.title} 상세 보기`}
      >
        <div className="min-w-0 flex-1">
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
            <h4
              className={`min-w-0 truncate text-base font-semibold ${
                isPaid ? 'text-muted-foreground line-through' : 'text-foreground'
              }`}
            >
              {record.title}
            </h4>
          </div>
          <p className="truncate pl-8 text-sm text-muted-foreground">
            {formatInvestmentDays(record.investment_days)}
          </p>
        </div>
        <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
          {amountLabel}
        </span>
      </button>
    </div>
  )
}
