'use client'

import { Check, Clock, TrashSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { formatInvestmentDays } from '@/app/types/investment'
import { RecordAvatar } from '@/app/components/Common/RecordAvatar'
import { isContributionEnded } from '@/app/utils/contribution-end'
import { useSwipeToDelete } from '@/app/hooks/ui/useSwipeToDelete'
import { useInvestmentsContext } from '@/app/contexts/InvestmentsContext'
import DeleteConfirmModal from '@/app/components/Common/DeleteConfirmModal'
import type { SortableRenderProps } from '@/app/components/Common/DragSortable'
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
  /** 드래그 손잡이(행 본문에 스프레드). 정렬 활성 카드에서만 전달. */
  dragHandle?: SortableRenderProps['handle']
  /** 이 행이 드래그 중인지. 드래그 중엔 스와이프 제스처를 억제한다. */
  sortableDragging?: boolean
}

/**
 * 목적 그룹 카드 안의 적립 항목 1행.
 * - 좌측 스와이프 → [미루기(대기 상태)] + [삭제] 노출. 삭제는 확인 모달, 미루기는 즉시 토글.
 * - 좌: 아바타 + 항목명 / 납입일
 * - 우: 월 납입액 + 상태별 단일 요소(대기=완료 버튼 / 완료·미룸·적립종료=상태 pill)
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
  dragHandle,
  sortableDragging = false,
}: GoalGroupItemRowProps) {
  const { deleteInvestment } = useInvestmentsContext()
  const { total, completed, nextPendingDay, isFullyPaid } = status
  // 회차가 2개 이상인 항목만 "N일 완료" 라벨과 이번 달 진행(x/N)을 노출한다(1회차는 종전 그대로).
  const isMulti = total > 1
  const amountLabel =
    record.unit_type === 'shares' && record.monthly_shares
      ? `${record.monthly_shares}주`
      : formatCurrency(record.monthly_amount)
  // 적립이 끝난 항목(적금 만기·정산, 투자·현금의 적립 기간 종료): 더 이상 월 납입이 없다
  // → "완료" 버튼 대신 "적립 종료" 배지. 예전엔 settled_at만 봐서 적금 말고는 이 분기를 타지 않았다.
  // "적립 종료"(영구)와 "완료"(이번 달, 매달 리셋)는 서로 다른 말이므로 문구를 겹치지 않게 둔다.
  // 설계 문서: .omc/specs/deep-interview-goal-savings-mismatch.md
  const isEnded = isContributionEnded(record)

  // 아직 한 회차도 완료하지 않았고·미룸아님·적립끝아님이면 스와이프에 "미루기"를 함께 노출한다.
  // 납입일 도래 여부와 무관하게 노출 — 사용자가 이번 달 납입을 미리 미룰 수 있어야 한다.
  // 이미 한 회차라도 완료했거나(진행 중), 완료(기간 종료)된 목적의 항목은 미루기를 접는다.
  const showPostponeInSwipe = completed === 0 && !isPostponed && !isEnded && !frozen
  const swipe = useSwipeToDelete({
    onDelete: async () => {
      await deleteInvestment(record.id)
    },
    actionCount: showPostponeInSwipe ? 2 : 1,
  })

  return (
    <>
      {/* -ml-1 pl-1: 스와이프용 overflow-hidden 경계가 아바타 왼쪽 끝과 정확히 겹쳐 있어서,
          아바타가 꿈틀거릴 때(animate-tory-nudge, 최대 -9° 회전) 볼이 0.58px 만큼
          경계 밖으로 나가 세로로 잘렸다. 클리핑 경계만 4px 왼쪽으로 밀고
          같은 크기의 패딩으로 내용을 제자리에 돌려놓는다(정지 상태 레이아웃 변화 없음).
          구분선은 이 div 의 형제라 함께 늘어나지 않는다. */}
      <div
        className="relative -ml-1 overflow-hidden bg-card pl-1"
        // 드래그(롱프레스) 중엔 스와이프를 억제해 두 제스처가 겹치지 않게 한다.
        onTouchStart={sortableDragging ? undefined : swipe.onTouchStart}
        onTouchMove={sortableDragging ? undefined : swipe.onTouchMove}
        onTouchEnd={sortableDragging ? undefined : swipe.onTouchEnd}
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
          ref={dragHandle?.ref}
          {...dragHandle?.attributes}
          {...dragHandle?.listeners}
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
          aria-label={`${record.title} 상세 보기${dragHandle ? ' (길게 눌러 순서 변경)' : ''}`}
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
                <h4 className="min-w-0 truncate text-body font-semibold text-foreground">
                  {record.title}
                </h4>
              </div>
              <div className="pl-2">
                <p className="truncate text-label text-muted-foreground">
                  {formatInvestmentDays(record.investment_days)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span className="text-label font-bold tabular-nums text-foreground">
              {amountLabel}
            </span>
            {isEnded ? (
              // 적립 종료: 끝난 항목 → 중립 회색 pill (비인터랙티브).
              // 좌측 아바타가 그린 체크로 같은 말을 하고, pill이 왜 완료 버튼이 없는지를 설명한다.
              // 적금 전용 표현("만기")을 피해 투자·현금 기간 만료에도 맞는 유형 중립 문구를 쓴다.
              <span
                className="shrink-0 rounded-md bg-surface-hover px-2.5 py-1 text-caption font-medium text-foreground-soft"
                aria-label="적립 종료"
              >
                적립 종료
              </span>
            ) : frozen ? (
              // 완료된 목적의 항목: 이번 달 납입 토글 비활성 (지난 내역 → 금액만 표시)
              null
            ) : isFullyPaid ? (
              // 전부 완료: 초록 pill. 탭하면 마지막 회차를 취소한다.
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-1 rounded-md bg-brand-accent-bg px-2.5 py-1 text-caption font-medium text-brand-accent-text"
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
                className="shrink-0 rounded-md bg-surface-hover px-2.5 py-1 text-caption font-medium text-foreground-soft"
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
