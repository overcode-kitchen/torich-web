'use client'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  isDeleting: boolean
  title?: string
  description?: string
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  title = '정말 삭제하시겠습니까?',
  description = '삭제된 투자 기록은 복구할 수 없습니다.',
}: DeleteConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* 오버레이 */}
      <div 
        className="fixed inset-0 bg-black/50"
        onClick={() => {
          if (!isDeleting) {
            onClose()
          }
        }}
      />
      
      {/* 모달 컨텐츠 */}
      <div className="relative z-[60] w-full max-w-md mx-4 bg-card rounded-2xl shadow-lg p-6">
        {/* 헤더 */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground mb-3">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>

        {/* 버튼 영역 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-3 text-base font-medium text-foreground-soft bg-secondary rounded-xl hover:bg-surface-strong transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 text-base font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  )
}
