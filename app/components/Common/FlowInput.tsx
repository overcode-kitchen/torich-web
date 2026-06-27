'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface FlowInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * 'md': 일반 인풋 (h-12, text-base) — 이름·텍스트 입력
   * 'lg': 히어로 표시용 (h-16, text-2xl bold, 가운데 정렬) — 금액·수량 입력
   */
  size?: 'md' | 'lg'
  /** 인풋 오른쪽에 고정 표시되는 단위 텍스트 (예: "만원", "주") */
  suffix?: string
}

/**
 * 토리치 공용 플로우 인풋.
 * 초기에는 보더 없이 배경으로만 구분하고, 포커스 시 ring으로 강조한다.
 * 서비스 전체의 목적/투자 추가 플로우에서 공통으로 사용한다.
 */
const FlowInput = React.forwardRef<HTMLInputElement, FlowInputProps>(
  ({ className, size = 'md', suffix, ...props }, ref) => {
    const base =
      'w-full rounded-xl bg-muted/50 text-foreground placeholder:text-foreground-subtle ' +
      'border-0 focus:outline-none focus:ring-2 focus:ring-ring/60 focus:bg-card ' +
      'disabled:opacity-50 transition-all'

    const sizeClass =
      size === 'lg'
        ? 'h-16 px-4 text-2xl font-bold text-center tracking-tight'
        : 'h-12 px-4 text-base'

    if (suffix) {
      return (
        <div className="relative">
          <input
            ref={ref}
            className={cn(base, sizeClass, size === 'lg' ? 'pr-16' : 'pr-14', className)}
            {...props}
          />
          <span
            className={cn(
              'absolute right-4 top-1/2 -translate-y-1/2 font-medium text-foreground-soft pointer-events-none',
              size === 'lg' ? 'text-base' : 'text-sm',
            )}
          >
            {suffix}
          </span>
        </div>
      )
    }

    return (
      <input
        ref={ref}
        className={cn(base, sizeClass, className)}
        {...props}
      />
    )
  },
)
FlowInput.displayName = 'FlowInput'

export { FlowInput }
export type { FlowInputProps }
