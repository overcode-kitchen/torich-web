'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface PeriodInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onAdjust: (delta: number) => void
  /** 적립형(목표 기간 없음) 여부 */
  isHabitMode?: boolean
  /** 적립형 토글 핸들러 */
  onToggleHabitMode?: (habit: boolean) => void
}

export default function PeriodInput({
  value,
  onChange,
  onAdjust,
  isHabitMode = false,
  onToggleHabitMode,
}: PeriodInputProps) {
  const supportsHabitMode = typeof onToggleHabitMode === 'function'

  return (
    <div>
      {/* 입력 영역: Habit이면 비활성화 + 오버레이 텍스트 */}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder="3년간"
          disabled={isHabitMode}
          className="w-full bg-card rounded-2xl py-3.5 px-4 text-foreground placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-0"
        />
        {isHabitMode && (
          <div className="absolute inset-0 flex items-center px-4 rounded-2xl bg-card pointer-events-none">
            <span className="text-sm font-medium text-foreground-soft">목표 기간 없이 적립 중</span>
          </div>
        )}
      </div>

      {/* 하단 행: 체크박스(좌) + ±1년 버튼(우, Habit 시 숨김) */}
      <div className="flex items-center justify-between mt-2">
        {supportsHabitMode && (
          <div className="flex items-center gap-1.5 pl-3">
            <Checkbox
              id="habit-toggle"
              checked={isHabitMode}
              onCheckedChange={(v) => onToggleHabitMode?.(v === true)}
            />
            <Label
              htmlFor="habit-toggle"
              className="text-xs text-foreground-soft cursor-pointer font-normal"
            >
              아직 목표 기간이 없어요
            </Label>
          </div>
        )}

        {!isHabitMode && (
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={() => onAdjust(1)}
              className="rounded-full bg-surface-hover hover:bg-muted text-foreground-soft font-medium text-xs px-3 py-1.5 transition-colors"
            >
              +1년
            </button>
            <button
              type="button"
              onClick={() => onAdjust(-1)}
              className="rounded-full bg-surface-hover hover:bg-muted text-foreground-soft font-medium text-xs px-3 py-1.5 transition-colors"
            >
              -1년
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
