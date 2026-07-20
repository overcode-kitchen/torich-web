'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ProgressBar } from '@/app/components/Common/ProgressBar'

export interface DetailProgressCardProps {
  /** 0~100+ 진행률. 표시 폭은 0~100 클램프 */
  percent: number
  completed?: boolean
  /** 바 아래 왼쪽 (시작일) */
  startLabel?: string
  /** 바 아래 오른쪽 (마감일) */
  endLabel?: string
  /**
   * 바 아래 상태 줄 (마감 지남 등). 명시하면 이 값이 우선한다.
   * 생략하고 completed=true면 기본 달성 메시지("🎉 목표를 달성했어요")를 노출한다.
   */
  status?: ReactNode
  /** 진행률 바 aria 라벨 */
  ariaLabel?: string
  className?: string
}

/**
 * 상세 화면 진행률 카드 — 회색 박스 안에 진행률 바 + 시작/마감일 + 상태 메시지.
 * 기존의 별도 "마감일 D-day 카드"와 "진행률 바"가 같은 내용을 중복 전달하던 것을 하나로 합친다.
 */
export function DetailProgressCard({
  percent,
  completed = false,
  startLabel,
  endLabel,
  status,
  ariaLabel = '진행률',
  className,
}: DetailProgressCardProps) {
  // status 명시값이 우선하고, 없으면 completed일 때만 기본 달성 메시지를 세운다.
  // ("🎉 목표를 달성했어요"가 목적 상세·적립 상세에 각각 하드코딩돼 있던 것을 한 곳으로 모음)
  const statusContent =
    status ??
    (completed ? <p className="font-semibold text-success">🎉 목표를 달성했어요</p> : null)

  return (
    <div className={cn('rounded-2xl bg-surface px-4 py-4', className)}>
      <ProgressBar
        percent={percent}
        completed={completed}
        label={ariaLabel}
        className="bg-muted"
      />
      {(startLabel || endLabel) && (
        <div className="mt-2.5 flex justify-between text-xs font-medium text-foreground-muted tabular-nums">
          <span>{startLabel}</span>
          <span>{endLabel}</span>
        </div>
      )}
      {statusContent && (
        <div className="mt-3 border-t border-border-subtle-lighter pt-3 text-sm">
          {statusContent}
        </div>
      )}
    </div>
  )
}
