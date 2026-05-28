import { CaretLeft, CaretRight, CaretUp, CaretDown } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface CalendarHeaderSectionProps {
  currentMonth: Date
  /** 네이티브 앱 노치 대응 상단 패딩 값 */
  headerSafeTop: string
  goToPrevMonth: () => void
  goToNextMonth: () => void
  /** 연도·월 라벨 탭 시 피커 열기 */
  openPicker: () => void
  /** 캘린더 펼침/접힘 상태 */
  isCollapsed: boolean
  /** 펼침/접힘 토글 */
  toggleCollapsed: () => void
}

/** 캘린더 상단 앱바: 월 이동 캐럿 + 연도·월 피커 트리거 + 펼침/접힘 토글 */
export function CalendarHeaderSection({
  currentMonth,
  headerSafeTop,
  goToPrevMonth,
  goToNextMonth,
  openPicker,
  isCollapsed,
  toggleCollapsed,
}: CalendarHeaderSectionProps) {
  const ToggleIcon = isCollapsed ? CaretDown : CaretUp
  return (
    <header
      className="fixed inset-x-0 top-0 z-30 w-full bg-surface"
      style={{ paddingTop: headerSafeTop }}
    >
      <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto px-2">
        <div className="relative h-12 min-h-[48px] max-h-[48px] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={goToPrevMonth}
            aria-label="이전 달"
            className="p-2 text-foreground-muted hover:text-foreground"
          >
            <CaretLeft className="w-6 h-6" />
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
            <button
              type="button"
              onClick={openPicker}
              aria-label="연도·월 선택"
              className="text-base font-semibold text-foreground"
            >
              {format(currentMonth, 'yyyy년 M월', { locale: ko })}
            </button>
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={isCollapsed ? '캘린더 펼치기' : '캘린더 접기'}
              aria-pressed={isCollapsed}
              className="p-1 text-foreground-muted hover:text-foreground"
            >
              <ToggleIcon className="w-4 h-4" weight="bold" />
            </button>
          </h1>
          <button
            type="button"
            onClick={goToNextMonth}
            aria-label="다음 달"
            className="p-2 text-foreground-muted hover:text-foreground"
          >
            <CaretRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  )
}
