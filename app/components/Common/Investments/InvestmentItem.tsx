'use client'

import { TrashSimple } from '@phosphor-icons/react'
import { formatCurrency } from '@/lib/utils'
import { Investment, getStartDate, formatInvestmentDays, isHabitMode } from '@/app/types/investment'
import { isCompleted, getElapsedMonths } from '@/app/utils/date'
import { useSwipeToDelete } from '@/app/hooks/ui/useSwipeToDelete'
import DeleteConfirmModal from '@/app/components/Common/DeleteConfirmModal'

interface InvestmentItemProps {
  item: Investment
  onClick: () => void
  onDelete?: (id: string) => Promise<void>
  calculateFutureValue?: (monthlyAmount: number, T: number, P: number, R: number) => number
}

function getAvatarLabel(title: string): string {
  const trimmed = title.trim()
  if (!trimmed) return '?'

  const firstChar = trimmed[0]
  const code = firstChar.charCodeAt(0)

  if (code >= 0xac00 && code <= 0xd7a3) {
    return firstChar
  }

  return firstChar.toUpperCase()
}

export default function InvestmentItem({
  item,
  onClick,
  onDelete,
  calculateFutureValue,
}: InvestmentItemProps) {
  const startDate = getStartDate(item)
  const habit = isHabitMode(item)
  const completed = isCompleted(startDate, item.period_years)

  const swipe = useSwipeToDelete({
    enabled: !!onDelete,
    onDelete: async () => {
      if (onDelete) await onDelete(item.id)
    },
  })

  return (
    <>
      <div
        className="relative overflow-hidden border-b border-border-subtle last:border-b-0"
        onTouchStart={swipe.onTouchStart}
        onTouchMove={swipe.onTouchMove}
        onTouchEnd={swipe.onTouchEnd}
      >
        {/* 배경: 삭제 버튼 (스와이프 시 노출) */}
        {onDelete && (
          <div className="absolute inset-y-0 right-0 w-20 flex items-center justify-center bg-red-500">
            <button
              type="button"
              onClick={swipe.onDeleteButtonClick}
              className="flex flex-col items-center justify-center gap-1 w-full h-full"
              aria-label="삭제"
            >
              <TrashSimple className="w-5 h-5 text-white" weight="bold" />
              <span className="text-[11px] font-semibold text-white">삭제</span>
            </button>
          </div>
        )}

        {/* 전경: 투자 항목 카드 */}
        <div
          className="relative bg-card py-2 select-none"
          style={{
            transform: `translateX(${swipe.translateX}px)`,
            transition: swipe.isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (swipe.isRevealed) {
                swipe.close()
                return
              }
              onClick()
            }}
            onContextMenu={(e) => e.preventDefault()}
            className="w-full text-left px-4 py-4 rounded-2xl transition-colors transition-transform duration-150 ease-out hover:bg-surface active:bg-surface-hover active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background will-change-transform"
          >
            <div className="flex flex-col gap-1.5 min-w-0">
              {/* 1줄: 아바타 + 종목명 */}
              <div className="flex items-center gap-2 min-w-0">
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                  item.market === 'US'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-[var(--brand-accent-bg)] text-[var(--brand-accent-text)]'
                }`}>
                  {getAvatarLabel(item.title)}
                </div>
                <h3 className="text-lg font-bold text-foreground truncate">
                  {item.title}
                </h3>
              </div>

              {/* 2줄: 월 투자금 · 투자일 · 모드 뱃지 */}
              <div className="pl-2 flex items-center gap-2 flex-wrap">
                <p className={`text-sm ${completed ? 'text-green-600 font-semibold' : 'text-muted-foreground'}`}>
                  월 {formatCurrency(item.monthly_amount)}
                  {item.investment_days && item.investment_days.length > 0 && (
                    <> · {formatInvestmentDays(item.investment_days)}</>
                  )}
                </p>
                <span className="inline-flex items-center rounded-full px-1.5 py-px text-[10px] font-medium bg-surface text-foreground-subtle">
                  {habit ? '자유 적립' : '목표 적립'}
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={swipe.isDeleteModalOpen}
        onClose={swipe.onDeleteModalClose}
        onConfirm={swipe.onDeleteConfirm}
        isDeleting={swipe.isSubmitting}
        title={`'${item.title}' 삭제`}
        description="삭제된 투자 기록은 복구할 수 없습니다."
      />
    </>
  )
}
