'use client'

import { X } from '@phosphor-icons/react'

interface Props {
  isOpen: boolean
  onClose: () => void
  stockName: string
  onStockNameChange: (name: string) => void
  onConfirm: () => void
}

export default function ManualInputModal({
  isOpen,
  onClose,
  stockName,
  onStockNameChange,
  onConfirm,
}: Props) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 오버레이 */}
      <div className="fixed inset-0 bg-black/50 animate-in fade-in-0" onClick={onClose} />

      {/* 모달 컨텐츠 */}
      <div className="relative z-50 w-full max-w-md mx-4 bg-card rounded-lg shadow-lg border p-6 animate-in fade-in-0 zoom-in-95">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-transparent hover:bg-surface-hover rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="닫기"
        >
          <X className="w-5 h-5 text-foreground-muted" />
        </button>

        {/* 헤더 */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">적립할 항목 직접 입력</h2>
        </div>

        <div className="space-y-4 py-4">
          {/* 항목 이름 입력 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">항목 이름</label>
            <input
              type="text"
              value={stockName}
              onChange={(e) => onStockNameChange(e.target.value)}
              placeholder="예: 나만의 포트폴리오"
              className="w-full bg-card border border-border rounded-xl p-3 text-foreground placeholder-foreground-subtle focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-secondary text-foreground-soft font-medium py-3 rounded-xl hover:bg-surface-strong transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-brand-600 text-white font-medium py-3 rounded-xl hover:bg-brand-700 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
