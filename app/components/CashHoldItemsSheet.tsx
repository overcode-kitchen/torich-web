'use client'

import { formatCurrency } from '@/lib/utils'
import { IconX } from '@tabler/icons-react'
import { Investment, getStartDate } from '@/app/types/investment'
import { calculateEndDate, formatFullDate } from '@/app/utils/date'

interface CashHoldItemsSheetProps {
  items: Investment[]
  selectedYear: number
  onClose: () => void
  calculateFutureValue: (monthlyAmount: number, T: number, P: number, R: number) => number
}

export default function CashHoldItemsSheet({
  items,
  selectedYear,
  onClose,
  calculateFutureValue,
}: CashHoldItemsSheetProps) {
  // 선택한 기간보다 만기가 짧은 (현금 보관 상태인) 항목들 필터링
  const maturedItems = items.filter(item => item.period_years < selectedYear)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* 오버레이 */}
      <div 
        className="fixed inset-0 bg-black/50 animate-in fade-in-0 duration-200"
        onClick={onClose}
      />
      
      {/* 바텀 시트 */}
      <div className="relative z-50 w-full max-w-md bg-white rounded-t-3xl shadow-xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col">
        {/* 핸들 바 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-coolgray-200 rounded-full" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 pb-4">
          <h2 className="text-lg font-bold text-coolgray-900 flex items-center gap-2">
            📦 현금 보관 중인 도토리
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-coolgray-400 hover:text-coolgray-600 transition-colors"
            aria-label="닫기"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* 설명 */}
        <p className="text-sm text-coolgray-500 leading-relaxed px-6 pb-4">
          설정한 목표 기간이 지나서, 더 이상 수익 없이 현금으로만 계산되는 항목들이에요.
        </p>

        {/* 콘텐츠 - 스크롤 가능 */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* 만기된 항목 리스트 */}
          {maturedItems.length > 0 ? (
            <div className="divide-y divide-coolgray-100">
              {maturedItems.map((item) => {
                const startDate = getStartDate(item)
                const endDate = calculateEndDate(startDate, item.period_years)
                const R = item.annual_rate ? item.annual_rate / 100 : 0.10
                
                // 만기 시점의 평가 금액 (고정된 값)
                const maturityValue = calculateFutureValue(
                  item.monthly_amount,
                  item.period_years,
                  item.period_years,
                  R
                )

                return (
                  <div
                    key={item.id}
                    className="py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* 좌측: 종목 정보 */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-coolgray-900 truncate mb-0.5">
                          {item.title}
                        </h3>
                        <p className="text-xs text-coolgray-400">
                          {formatFullDate(endDate)} 만기됨
                        </p>
                      </div>

                      {/* 우측: 금액 */}
                      <div className="flex-shrink-0 text-right">
                        <p className="text-sm font-bold text-coolgray-900">
                          {formatCurrency(maturityValue)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <p className="text-coolgray-500">
                현금 보관 중인 항목이 없어요
              </p>
            </div>
          )}

          {/* 안내 팁 */}
          {maturedItems.length > 0 && (
            <div className="mt-4 bg-coolgray-50 rounded-xl p-3">
              <p className="text-xs text-coolgray-500 leading-relaxed">
                💡 목표 기간이 지난 금액은 추가 수익 없이 그대로 보관됩니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
