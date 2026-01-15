'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { IconArrowLeft, IconPencil, IconTrash } from '@tabler/icons-react'
import { Investment, getStartDate } from '@/app/types/investment'
import { 
  calculateEndDate, 
  getElapsedText, 
  calculateProgress,
  formatYearMonth,
  isCompleted
} from '@/app/utils/date'

interface InvestmentDetailViewProps {
  item: Investment
  onBack: () => void
  onEdit: () => void
  onDelete: () => Promise<void>
  isDeleting?: boolean
  calculateFutureValue: (monthlyAmount: number, T: number, P: number, R: number) => number
}

export default function InvestmentDetailView({
  item,
  onBack,
  onEdit,
  onDelete,
  isDeleting = false,
  calculateFutureValue,
}: InvestmentDetailViewProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
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
    <div className="fixed inset-0 z-50 bg-coolgray-25 overflow-y-auto">
      {/* 헤더 */}
      <header className="h-[52px] flex items-center px-4">
        <button
          onClick={onBack}
          className="p-2 text-coolgray-700 hover:text-coolgray-900 transition-colors"
          aria-label="뒤로가기"
        >
          <IconArrowLeft className="w-6 h-6" />
        </button>
      </header>

      {/* 콘텐츠 */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* 종목명 & 상태 카드 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-coolgray-900 mb-2">
            {item.title}
          </h2>
          <p className={`text-lg ${completed ? 'text-green-600' : 'text-brand-600'} font-semibold`}>
            {completed ? '목표 달성! 🎉' : elapsedText}
          </p>
        </div>

        {/* 프로그레스 카드 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between text-sm text-coolgray-500 mb-3">
            <span className="font-medium">진행률</span>
            <span className="font-bold text-coolgray-900 text-lg">{progress}%</span>
          </div>
          <div className="w-full h-4 bg-coolgray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                completed ? 'bg-green-500' : 'bg-brand-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-coolgray-400 mt-3">
            <span>시작: {formatYearMonth(startDate)}</span>
            <span>종료: {formatYearMonth(endDate)}</span>
          </div>
        </div>

        {/* 예상 금액 카드 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-coolgray-500 mb-2">만기 시 예상 금액</h3>
          <div className="text-3xl font-bold text-coolgray-900 mb-3">
            {formatCurrency(calculatedFutureValue)}
          </div>
          <div className="inline-block bg-[#E0F8E8] text-green-600 rounded-full px-4 py-1.5 text-sm font-semibold">
            + {formatCurrency(calculatedProfit)} 수익
          </div>
        </div>

        {/* 상세 정보 카드 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-coolgray-900 mb-4">투자 정보</h3>
          <div className="space-y-4">
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
            <div className="border-t border-coolgray-100 my-2" />
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
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-coolgray-100 hover:bg-coolgray-200 text-coolgray-700 font-semibold rounded-xl transition-colors"
          >
            <IconPencil className="w-5 h-5" />
            수정
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl transition-colors"
          >
            <IconTrash className="w-5 h-5" />
            삭제
          </button>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          {/* 오버레이 */}
          <div 
            className="fixed inset-0 bg-black/50"
            onClick={() => {
              if (!isDeleting) {
                setShowDeleteModal(false)
              }
            }}
          />
          
          {/* 모달 컨텐츠 */}
          <div className="relative z-[60] w-full max-w-md mx-4 bg-white rounded-2xl shadow-lg p-6">
            {/* 헤더 */}
            <div className="mb-4">
              <h2 className="text-lg font-bold text-coolgray-900 mb-2">
                정말 삭제하시겠습니까?
              </h2>
              <p className="text-sm text-gray-500">
                삭제된 투자 기록은 복구할 수 없습니다.
              </p>
            </div>

            {/* 버튼 영역 */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 py-3 text-sm font-medium text-coolgray-700 bg-coolgray-100 rounded-xl hover:bg-coolgray-200 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={onDelete}
                disabled={isDeleting}
                className="flex-1 py-3 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
