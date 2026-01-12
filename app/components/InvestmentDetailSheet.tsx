'use client'

import { formatCurrency } from '@/lib/utils'
import { IconX } from '@tabler/icons-react'
import { Investment, getStartDate } from '@/app/types/investment'
import { 
  calculateEndDate, 
  getElapsedText, 
  calculateProgress,
  formatYearMonth,
  isCompleted
} from '@/app/utils/date'

interface InvestmentDetailSheetProps {
  item: Investment
  isOpen: boolean
  onClose: () => void
  calculateFutureValue: (monthlyAmount: number, T: number, P: number, R: number) => number
}

export default function InvestmentDetailSheet({
  item,
  isOpen,
  onClose,
  calculateFutureValue,
}: InvestmentDetailSheetProps) {
  if (!isOpen) return null

  // 시작일 추출
  const startDate = getStartDate(item)
  const endDate = calculateEndDate(startDate, item.period_years)
  
  // 연이율
  const R = item.annual_rate ? item.annual_rate / 100 : 0.10
  
  // 만기 시점 미래 가치 계산
  const calculatedFutureValue = calculateFutureValue(
    item.monthly_amount,
    item.period_years,
    item.period_years,
    R
  )
  
  // 총 원금 계산
  const totalPrincipal = item.monthly_amount * 12 * item.period_years
  
  // 수익금 계산
  const calculatedProfit = calculatedFutureValue - totalPrincipal
  
  // 진행 기간 텍스트
  const elapsedText = getElapsedText(startDate)
  
  // 진행률 계산
  const progress = calculateProgress(startDate, item.period_years)
  
  // 완료 여부
  const completed = isCompleted(startDate, item.period_years)

  return (
    <>
      {/* 오버레이 */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in-0"
        onClick={onClose}
      />
      
      {/* 바텀 시트 */}
      <div className="fixed bottom-0 left-0 right-0 sm:inset-x-0 sm:max-w-[480px] sm:mx-auto z-50 bg-white rounded-t-3xl shadow-lg animate-in slide-in-from-bottom duration-300">
        <div className="max-w-md mx-auto p-6">
          {/* 핸들 바 */}
          <div className="w-12 h-1.5 bg-coolgray-200 rounded-full mx-auto mb-4" />
          
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-coolgray-500 hover:text-coolgray-700 transition-colors"
            aria-label="닫기"
          >
            <IconX className="w-5 h-5" />
          </button>

          {/* 헤더 */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-coolgray-900 mb-1">
              {item.title}
            </h2>
            {/* 진행 기간 텍스트 */}
            <p className={`text-lg ${completed ? 'text-green-600' : 'text-brand-600'} font-semibold`}>
              {completed ? '목표 달성! 🎉' : elapsedText}
            </p>
          </div>

          {/* 프로그레스 바 */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-coolgray-500 mb-2">
              <span>진행률</span>
              <span className="font-medium text-coolgray-900">{progress}%</span>
            </div>
            <div className="w-full h-3 bg-coolgray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  completed ? 'bg-green-500' : 'bg-brand-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* 기간 표시 */}
            <div className="flex justify-between text-xs text-coolgray-400 mt-2">
              <span>시작: {formatYearMonth(startDate)}</span>
              <span>종료: {formatYearMonth(endDate)}</span>
            </div>
          </div>

          {/* 상세 정보 */}
          <div className="space-y-4 bg-coolgray-50 rounded-2xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-coolgray-500">월 투자금</span>
              <span className="font-semibold text-coolgray-900">
                {formatCurrency(item.monthly_amount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-coolgray-500">목표 기간</span>
              <span className="font-semibold text-coolgray-900">
                {item.period_years}년
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-coolgray-500">연 수익률</span>
              <span className="font-semibold text-coolgray-900">
                {(R * 100).toFixed(0)}%
              </span>
            </div>
            <div className="border-t border-coolgray-200 my-2" />
            <div className="flex justify-between items-center">
              <span className="text-coolgray-500">총 원금</span>
              <span className="font-semibold text-coolgray-900">
                {formatCurrency(totalPrincipal)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-coolgray-500">예상 수익</span>
              <span className="font-semibold text-green-600">
                + {formatCurrency(calculatedProfit)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-coolgray-500 font-semibold">만기 시 예상 금액</span>
              <span className="font-bold text-xl text-coolgray-900">
                {formatCurrency(calculatedFutureValue)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

