'use client'

import { Check, Clock, TrashSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { formatInvestmentDays } from '@/app/types/investment'
import { getRecordAvatar } from '@/app/utils/recordAvatar'
import { useSwipeToDelete } from '@/app/hooks/ui/useSwipeToDelete'
import { useInvestmentsContext } from '@/app/contexts/InvestmentsContext'
import DeleteConfirmModal from '@/app/components/Common/DeleteConfirmModal'
import type { Investment } from '@/app/types/investment'

export interface GoalGroupItemRowProps {
  record: Investment
  /** 이번 달 납입 완료 여부 */
  isPaid: boolean
  /** 이번 달 미룸 여부 */
  isPostponed: boolean
  /** 이번 달 미루기 노출 가능 여부 (납입일 당일부터 true) */
  canPostpone: boolean
  /** 이번 달 납입 완료 토글 */
  onTogglePaid: (record: Investment) => void
  /** 이번 달 미룸 토글 */
  onTogglePostpone: (record: Investment) => void
  /** 행(완료 버튼 외 영역) 탭 → 투자 상세 */
  onSelect: (recordId: string) => void
  /** 카드 내 마지막 행이면 border-bottom 미표시 */
  isLast?: boolean
}

/**
 * 목적 그룹 카드 안의 적립 항목 1행.
 * - 좌측 스와이프 → 빨간 삭제 버튼 노출 → 삭제 확인 모달
 * - 좌: 아바타 + 항목명 / 납입일
 * - 우: 월 납입액 + "완료하기" 버튼
 * - 버튼 외 행 영역 탭 → 상세 (스와이프 노출 상태에선 닫기)
 */
export function GoalGroupItemRow({
  record,
  isPaid,
  isPostponed,
  canPostpone,
  onTogglePaid,
  onTogglePostpone,
  onSelect,
  isLast = false,
}: GoalGroupItemRowProps) {
  const { deleteInvestment } = useInvestmentsContext()
  const swipe = useSwipeToDelete({
    onDelete: async () => {
      await deleteInvestment(record.id)
    },
  })

  const amountLabel =
    record.unit_type === 'shares' && record.monthly_shares
      ? `${record.monthly_shares}주`
      : formatCurrency(record.monthly_amount)
  const avatar = getRecordAvatar(record)
  // 만기 정산이 끝난 적금: 더 이상 월 납입 없음 → "완료하기" 버튼 대신 "만기 완료" 배지.
  // 설계 문서: .omc/specs/deep-interview-goal-savings-mismatch.md
  const isSettled = !!record.settled_at

  return (
    <>
      <div
        className="relative overflow-hidden bg-card"
        onTouchStart={swipe.onTouchStart}
        onTouchMove={swipe.onTouchMove}
        onTouchEnd={swipe.onTouchEnd}
      >
        <button
          type="button"
          onClick={swipe.onDeleteButtonClick}
          className="absolute inset-y-px right-0 flex w-20 flex-col items-center justify-center gap-1 bg-red-500"
          aria-label="삭제"
        >
          <TrashSimple className="h-5 w-5 text-white" weight="bold" />
          <span className="text-[11px] font-semibold text-white">삭제</span>
        </button>

        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            if (swipe.isRevealed) {
              swipe.close()
              return
            }
            onSelect(record.id)
          }}
          onKeyDown={(ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
              ev.preventDefault()
              onSelect(record.id)
            }
          }}
          onContextMenu={(ev) => ev.preventDefault()}
          aria-label={`${record.title} 상세 보기`}
          className="relative flex cursor-pointer select-none items-center justify-between gap-3 bg-card py-2.5 transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{
            transform: `translateX(${swipe.translateX}px)`,
            transition: swipe.isDragging
              ? 'none'
              : 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-col gap-1.5">
              <div className="flex min-w-0 items-center gap-2">
                <div
                  className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${avatar.sizeClassName} ${avatar.className}`}
                  aria-hidden
                >
                  {avatar.label}
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
            {isSettled ? (
              <span
                className="shrink-0 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground-soft"
                aria-label="만기 정산 완료"
              >
                만기 완료
              </span>
            ) : isPaid ? (
              // 완료 상태: 다시 누르면 미완료로 되돌린다.
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
            ) : isPostponed ? (
              // 미룸 상태: 완료도 미완료도 아닌 "미룸". 다시 누르면 미룸을 해제한다.
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="shrink-0 gap-1 px-3 text-muted-foreground"
                onClick={(ev) => {
                  ev.stopPropagation()
                  onTogglePostpone(record)
                }}
                aria-label="이번 달 미룸 해제"
              >
                <Clock className="h-3.5 w-3.5" weight="bold" />
                미룸
              </Button>
            ) : (
              // 대기 상태: 완료하기(프라이머리 컬러) + (납입일 당일부터) 미루기(회색)
              <>
                {canPostpone && (
                  <Button
                    type="button"
                    variant="soft"
                    size="xs"
                    className="shrink-0 px-3"
                    onClick={(ev) => {
                      ev.stopPropagation()
                      onTogglePostpone(record)
                    }}
                    aria-label="이번 달 납입 미루기"
                  >
                    미루기
                  </Button>
                )}
                <Button
                  type="button"
                  variant="default"
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
              </>
            )}
          </div>
        </div>
      </div>

      {!isLast && (
        <div aria-hidden className="h-px bg-border-subtle-lighter" />
      )}

      <DeleteConfirmModal
        isOpen={swipe.isDeleteModalOpen}
        onClose={swipe.onDeleteModalClose}
        onConfirm={swipe.onDeleteConfirm}
        isDeleting={swipe.isSubmitting}
        title={`'${record.title}' 삭제`}
        description="삭제된 적립 기록은 복구할 수 없습니다."
      />
    </>
  )
}
