'use client'

import { IconInfoCircle, IconX } from '@tabler/icons-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  stockName: string
  onStockNameChange: (name: string) => void
  rate: string
  onRateChange: (rate: string) => void
  onConfirm: () => void
  onRateHelpClick: () => void
}

export default function ManualInputModal({
  isOpen,
  onClose,
  stockName,
  onStockNameChange,
  rate,
  onRateChange,
  onConfirm,
  onRateHelpClick,
}: Props) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 오버레이 */}
      <div className="fixed inset-0 bg-black/50 animate-in fade-in-0" onClick={onClose} />

      {/* 모달 컨텐츠 */}
      <div className="relative z-50 w-full max-w-md mx-4 bg-white rounded-lg shadow-lg border p-6 animate-in fade-in-0 zoom-in-95">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-transparent hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="닫기"
        >
          <IconX className="w-5 h-5 text-gray-600" />
        </button>

        {/* 헤더 */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-coolgray-900">투자할 종목 직접 입력</h2>
        </div>

        <div className="space-y-4 py-4">
          {/* 종목명 입력 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-coolgray-900">종목 이름</label>
            <input
              type="text"
              value={stockName}
              onChange={(e) => onStockNameChange(e.target.value)}
              placeholder="예: 나만의 포트폴리오"
              className="w-full bg-white border border-coolgray-200 rounded-xl p-3 text-coolgray-900 placeholder-coolgray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* 예상 수익률 입력 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-coolgray-900">예상 연평균 수익률 (%)</label>
              <button
                type="button"
                onClick={onRateHelpClick}
                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded"
                aria-label="수익률 계산 방식 안내"
              >
                <IconInfoCircle className="w-4 h-4" />
              </button>
            </div>
            <input
              type="number"
              value={rate}
              onChange={(e) => onRateChange(e.target.value)}
              placeholder="10"
              step="0.1"
              min="0"
              max="100"
              className="w-full bg-white border border-coolgray-200 rounded-xl p-3 text-coolgray-900 placeholder-coolgray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-xs text-coolgray-500 leading-relaxed">
              💡 잘 모르겠다면 S&amp;P500 평균인 <strong>10%</strong>를 입력해보세요. 보수적으로 잡고 싶다면 예금 금리{' '}
              <strong>3%</strong>를 추천해요.
            </p>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-coolgray-100 text-coolgray-700 font-medium py-3 rounded-xl hover:bg-coolgray-200 transition-colors"
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
