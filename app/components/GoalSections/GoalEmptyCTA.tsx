'use client'

import Image from 'next/image'
import { Plus } from '@phosphor-icons/react'

export interface GoalEmptyCTAProps {
  onCreate: () => void
}

export function GoalEmptyCTA({ onCreate }: GoalEmptyCTAProps) {
  return (
    <section className="bg-card rounded-3xl p-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-1">
          <Image
            src="/icons/3d/mountain(green).png"
            alt="목적 아이콘"
            width={24}
            height={24}
            className="w-6 h-6"
          />
          <h2 className="text-lg font-bold text-foreground">
            모아야 할 큰돈이 있나요?
          </h2>
        </div>
        <button
          type="button"
          onClick={onCreate}
          aria-label="목적 만들기"
          className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full text-foreground-soft hover:bg-muted hover:text-foreground transition-colors"
        >
          <Plus className="w-5 h-5" weight="bold" />
        </button>
      </div>
      <p className="text-sm text-muted-foreground text-center">
        결혼·내 집 마련 같은 목표를 모아두세요.
      </p>
    </section>
  )
}
