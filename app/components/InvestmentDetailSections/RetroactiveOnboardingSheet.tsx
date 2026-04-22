'use client'

import { Button } from '@/components/ui/button'
import { ClockCounterClockwise } from '@phosphor-icons/react'

interface RetroactiveOnboardingSheetProps {
  isOpen: boolean
  /** 소급 구간 시작 YYYY.MM (예: 2024.06) */
  rangeStart: string
  /** 소급 구간 종료 YYYY.MM (포함) */
  rangeEnd: string
  /** 총 개월 수 */
  monthsCount: number
  onRecordNow: () => void
  onLater: () => void
}

export function RetroactiveOnboardingSheet({
  isOpen,
  rangeStart,
  rangeEnd,
  monthsCount,
  onRecordNow,
  onLater,
}: RetroactiveOnboardingSheetProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="소급 납입 안내"
      onClick={onLater}
    >
      <div
        className="bg-card rounded-t-3xl max-w-md mx-auto w-full shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-3 mb-3 h-1 w-10 rounded-full bg-surface-strong shrink-0" />

        <div className="px-6 pt-2 pb-6 space-y-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-hover">
              <ClockCounterClockwise
                className="h-6 w-6 text-foreground-soft"
                weight="regular"
                aria-hidden
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                앱 이전 기간이 있어요
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground-soft">
                <span className="font-medium text-foreground">
                  {rangeStart} ~ {rangeEnd}
                </span>
                <span className="text-foreground-muted"> ({monthsCount}개월)</span>
                은
                <br />앱에서 자동 추적되지 않았던 기간이에요.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground-soft">
                이 기간의 납입 내역을 직접 기록해서
                <br />더 정확한 꾸준함 기록을 완성해 볼까요?
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button type="button" size="lg" onClick={onRecordNow} className="w-full">
              지금 기록하기
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={onLater}
              className="w-full text-foreground-muted"
            >
              나중에
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
