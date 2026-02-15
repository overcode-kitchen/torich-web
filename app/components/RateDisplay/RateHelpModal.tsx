'use client'

import { X } from '@phosphor-icons/react'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function RateHelpModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 오버레이 */}
      <div className="fixed inset-0 bg-black/50 animate-in fade-in-0" onClick={onClose} />

      {/* 모달 컨텐츠 */}
      <div className="relative z-50 w-full max-w-md mx-4 bg-white rounded-lg shadow-lg border p-6 animate-in fade-in-0 zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-transparent hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="닫기"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* 헤더 */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-coolgray-900">수익률은 어떻게 계산되나요?</h2>
        </div>

        {/* 본문 내용 */}
        <div className="space-y-4 text-gray-700">
          {/* 1. 데이터 출처 */}
          <div>
            <h3 className="font-semibold text-coolgray-900 mb-2">1. 데이터 출처</h3>
            <p>
              세계적인 금융 데이터 플랫폼 <strong>Yahoo Finance</strong>의{' '}
              <strong>과거 10년치 월봉 데이터</strong>를 기반으로 분석합니다.
            </p>
          </div>

          {/* 2. 계산 방식 */}
          <div>
            <h3 className="font-semibold text-coolgray-900 mb-2">2. 계산 방식</h3>
            <p>
              들쑥날쑥한 주가 변동을 매끄럽게 다듬은 <strong>연평균 성장률(CAGR)</strong>을 사용해요.
            </p>
          </div>

          {/* 3. 현실적인 안전장치 */}
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="font-semibold text-coolgray-900 mb-2 flex items-center gap-2">
              <span>⚠️</span>
              <span>현실적인 안전장치 (중요!)</span>
            </h3>
            <p className="leading-relaxed">
              과거에 50%, 100%씩 올랐던 종목이라도, 미래까지 그 속도로 오르는 것은 비현실적이에요.
              <br />
              <br />
              <strong>
                토리치는 '희망 고문' 대신 '현실적인 자산 목표'를 보여드리기 위해, 워렌 버핏의 장기 수익률 수준인 [연 최대 20%]까지만 예측에 반영합니다.
              </strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
