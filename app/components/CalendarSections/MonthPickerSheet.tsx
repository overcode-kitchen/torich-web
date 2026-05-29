'use client'

import { CaretLeft, CaretRight, X } from '@phosphor-icons/react'
import { useMonthPicker } from '@/app/hooks/calendar/useMonthPicker'
import { useDismissibleSheet } from '@/app/hooks/useDismissibleSheet'
import { useSwipe } from '@/app/hooks/useSwipe'
import { APP_BOTTOM_NAV_TOTAL_HEIGHT } from '@/app/constants/layout-constants'

interface MonthPickerSheetProps {
  /** 현재 캘린더가 보고 있는 월 (강조 표시용) */
  currentMonth: Date
  /** 월 선택 시 호출 (month: 1-12) */
  onSelect: (year: number, month: number) => void
  onClose: () => void
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

export default function MonthPickerSheet({
  currentMonth,
  onSelect,
  onClose,
}: MonthPickerSheetProps) {
  const { viewYear, slideDirection, goPrevYear, goNextYear } = useMonthPicker(
    currentMonth.getFullYear(),
  )
  const { isClosing, requestClose, onAnimationEnd } = useDismissibleSheet(onClose)

  // 연도 영역 좌우 스와이프로 연도 페이징 (스테퍼 캐럿은 보조 컨트롤)
  const swipeHandlers = useSwipe({
    onSwipeLeft: goNextYear,
    onSwipeRight: goPrevYear,
  })

  const viewingYear = currentMonth.getFullYear()
  const viewingMonth = currentMonth.getMonth() + 1
  const today = new Date()

  // 연도 변경 시 캘린더 그리드와 동일한 슬라이드 인 애니메이션 (최초 표시는 제외)
  const monthsAnimationClass = slideDirection
    ? `animate-in fade-in duration-300 ease-out motion-reduce:animate-none ${
        slideDirection === 'next' ? 'slide-in-from-right-8' : 'slide-in-from-left-8'
      }`
    : ''

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

        {/* 연도·월 영역: 좌우 스와이프로 연도 페이징 */}
        <div className="select-none touch-pan-y" {...swipeHandlers}>
          {/* 연도 스테퍼 */}
          <div className="flex items-center justify-center gap-6 px-6 py-4">
            <button
              type="button"
              onClick={goPrevYear}
              aria-label="이전 연도"
              className="p-2 text-foreground-muted hover:text-foreground"
            >
              <CaretLeft className="w-6 h-6" />
            </button>
            <span className="w-24 text-center text-xl font-bold text-foreground tabular-nums">
              {viewYear}년
            </span>
            <button
              type="button"
              onClick={goNextYear}
              aria-label="다음 연도"
              className="p-2 text-foreground-muted hover:text-foreground"
            >
              <CaretRight className="w-6 h-6" />
            </button>
          </div>

          {/* 월 그리드: 연도가 바뀌면 key 갱신으로 슬라이드 인 애니메이션 재실행 */}
          <div
            key={viewYear}
            className={`grid grid-cols-3 gap-2 px-6 pb-8 ${monthsAnimationClass}`}
          >
            {MONTHS.map((m) => {
              const isViewing = viewYear === viewingYear && m === viewingMonth
              const isThisMonth =
                viewYear === today.getFullYear() && m === today.getMonth() + 1
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    onSelect(viewYear, m)
                    requestClose()
                  }}
                  className={`flex h-14 items-center justify-center rounded-xl text-base transition-colors ${
                    isViewing
                      ? 'bg-[var(--brand-accent-bg)] text-[var(--brand-accent-text)] ring-1 ring-brand-500'
                      : isThisMonth
                        ? 'bg-surface text-foreground'
                        : 'text-foreground-subtle hover:bg-surface-hover'
                  }`}
                >
                  {/* 선택된 월은 캘린더 날짜 선택과 동일하게 콘텐츠가 살짝 확대된다 */}
                  <span
                    className={`font-medium transition-transform duration-200 ease-out ${
                      isViewing ? 'scale-110' : 'scale-100'
                    }`}
                  >
                    {m}월
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
