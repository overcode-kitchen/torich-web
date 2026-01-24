'use client'

import { formatCurrency } from '@/lib/utils'
import { IconX } from '@tabler/icons-react'
import { Investment } from '@/app/types/investment'

interface MonthlyContributionSheetProps {
  items: Investment[]
  totalAmount: number
  onClose: () => void
  onEdit: () => void
}

export default function MonthlyContributionSheet({
  items,
  totalAmount,
  onClose,
  onEdit,
}: MonthlyContributionSheetProps) {
  // 종목명에서 이니셜 추출
  const getInitial = (title: string) => {
    return title.charAt(0).toUpperCase()
  }

  // 비중 계산
  const getPercentage = (amount: number) => {
    if (totalAmount === 0) return 0
    return Math.round((amount / totalAmount) * 100)
  }

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
            🌱 이번 달 심을 씨앗들
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-coolgray-400 hover:text-coolgray-600 transition-colors"
            aria-label="닫기"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* 총액 안내 */}
        <div className="px-6 pb-4">
          <p className="text-sm text-coolgray-600">
            총 <span className="font-bold text-coolgray-900">{formatCurrency(totalAmount)}</span>을 아래와 같이 나누어 심어요.
          </p>
        </div>

        {/* 콘텐츠 - 스크롤 가능 */}
        <div className="flex-1 overflow-y-auto px-6">
          {items.length > 0 ? (
            <div className="divide-y divide-coolgray-100">
              {items.map((item) => {
                const percentage = getPercentage(item.monthly_amount)
                
                return (
                  <div
                    key={item.id}
                    className="py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* 좌측: 아이콘 + 종목명 */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-brand-600 font-bold text-sm">
                            {getInitial(item.title)}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-coolgray-900 truncate">
                          {item.title}
                        </h3>
                      </div>

                      {/* 우측: 금액 + 비중 */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <p className="text-base font-bold text-coolgray-900">
                          {formatCurrency(item.monthly_amount)}
                        </p>
                        <span className="bg-coolgray-100 text-coolgray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <p className="text-coolgray-500">
                아직 등록된 투자가 없어요
              </p>
            </div>
          )}
        </div>

        {/* 푸터 - 수정 유도 */}
        <div className="px-6 py-4 border-t border-coolgray-100 mt-auto">
          <p className="text-sm text-coolgray-500 text-center mb-3">
            금액이나 종목을 바꾸고 싶나요?
          </p>
          <button
            onClick={onEdit}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            구성 수정하기
          </button>
        </div>
      </div>
    </div>
  )
}
