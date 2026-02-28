'use client'

import { X } from '@phosphor-icons/react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface InvestmentDaysPickerSheetProps {
  /** 현재 선택된 날짜들 (1~31) */
  tempDays: number[]
  isDirty: boolean
  onToggleDay: (day: number) => void
  onApply: () => void
  onClose: () => void
}

export default function InvestmentDaysPickerSheet({
  tempDays,
  isDirty,
  onToggleDay,
  onApply,
  onClose,
}: InvestmentDaysPickerSheetProps) {

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
          <h2 className="text-lg font-bold text-foreground">매월 투자일 선택</h2>
          <button
            onClick={onClose}
            className="p-1 text-foreground-subtle hover:text-foreground-muted transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 선택된 날짜 미리보기 */}
        <div className="px-6 pb-3">
          {tempDays.length > 0 ? (
            <div className="flex flex-wrap gap-1 justify-end">
              {tempDays.map((day) => (
                <span
                  key={day}
                  className="inline-flex items-center bg-[var(--brand-accent-bg)] text-[var(--brand-accent-text)] px-2 py-0.5 rounded-full text-xs font-medium"
                >
                  {day}일
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-foreground-subtle text-right">
              선택된 날짜가 없어요
            </p>
          )}
        </div>

        {/* 날짜 선택 그리드 - 스크롤 필요 시에만 스크롤바 표시 */}
        <ScrollArea className="flex-1 min-h-0 px-6 pb-6">
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
              const selected = tempDays.includes(day)
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => onToggleDay(day)}
                  className={`h-9 rounded-full text-sm font-semibold transition-colors ${selected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface-hover text-foreground-soft hover:bg-secondary'
                    }`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </ScrollArea>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-border-subtle flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-sm font-semibold text-foreground-soft bg-secondary rounded-xl hover:bg-surface-strong transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onApply}
            disabled={!isDirty}
            className="flex-1 py-3 text-sm font-semibold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-default"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  )
}

