'use client'

interface StepProgressBarProps {
  /** 현재 단계 (1부터 시작) */
  current: number
  /** 전체 단계 수 */
  total: number
}

/**
 * 토스 스타일 N분할 진행 바 — 추가 위저드(목적·적립항목)가 공통으로 사용.
 * 현재 단계와 그 이전 단계는 채워지고, 이후 단계는 비어 있다.
 */
export default function StepProgressBar({ current, total }: StepProgressBarProps) {
  return (
    <div
      className="flex items-center gap-2 mb-8"
      role="progressbar"
      aria-label="진행 단계"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={
            'h-1 flex-1 rounded-full transition-colors ' +
            (i < current ? 'bg-foreground' : 'bg-muted')
          }
        />
      ))}
    </div>
  )
}
