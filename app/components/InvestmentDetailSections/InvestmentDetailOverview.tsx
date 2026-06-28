'use client'

import { Investment } from '@/app/types/investment'
import { formatCurrency } from '@/lib/utils'
import { getRecordAvatar } from '@/app/utils/recordAvatar'

interface InvestmentDetailOverviewProps {
  item: Investment
  isEditMode: boolean
  completed: boolean
  overviewRef: React.RefObject<HTMLElement | null>
  titleRef: React.RefObject<HTMLDivElement | null>
  /** 제목 영역 탭 시 호출 (제공 시 헤더가 button으로 렌더링됨) */
  onTitleClick?: () => void
}

function formatInvestmentSubtitle(item: Investment): string | null {
  if (item.unit_type === 'shares' && item.monthly_shares) {
    return `현재 ${item.monthly_shares}주씩 투자 중`
  }
  if (item.monthly_amount > 0) {
    const verb = item.record_type === 'savings' || item.record_type === 'cash' ? '적립' : '투자'
    return `현재 ${formatCurrency(item.monthly_amount)}씩 ${verb} 중`
  }
  return null
}

export function InvestmentDetailOverview({
  item,
  isEditMode,
  completed,
  overviewRef,
  titleRef,
  onTitleClick,
}: InvestmentDetailOverviewProps) {
  const avatar = getRecordAvatar(item, 'lg')
  const subtitle = formatInvestmentSubtitle(item)

  const titleBlock = (
    <>
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${avatar.sizeClassName} ${avatar.className}`}
          aria-hidden
        >
          {avatar.label}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-semibold tracking-tight text-foreground">
            {item.title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {isEditMode ? (
        <p className="text-sm text-foreground-subtle">종목명은 수정할 수 없습니다</p>
      ) : (
        completed && (
          <p className="text-sm font-medium text-success">
            목표 달성! 🎉
          </p>
        )
      )}
    </>
  )

  return (
    <section ref={overviewRef} className="py-6 space-y-4">
      {onTitleClick ? (
        <button
          type="button"
          ref={titleRef as unknown as React.RefObject<HTMLButtonElement>}
          onClick={onTitleClick}
          className="block w-full text-left"
        >
          {titleBlock}
        </button>
      ) : (
        <div ref={titleRef}>{titleBlock}</div>
      )}
    </section>
  )
}
