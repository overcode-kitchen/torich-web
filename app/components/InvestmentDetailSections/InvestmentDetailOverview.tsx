'use client'

import { Investment } from '@/app/types/investment'
import { formatCurrency } from '@/lib/utils'
import { getRecordAvatar } from '@/app/utils/recordAvatar'
import { DetailTitleBlock } from '@/app/components/Common/DetailTitleBlock'

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
  overviewRef,
  titleRef,
  onTitleClick,
}: InvestmentDetailOverviewProps) {
  const avatar = getRecordAvatar(item, 'lg')
  const subtitle = formatInvestmentSubtitle(item)

  const titleBlock = (
    <>
      <DetailTitleBlock
        className="mb-2"
        leading={
          <div
            className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${avatar.sizeClassName} ${avatar.className}`}
            aria-hidden
          >
            {avatar.label}
          </div>
        }
        title={item.title}
        subtitle={subtitle}
      />
      {isEditMode && (
        <p className="text-sm text-foreground-subtle">종목명은 수정할 수 없습니다</p>
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
