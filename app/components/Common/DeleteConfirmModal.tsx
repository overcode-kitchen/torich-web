'use client'

import { createPortal } from 'react-dom'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  isDeleting: boolean
  title?: string
  description?: string
  /** 확인 버튼 색조. 파괴적 액션은 'destructive'(기본), 되돌릴 수 있는 액션은 'primary'. */
  tone?: 'destructive' | 'primary'
  /** 확인 버튼 라벨. 기본 '삭제'. */
  confirmLabel?: string
  /** 진행 중 확인 버튼 라벨. 기본 '삭제 중...'. */
  confirmingLabel?: string
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  title = '정말 삭제하시겠습니까?',
  description = '삭제된 투자 기록은 복구할 수 없습니다.',
  tone = 'destructive',
  confirmLabel = '삭제',
  confirmingLabel = '삭제 중...',
}: DeleteConfirmModalProps) {
  // 정적 export(prerender) 단계엔 document가 없다. 모든 호출부가 isOpen=false로 시작하므로
  // 이 가드로 하이드레이션 불일치 없이 서버 렌더만 건너뛴다.
  if (!isOpen || typeof document === 'undefined') return null

  const confirmClasses =
    tone === 'primary'
      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
      : 'bg-destructive text-white hover:bg-destructive/90'

  // body로 포털한다. 이 모달은 목적 카드(`relative z-10`)처럼 스태킹 컨텍스트를 만드는
  // 조상 안에서 렌더되는 경우가 많아, 그대로 두면 z-[60]이 그 컨텍스트에 갇혀
  // 헤더(z-30)·다른 카드 뒤로 dim이 깔리고 바깥 영역에 터치가 새어 나간다.
  return createPortal(
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
            onClick={() => onConfirm()}
            disabled={isDeleting}
            className={`flex-1 py-3 text-base font-medium rounded-xl transition-colors disabled:opacity-50 ${confirmClasses}`}
          >
            {isDeleting ? confirmingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
