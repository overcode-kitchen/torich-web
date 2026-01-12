'use client'

import { formatCurrency } from '@/lib/utils'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import { Investment, getStartDate } from '@/app/types/investment'
import { 
  calculateEndDate, 
  getRemainingText, 
  isCompleted 
} from '@/app/utils/date'

interface InvestmentItemProps {
  item: Investment
  isActive: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  calculateFutureValue: (monthlyAmount: number, T: number, P: number, R: number) => number
}

export default function InvestmentItem({
  item,
  isActive,
  onToggle,
  onEdit,
  onDelete,
  calculateFutureValue,
}: InvestmentItemProps) {
  // 시작일 추출 (start_date가 없으면 created_at 사용)
  const startDate = getStartDate(item)
  
  // 연이율 (기본 10%)
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
  
  // 남은 기간 텍스트
  const remainingText = getRemainingText(startDate, item.period_years)
  
  // 완료 여부
  const completed = isCompleted(startDate, item.period_years)

  return (
    <div className="relative overflow-hidden border-b border-coolgray-100 last:border-b-0">
      {/* 메인 컨텐츠 (슬라이딩되는 부분) */}
      <div
        onClick={onToggle}
        className={`flex items-start gap-2 py-4 px-2 w-full cursor-pointer transition-all duration-300 ease-in-out bg-white hover:bg-gray-50 active:bg-gray-100 relative z-10 ${
          isActive ? '-translate-x-[120px]' : 'translate-x-0'
        }`}
      >
        {/* 좌측: 종목명 및 상세 정보 */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* 종목명 */}
          <h3 className="text-lg font-bold text-coolgray-900 mb-1 truncate">
            {item.title}
          </h3>
          {/* 한 줄로 합친 정보: 월 투자금 · 남은 기간 */}
          <p className={`text-sm ${completed ? 'text-green-600 font-semibold' : 'text-coolgray-500'}`}>
            월 {formatCurrency(item.monthly_amount)} · {remainingText}
          </p>
        </div>
        
        {/* 우측: 금액 정보 */}
        <div className="flex-shrink-0 flex flex-col items-end">
          {/* 최종 예상 금액 */}
          <span className="text-xl font-bold text-coolgray-900 mb-1 whitespace-nowrap">
            {formatCurrency(calculatedFutureValue)}
          </span>
          {/* 수익금 배지 */}
          <span className="bg-[#E0F8E8] text-green-600 rounded-full px-3 py-0.5 text-sm font-medium whitespace-nowrap">
            + {formatCurrency(calculatedProfit)}
          </span>
        </div>
      </div>

      {/* 수정 버튼 */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onEdit()
        }}
        className="absolute right-[60px] top-0 h-full w-[60px] bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-blue-500 transition-all z-0"
        aria-label="수정"
      >
        <IconPencil className="w-5 h-5" />
      </button>

      {/* 삭제 버튼 */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="absolute right-0 top-0 h-full w-[60px] bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-red-500 transition-all z-0"
        aria-label="삭제"
      >
        <IconTrash className="w-5 h-5" />
      </button>
    </div>
  )
}

