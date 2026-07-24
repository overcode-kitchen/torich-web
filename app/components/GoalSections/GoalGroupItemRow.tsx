'use client'

import { Check, Clock, TrashSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { formatInvestmentDays } from '@/app/types/investment'
import { RecordAvatar } from '@/app/components/Common/RecordAvatar'
import { useSwipeToDelete } from '@/app/hooks/ui/useSwipeToDelete'
import { useInvestmentsContext } from '@/app/contexts/InvestmentsContext'
import DeleteConfirmModal from '@/app/components/Common/DeleteConfirmModal'
import type { MonthlyRecordStatus } from '@/app/hooks/payment/useMonthlyPaymentStatus'
import type { Investment } from '@/app/types/investment'

export interface GoalGroupItemRowProps {
  record: Investment
  /** 이번 달 회차 진행 상태(completed/total, 다음 회차) */
  status: MonthlyRecordStatus
  /** 이번 달 미룸 여부 */
  isPostponed: boolean
  /** 이번 달 납입 완료 토글 */
  onTogglePaid: (record: Investment) => void
  /** 이번 달 미룸 토글 */
  onTogglePostpone: (record: Investment) => void
  /** 행(완료 버튼 외 영역) 탭 → 투자 상세 */
  onSelect: (recordId: string) => void
  /** 카드 내 마지막 행이면 border-bottom 미표시 */
  isLast?: boolean
  /** 묶인 목적이 완료(기간 종료)면 이번 달 납입 토글·미루기를 비활성(정적)으로 만든다. */
  frozen?: boolean
}

/**
 * 목적 그룹 카드 안의 적립 항목 1행.
 * - 좌측 스와이프 → [미루기(대기 상태)] + [삭제] 노출. 삭제는 확인 모달, 미루기는 즉시 토글.
 * - 좌: 아바타 + 항목명 / 납입일
 * - 우: 월 납입액 + 상태별 단일 요소(대기=완료 버튼 / 완료·미룸·만기완료=상태 pill)
 * - 버튼 외 행 영역 탭 → 상세 (스와이프 노출 상태에선 닫기)
 */
export function GoalGroupItemRow({
  record,
  status,
  isPostponed,
  onTogglePaid,
  onTogglePostpone,
  onSelect,
  isLast = false,
  frozen = false,
}: GoalGroupItemRowProps) {
  const { deleteInvestment } = useInvestmentsContext()
  const { total, completed, nextPendingDay, isFullyPaid } = status
  // 회차가 2개 이상인 항목만 "N일 완료" 라벨과 이번 달 진행(x/N)을 노출한다(1회차는 종전 그대로).
  const isMulti = total > 1
  const amountLabel =
    record.unit_type === 'shares' && record.monthly_shares
      ? `${record.monthly_shares}주`
      : formatCurrency(record.monthly_amount)
  // 만기 정산이 끝난 적금: 더 이상 월 납입 없음 → "완료" 버튼 대신 "만기 완료" 배지.
  // 설계 문서: .omc/specs/deep-interview-goal-savings-mismatch.md
  const isSettled = !!record.settled_at

  // 아직 한 회차도 완료하지 않았고·미룸아님·정산끝아님이면 스와이프에 "미루기"를 함께 노출한다.
  // 납입일 도래 여부와 무관하게 노출 — 사용자가 이번 달 납입을 미리 미룰 수 있어야 한다.
  // 이미 한 회차라도 완료했거나(진행 중), 완료(기간 종료)된 목적의 항목은 미루기를 접는다.
  const showPostponeInSwipe = completed === 0 && !isPostponed && !isSettled && !frozen
  const swipe = useSwipeToDelete({
    onDelete: async () => {
      await deleteInvestment(record.id)
    },
    actionCount: showPostponeInSwipe ? 2 : 1,
  })

  return (
    <>
      <div
        className="relative overflow-hidden bg-card"
        onTouchStart={swipe.onTouchStart}
        onTouchMove={swipe.onTouchMove}
        onTouchEnd={swipe.onTouchEnd}
      >
        {/* 스와이프 액션: 훅의 노출 폭은 액션당 80px 슬롯. 버튼은 68px + 여백으로 슬롯 안에 띄운다. */}
        {showPostponeInSwipe && (
          <button
            type="button"
            onClick={() => {
              onTogglePostpone(record)
              swipe.close()
            }}
            className="absolute inset-y-1 right-[80px] flex w-[68px] flex-col items-center justify-center gap-1 rounded-xl bg-surface-hover"
            aria-label="이번 달 납입 미루기"
          >
            <Clock className="h-5 w-5 text-foreground-soft" weight="bold" />
            <span className="text-[11px] font-semibold text-foreground-soft">미루기</span>
          </button>
        )}
        <button
          type="button"
          onClick={swipe.onDeleteButtonClick}
          className="absolute inset-y-1 right-1 flex w-[68px] flex-col items-center justify-center gap-1 rounded-xl bg-destructive/85"
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
                <RecordAvatar record={record} size="sm" />
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
              // 만기 완료: 종료된 항목 → 중립 회색 pill (비인터랙티브)
              <span
                className="shrink-0 rounded-md bg-surface-hover px-2.5 py-1 text-xs font-medium text-foreground-soft"
                aria-label="만기 정산 완료"
              >
                만기 완료
              </span>
            ) : frozen ? (
              // 완료된 목적의 항목: 이번 달 납입 토글 비활성 (지난 내역 → 금액만 표시)
              null
            ) : isFullyPaid ? (
              // 전부 완료: 초록 pill. 탭하면 마지막 회차를 취소한다.
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-1 rounded-md bg-brand-accent-bg px-2.5 py-1 text-xs font-medium text-brand-accent-text"
                onClick={(ev) => {
                  ev.stopPropagation()
                  onTogglePaid(record)
                }}
                aria-label={isMulti ? '이번 달 납입 전체 취소' : '이번 달 납입 완료 취소'}
              >
                <Check className="h-3.5 w-3.5" weight="bold" />
                완료
              </button>
            ) : completed === 0 && isPostponed ? (
              // 미룸 상태(아직 한 회차도 완료 안 함): 중립 회색 pill. 탭하면 미룸을 해제한다.
              <button
                type="button"
                className="shrink-0 rounded-md bg-surface-hover px-2.5 py-1 text-xs font-medium text-foreground-soft"
                onClick={(ev) => {
                  ev.stopPropagation()
                  onTogglePostpone(record)
                }}
                aria-label="이번 달 미룸 해제"
              >
                미룸
              </button>
            ) : (
              // 대기·진행 중: 다음 도래 회차를 완료하는 프라이머리 버튼.
              // 회차가 여럿이면 대상 날짜를 라벨에 명시("10일 완료" → 완료하면 "20일 완료"로 진행이 드러남).
              <Button
                type="button"
                variant="default"
                size="xs"
                className="shrink-0 px-3"
                onClick={(ev) => {
                  ev.stopPropagation()
                  onTogglePaid(record)
                }}
                aria-label={isMulti ? `${nextPendingDay}일 납입 완료` : '이번 달 납입 완료'}
              >
                {isMulti ? `${nextPendingDay}일 완료` : '완료'}
              </Button>
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
