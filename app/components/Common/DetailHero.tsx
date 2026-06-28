'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface DetailHeroProps {
  /** 히어로 숫자 위 라벨 (예: "현재 모은 금액", "총 납입액") */
  label: string
  /** 주인공 숫자 (이미 포맷된 문자열) */
  amount: string
  /** 숫자 아래 보조 줄 (예: "목표까지 100만원") */
  sub?: ReactNode
  /** 히어로 직속 슬롯 (진행률 바 등) */
  children?: ReactNode
  className?: string
}

/**
 * 상세(조회) 화면 최상단 히어로 블록.
 * "이 화면에서 가장 중요한 숫자 하나"를 큰 글씨로 세운다.
 * 목적/주식/예적금 상세가 동일 규격으로 사용해 시각 위계를 통일한다.
 */
export function DetailHero({ label, amount, sub, children, className }: DetailHeroProps) {
  return (
    <section className={cn('pt-2 pb-6', className)}>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-foreground tabular-nums break-all">
        {amount}
      </p>
      {sub && <div className="mt-1.5 text-sm text-foreground-muted">{sub}</div>}
      {children && <div className="mt-5">{children}</div>}
    </section>
  )
}
