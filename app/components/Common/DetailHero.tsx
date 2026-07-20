'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ProgressBar } from '@/app/components/Common/ProgressBar'

export interface DetailHeroProgress {
  /** 0~100+ 진행률. 표시 폭은 0~100 클램프 */
  percent: number
  /** 완료 시 채움색을 성공 톤으로 */
  completed?: boolean
  /** 바 아래 왼쪽 라벨 (예: 시작일). 생략 가능 */
  startLabel?: ReactNode
  /** 바 아래 오른쪽 라벨 (예: 마감일). 생략 가능 */
  endLabel?: ReactNode
  /** 진행 바 aria 라벨 */
  ariaLabel?: string
}

export interface DetailHeroProps {
  /** 히어로 숫자 위 라벨 (예: "총 납입액"). 생략 시 숫자만 노출 */
  label?: string
  /** 주인공 숫자 (이미 포맷된 문자열) */
  amount: string
  /**
   * 히어로 숫자 바로 아래에 붙는 얇은 진행 바(박스 없음) + 양 끝 라벨.
   * "돈이 주인공, 진행은 보조"인 상세 화면에서, 회색 진행 카드를 별도로 세우는 대신
   * 진행을 히어로에 종속시켜 시선의 주인공을 하나로 유지한다.
   */
  progress?: DetailHeroProgress
  /** 숫자(·진행 바) 아래 보조 줄 (예: "목표까지 100만원", 달성 메시지) */
  sub?: ReactNode
  /** 히어로 직속 슬롯 (그 외 부가 콘텐츠) */
  children?: ReactNode
  className?: string
}

/**
 * 상세(조회) 화면 최상단 히어로 블록.
 * "이 화면에서 가장 중요한 숫자 하나"를 큰 글씨로 세운다.
 * 목적/주식/예적금 상세가 동일 규격으로 사용해 시각 위계를 통일한다.
 * 진행 바가 필요하면 별도 카드로 세우지 말고 progress prop으로 히어로에 종속시킨다.
 */
export function DetailHero({ label, amount, progress, sub, children, className }: DetailHeroProps) {
  return (
    <section className={cn('pt-2 pb-6', className)}>
      {label && <p className="text-sm font-medium text-muted-foreground">{label}</p>}
      <p className="mt-1 text-3xl font-bold tracking-tight text-foreground tabular-nums break-all">
        {amount}
      </p>
      {progress && (
        <div className="mt-4">
          <ProgressBar
            percent={progress.percent}
            completed={progress.completed}
            label={progress.ariaLabel ?? '진행률'}
            className="bg-muted"
          />
          {(progress.startLabel || progress.endLabel) && (
            <div className="mt-2 flex justify-between text-xs font-medium text-foreground-muted tabular-nums">
              <span>{progress.startLabel}</span>
              <span>{progress.endLabel}</span>
            </div>
          )}
        </div>
      )}
      {sub && (
        <div className={cn('text-sm text-foreground-muted', progress ? 'mt-3' : 'mt-1.5')}>
          {sub}
        </div>
      )}
      {children && <div className="mt-5">{children}</div>}
    </section>
  )
}
