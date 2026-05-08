'use client'

interface BulkCompleteRetroactiveModalProps {
  isOpen: boolean
  count: number
  onClose: () => void
  onConfirm: () => Promise<void> | void
  isPending: boolean
}

export default function BulkCompleteRetroactiveModal({
  isOpen,
  count,
  onClose,
  onConfirm,
  isPending,
}: BulkCompleteRetroactiveModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => {
          if (!isPending) onClose()
        }}
      />

      <div className="relative z-[60] w-full max-w-md mx-4 bg-card rounded-2xl shadow-lg p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground mb-3">
            소급 기록을 모두 완료로 표시할까요?
          </h2>
          <p className="text-sm text-muted-foreground">
            아직 기록되지 않은 <span className="font-medium text-foreground">{count}개월</span>을
            한 번에 완료로 표시합니다. 이미 기록된 월은 그대로 유지돼요.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 py-3 text-base font-medium text-foreground-soft bg-secondary rounded-xl hover:bg-surface-strong transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={() => onConfirm()}
            disabled={isPending}
            className="flex-1 py-3 text-base font-medium text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending ? '처리 중...' : '전체 완료'}
          </button>
        </div>
      </div>
    </div>
  )
}
