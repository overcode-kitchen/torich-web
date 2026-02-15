'use client'

import Image from 'next/image'
import { X } from '@phosphor-icons/react'

export interface BrandStoryCardProps {
  showBrandStoryCard: boolean
  onOpenBrandStory: () => void
  onCloseBrandStoryCard: () => void
}

export default function BrandStoryCard({
  showBrandStoryCard,
  onOpenBrandStory,
  onCloseBrandStoryCard,
}: BrandStoryCardProps) {
  if (!showBrandStoryCard) return null

  return (
    <div className="w-full flex items-center justify-between rounded-2xl bg-card px-4 py-3 border border-card-border">
      <button
        type="button"
        onClick={onOpenBrandStory}
        className="flex-1 flex flex-col items-start text-left"
      >
        <div className="flex items-center gap-1">
          <Image
            src="/icons/3d/torich face.png"
            alt=""
            width={24}
            height={24}
            className="w-6 h-6 shrink-0"
            aria-hidden
          />
          <span className="text-foreground font-medium">토리치가 궁금하다면</span>
        </div>
        <span className="text-sm text-muted-foreground mt-0.5">
          이름에 담긴 의미와 우리가 추구하는 방향을 소개해요.
        </span>
      </button>
      <button
        type="button"
        onClick={onCloseBrandStoryCard}
        className="ml-2 p-1 text-foreground-subtle hover:text-foreground-soft transition-colors"
        aria-label="브랜드 스토리 카드 닫기"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
