'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboardingStep } from '@/app/hooks/onboarding/useOnboardingStep'
import { ONBOARDING_STEPS } from '@/app/constants/onboarding'
import OnboardingStepLayout from './OnboardingStepLayout'
import OnboardingImageStrip from './OnboardingImageStrip'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useIsNativeApp } from '@/app/hooks/platform/useIsNativeApp'

const SWIPE_THRESHOLD = 50

export default function OnboardingView() {
  const router = useRouter()
  const { step, totalSteps, goNext, goPrev, goToStep, isFirst, isLast } = useOnboardingStep()
  const config = ONBOARDING_STEPS[step - 1]
  const isNativeApp = useIsNativeApp()
  const touchStartX = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const endX = e.changedTouches[0].clientX
    const deltaX = touchStartX.current - endX
    touchStartX.current = null
    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return
    if (deltaX > 0 && !isLast) goNext()
    else if (deltaX < 0 && !isFirst) goPrev()
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return
    e.preventDefault()
    if (e.deltaX > 0 && !isFirst) goPrev()
    else if (e.deltaX < 0 && !isLast) goNext()
  }

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden bg-background"
      style={{
        height: '100dvh',
        paddingTop: isNativeApp ? 'env(safe-area-inset-top, 0px)' : '0px',
      }}
    >
      <main className="h-full w-full overflow-hidden flex flex-col">
      <div className="mx-auto flex max-w-md flex-col flex-1 min-h-0 w-full h-full">
        {/* 현재 스텝: 가로 스와이프/스크롤로 이전·다음 이동 */}
        <div
          className="flex-1 min-h-0 overflow-hidden touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
        <OnboardingStepLayout
          showLogo={config.showLogo}
          title={config.title}
          subtitle={config.subtitle}
          imageSlot={
            <OnboardingImageStrip
              steps={ONBOARDING_STEPS.map((s) => ({ imageSrc: s.imageSrc, imageAlt: s.imageAlt }))}
              currentStep={step}
            />
          }
          paginationSlot={
            <div className="flex shrink-0 justify-center gap-1.5 py-5" role="tablist" aria-label="온보딩 단계">
              {Array.from({ length: totalSteps }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-label={`${i + 1}단계`}
                  aria-selected={i + 1 === step}
                  onClick={() => goToStep(i + 1)}
                  className={cn(
                    'h-1.5 w-6 rounded-full transition-colors cursor-pointer touch-manipulation',
                    i + 1 === step ? 'bg-primary' : 'bg-muted hover:bg-muted/80'
                  )}
                />
              ))}
            </div>
          }
        >
          {isLast ? (
            <div className="flex gap-3">
              <Button variant="outline" size="lg" className="flex-1" onClick={goPrev}>
                이전
              </Button>
              <Button
                size="lg"
                className="flex-1 py-3.5 text-base font-semibold"
                onClick={() => router.push('/login')}
              >
                시작하기
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              {!isFirst && (
                <Button variant="outline" size="lg" className="flex-1" onClick={goPrev}>
                  이전
                </Button>
              )}
              <Button size="lg" className="flex-1 py-3.5 text-base font-semibold" onClick={goNext}>
                다음
              </Button>
            </div>
          )}
        </OnboardingStepLayout>
        </div>
      </div>
    </main>
    </div>
  )
}
