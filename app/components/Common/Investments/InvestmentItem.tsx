'use client'

import { formatCurrency } from '@/lib/utils'
import { Investment, getStartDate, formatInvestmentDays } from '@/app/types/investment'
import { isCompleted } from '@/app/utils/date'

interface InvestmentItemProps {
  item: Investment
  onClick: () => void
  calculateFutureValue?: (monthlyAmount: number, T: number, P: number, R: number) => number
}

function getAvatarLabel(title: string): string {
  const trimmed = title.trim()
  if (!trimmed) return '?'

  const firstChar = trimmed[0]
  const code = firstChar.charCodeAt(0)

  // 한글 음절: 첫 글자 그대로 사용 (예: "삼성전자" -> "삼")
  if (code >= 0xac00 && code <= 0xd7a3) {
    return firstChar
  }

  // 알파벳/숫자 등: 대문자 한 글자 사용 (예: "tesla" -> "T")
  return firstChar.toUpperCase()
}

export default function InvestmentItem({
  item,
  onClick,
  calculateFutureValue,
}: InvestmentItemProps) {
  const startDate = getStartDate(item)
  const completed = isCompleted(startDate, item.period_years)

  return (
    <div className="border-b border-border-subtle last:border-b-0 py-2">
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left px-4 py-4 rounded-2xl transition-colors transition-transform duration-150 ease-out hover:bg-surface active:bg-surface-hover active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background will-change-transform"
      >
        <div className="flex flex-col gap-1.5 min-w-0">
          {/* 1줄: 아바타 + 종목명 */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-accent-bg)] text-[11px] font-semibold text-[var(--brand-accent-text)]">
              {getAvatarLabel(item.title)}
            </div>
            <h3 className="text-lg font-bold text-foreground truncate">
              {item.title}
            </h3>
          </div>

          {/* 2줄: 월 투자금 · 투자일 (살짝 들여쓰기) */}
          <div className="pl-2">
            <p className={`text-sm ${completed ? 'text-green-600 font-semibold' : 'text-muted-foreground'}`}>
              월 {formatCurrency(item.monthly_amount)}
              {item.investment_days && item.investment_days.length > 0 && (
                <> · {formatInvestmentDays(item.investment_days)}</>
              )}
            </p>
          </div>
        </div>
      </button>
    </div>
  )
}
