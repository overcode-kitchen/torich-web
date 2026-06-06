'use client'

import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export interface MaturityMismatchConfirmModalProps {
  isOpen: boolean
  /** 목적 이름 (예: "집 사기") */
  goalName: string
  /** 목적의 현재 종료일 (YYYY-MM-DD) */
  goalTargetDate: string
  /** 가장 늦은 만기를 가진 적금 이름 */
  recordTitle: string
  /** 그 적금의 만기일 (YYYY-MM-DD) */
  recordMaturityDate: string
  /** "그대로 진행" — 입력된 값 그대로 저장 (런타임 정산 대기로 이어짐) */
  onProceed: () => void
  /** "종료일을 적금 만기로 맞추기" — target_date를 적금 만기로 자동 조정 후 저장 */
  onAlignDate: () => void
  /** "취소" — 모달만 닫고 폼 유지 */
  onCancel: () => void
  /** 처리 중 인디케이션 (저장 진행 중 등) */
  isProcessing?: boolean
}

/**
 * 목적 종료일이 묶인 적금 만기보다 빠른 경우 폼 제출 직전 노출되는 확인 모달.
 * 디자인 컨셉: 경고가 아니라 "안내" — 토리치가 알아서 기다려준다는 메시지.
 *
 * 설계 문서: .omc/specs/deep-interview-goal-savings-mismatch.md
 */
export default function MaturityMismatchConfirmModal({
  isOpen,
  goalName,
  goalTargetDate,
  recordTitle,
  recordMaturityDate,
  onProceed,
  onAlignDate,
  onCancel,
  isProcessing = false,
}: MaturityMismatchConfirmModalProps) {
  if (!isOpen) return null

  const goalDateLabel = formatDate(goalTargetDate)
  const recordDateLabel = formatDate(recordMaturityDate)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => {
          if (!isProcessing) onCancel()
        }}
      />

      <div className="relative z-[60] w-full max-w-md mx-4 bg-card rounded-2xl shadow-lg p-6">
        <div className="mb-5">
          <h2 className="text-xl font-semibold tracking-tight text-foreground mb-3">
            묶인 적금이 더 늦게 만기돼요
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">"{goalName}"</span>의
            종료일은 <span className="tabular-nums">{goalDateLabel}</span>이고,
            묶은 <span className="font-medium text-foreground">"{recordTitle}"</span>
            의 만기는 <span className="tabular-nums">{recordDateLabel}</span>예요.
            <br />
            <br />
            적금 만기까지 토리치가 자동으로 기다려드릴 수 있어요.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onProceed}
            disabled={isProcessing}
            className="w-full py-3 text-base font-semibold text-primary-foreground bg-primary rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            그대로 진행
          </button>
          <button
            type="button"
            onClick={onAlignDate}
            disabled={isProcessing}
            className="w-full py-3 text-base font-medium text-foreground-soft bg-secondary rounded-xl hover:bg-surface-strong transition-colors disabled:opacity-50"
          >
            종료일을 적금 만기로 맞추기
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="w-full py-2 text-sm text-foreground-subtle hover:text-foreground transition-colors disabled:opacity-50"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return format(d, 'yyyy년 M월 d일', { locale: ko })
}
