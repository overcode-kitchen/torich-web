'use client'

import Image from 'next/image'
import { ReactNode } from 'react'

export interface OnboardingStepLayoutProps {
  /** 1스텝에서만 true 권장 */
  showLogo?: boolean
  title: string
  subtitle: string
  /** 이미지 경로. imageSlot 없을 때만 사용 */
  imageSrc?: string
  imageAlt?: string
  /** 이미지 영역을 커스텀(예: 슬라이드 스트립)으로 대체할 때 */
  imageSlot?: ReactNode
  /** 이미지 아래 노출 (예: 페이지네이션 점) */
  paginationSlot?: ReactNode
  /** 하단 CTA (이전/다음 또는 시작하기 등) */
  children: ReactNode
}

/** 이미지 영역 비율: 3:4 (세로로 더 긴 직사각형) */
const IMAGE_WIDTH = 320
const IMAGE_HEIGHT = 427 // 320 * (4/3)

export default function OnboardingStepLayout({
  showLogo = false,
  title,
  subtitle,
  imageSrc,
  imageAlt,
  imageSlot,
  paginationSlot,
  children,
}: OnboardingStepLayoutProps) {
  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden px-4 pt-5" aria-label={title}>
      {/* 상단: 로고 */}
      {showLogo && (
        <header className="mb-4 shrink-0">
          <div className="relative h-10 w-36">
            <Image
              src="/images/torich-logo.png"
              alt="토리치 로고"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
        </header>
      )}

      {/* 타이틀 · 서브타이틀 */}
      <div className="mb-5 shrink-0 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl whitespace-pre-line leading-tight">{title}</h1>
        <p className="text-sm text-foreground-muted whitespace-pre-line leading-snug">{subtitle}</p>
      </div>

      {/* 이미지 영역 - imageSlot 있으면 슬라이드 스트립, 없으면 단일 이미지 */}
      {imageSlot != null
        ? imageSlot
        : imageSrc != null &&
          imageAlt != null && (
            <div className="flex flex-1 min-h-0 w-full items-center justify-center overflow-hidden">
              <div className="relative h-full max-h-full w-full max-w-[320px] aspect-[3/4] overflow-hidden rounded-2xl bg-muted/50">
                <Image
                  src={imageSrc}
                  alt={imageAlt}
                  width={IMAGE_WIDTH}
                  height={IMAGE_HEIGHT}
                  className="h-full w-full object-contain object-center"
                  sizes="(max-width: 448px) 100vw, 320px"
                />
              </div>
            </div>
          )}

      {/* 이미지 아래: 페이지네이션 등 */}
      {paginationSlot != null ? paginationSlot : null}

      {/* 하단 CTA - safe-area로 노치/웹 프레임에서 잘리지 않게 */}
      <div
        className="flex shrink-0 flex-col gap-3 pt-5 pb-6"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))' }}
      >
        {children}
      </div>
    </section>
  )
}
