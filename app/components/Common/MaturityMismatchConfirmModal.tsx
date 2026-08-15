'use client'

import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

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
  /** "만기까지 기다리기" — 입력된 값 그대로 저장 (런타임 정산 대기로 이어짐) */
  onProceed: () => void
  /** "목적 종료일 미루기" — target_date를 적금 만기로 자동 조정 후 저장 */
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

      <Card className="relative z-[60] w-full max-w-md mx-4 p-6 shadow-lg">
        <div className="mb-5">
          <h2 className="text-heading font-semibold tracking-tight text-foreground mb-3">
            묶인 적금이 더 늦게 만기돼요
          </h2>
          <p className="text-label text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">&ldquo;{goalName}&rdquo;</span>의
            종료일은 <span className="tabular-nums">{goalDateLabel}</span>이고,
            묶은 <span className="font-medium text-foreground">&ldquo;{recordTitle}&rdquo;</span>
            의 만기는 <span className="tabular-nums">{recordDateLabel}</span>예요.
          </p>
          <p className="mt-3 text-label text-muted-foreground leading-relaxed">
            적금 만기까지 토리치가 자동으로 기다려드릴 수 있어요.
          </p>
          <div className="mt-3 space-y-1 text-label text-muted-foreground">
            <p>· 기다리면 종료일은 그대로예요.</p>
            <p>· 미루면 종료일이 적금 만기일로 바뀌어요.</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            onClick={onProceed}
            disabled={isProcessing}
            className="w-full h-12 rounded-xl text-body font-semibold"
          >
            만기까지 기다리기
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onAlignDate}
            disabled={isProcessing}
            className="w-full h-12 rounded-xl text-body"
          >
            목적 종료일 미루기
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isProcessing}
            className="w-full h-10 rounded-xl text-label text-foreground-subtle hover:text-foreground"
          >
            취소
          </Button>
        </div>
      </Card>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return format(d, 'yyyy년 M월 d일', { locale: ko })
}
