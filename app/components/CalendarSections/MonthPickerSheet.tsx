'use client'

import { useState } from 'react'
import { X } from '@phosphor-icons/react'
import YearMonthWheel from '@/app/components/Common/YearMonthWheel'
import { useDismissibleSheet } from '@/app/hooks/useDismissibleSheet'
import { APP_BOTTOM_NAV_TOTAL_HEIGHT } from '@/app/constants/layout-constants'

interface MonthPickerSheetProps {
  /** 현재 캘린더가 보고 있는 월 (강조 표시용) */
  currentMonth: Date
  /** 월 선택 시 호출 (month: 1-12) */
  onSelect: (year: number, month: number) => void
  onClose: () => void
}

export default function MonthPickerSheet({
  currentMonth,
  onSelect,
  onClose,
}: MonthPickerSheetProps) {
  const { isClosing, requestClose, onAnimationEnd } = useDismissibleSheet(onClose)

  // 휠로 굴리는 동안의 임시 선택값. "완료"를 눌러야 실제로 반영된다.
  const [draftYear, setDraftYear] = useState<number>(currentMonth.getFullYear())
  const [draftMonth, setDraftMonth] = useState<number>(
    currentMonth.getMonth() + 1,
  )

  const handleConfirm = () => {
    onSelect(draftYear, draftMonth)
    requestClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ paddingBottom: APP_BOTTOM_NAV_TOTAL_HEIGHT }}
    >
      {/* 오버레이 */}
      <div
        className={`fixed inset-0 bg-black/50 duration-300 ${
          isClosing ? 'animate-out fade-out-0' : 'animate-in fade-in-0'
        }`}
        onClick={requestClose}
      />

      {/* 바텀 시트: 진입은 슬라이드업, 퇴장은 슬라이드다운으로 일관되게 처리 */}
      <div
        onAnimationEnd={onAnimationEnd}
        className={`relative z-50 w-full max-w-md bg-card rounded-t-3xl shadow-xl duration-300 flex flex-col ${
          isClosing ? 'animate-out slide-out-to-bottom' : 'animate-in slide-in-from-bottom'
        }`}
      >
        {/* 핸들 바 */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 bg-surface-strong rounded-full" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 pb-2 shrink-0">
          <h2 className="text-lg font-bold text-foreground">연도·월 선택</h2>
          <button
            onClick={requestClose}
            className="p-1 text-foreground-subtle hover:text-foreground-muted transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 연/월 스크롤 휠 */}
        <div className="px-6 pb-6 pt-2">
          <YearMonthWheel
            year={draftYear}
            month={draftMonth}
            onChange={(y, m) => {
              setDraftYear(y)
              setDraftMonth(m)
            }}
          />
          <button
            type="button"
            onClick={handleConfirm}
            className="mt-2 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            완료
          </button>
        </div>
      </div>
    </div>
  )
}
