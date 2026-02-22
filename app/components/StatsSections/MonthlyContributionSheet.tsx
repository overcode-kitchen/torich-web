'use client'

import { formatCurrency } from '@/lib/utils'
import { X } from '@phosphor-icons/react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MonthlyContributionItemVM } from '@/app/hooks/investment/calculations/useMonthlyContribution'

interface MonthlyContributionSheetProps {
  contributionItems: MonthlyContributionItemVM[]
  totalAmount: number
  onClose: () => void
}

export default function MonthlyContributionSheet({
  contributionItems,
  totalAmount,
  onClose,
}: MonthlyContributionSheetProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* 오버레이 */}
      <div
        className="fixed inset-0 bg-black/50 animate-in fade-in-0 duration-200"
        onClick={onClose}
      />

      {/* 바텀 시트 */}
      <div className="relative z-50 w-full max-w-md bg-card rounded-t-3xl shadow-xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col">
        {/* 핸들 바 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-surface-strong rounded-full" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 pb-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            📋 이번 달 투자 내역
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-foreground-subtle hover:text-foreground-muted transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 총액 안내 */}
        <div className="px-6 pb-4">
          <p className="text-sm text-foreground-muted">
            총 <span className="font-bold text-foreground">{formatCurrency(totalAmount)}</span>을 아래와 같이 투자하고 있어요.
          </p>
        </div>

        {/* 콘텐츠 - 스크롤 필요 시에만 스크롤바 표시 */}
        <ScrollArea className="flex-1 min-h-0 px-6 pb-6">
          {contributionItems.length > 0 ? (
            <div className="divide-y divide-border-subtle">
              {contributionItems.map((item) => {
                return (
                  <div
                    key={item.id}
                    className="py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* 좌측: 아이콘 + 종목명 */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[var(--brand-accent-bg)] flex items-center justify-center flex-shrink-0">
                          <span className="text-brand-600 font-bold text-sm">
                            {item.initial}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-foreground truncate">
                          {item.title}
                        </h3>
                      </div>

                      {/* 우측: 금액 + 비중 */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <p className="text-base font-bold text-foreground">
                          {formatCurrency(item.amount)}
                        </p>
                        <span className="bg-secondary text-foreground-muted text-xs font-medium px-2 py-0.5 rounded-full">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <p className="text-muted-foreground">
                아직 등록된 투자가 없어요
              </p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
