'use client'

import Image from 'next/image'

const IMAGE_WIDTH = 320
const IMAGE_HEIGHT = 427

interface StepImage {
  imageSrc: string
  imageAlt: string
}

interface OnboardingImageStripProps {
  steps: readonly StepImage[]
  currentStep: number
}

export default function OnboardingImageStrip({ steps, currentStep }: OnboardingImageStripProps) {
  const percentPerSlide = 100 / steps.length

  return (
    <div className="flex flex-1 min-h-0 w-full max-h-[427px] items-center justify-center overflow-hidden">
      {/* 보이는 영역(윈도우) - 카드가 이 안에서 슬라이드됨, 큰 디바이스에서도 최대 높이 제한 */}
      <div className="relative h-full max-h-full w-full max-w-[320px] overflow-hidden rounded-2xl">
        <div
          className="flex h-full transition-transform duration-450 ease-out"
          style={{
            width: `${steps.length * 100}%`,
            transform: `translateX(-${(currentStep - 1) * percentPerSlide}%)`,
          }}
        >
          {steps.map((s, i) => (
            /* 카드 자체가 슬라이드: 각 슬라이드 = 카드(rounded, bg) + 이미지 */
            <div
              key={i}
              className="relative flex h-full flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted/50 shadow-sm"
              style={{ width: `${percentPerSlide}%` }}
            >
              <div className="relative h-full max-h-full w-full aspect-[3/4] overflow-hidden rounded-2xl">
                <Image
                  src={s.imageSrc}
                  alt={s.imageAlt}
                  width={IMAGE_WIDTH}
                  height={IMAGE_HEIGHT}
                  className="h-full w-full object-contain object-center"
                  sizes="(max-width: 448px) 100vw, 320px"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
