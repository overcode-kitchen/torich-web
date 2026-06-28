'use client'

interface ExitConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

/**
 * 적립 항목 추가 플로우 중단 확인 다이얼로그.
 * 그룹 A의 첫 입력 단계에서 ← 버튼을 누르면 노출된다.
 */
export default function ExitConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
}: ExitConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-[60] w-full max-w-md mx-4 bg-card rounded-2xl shadow-lg p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground mb-3">
            여기서 그만둘까요?
          </h2>
          <p className="text-sm text-muted-foreground">
            지금까지 입력한 내용이 사라져요.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-base font-medium text-foreground-soft bg-secondary rounded-xl hover:bg-surface-strong transition-colors"
          >
            계속하기
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 text-base font-medium text-white bg-destructive rounded-xl hover:bg-destructive/90 transition-colors"
          >
            그만두기
          </button>
        </div>
      </div>
    </div>
  )
}
