'use client'

import { TimePicker } from '@/components/ui/time-picker'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { CaretDown } from '@phosphor-icons/react'

export type PreReminderOption = 'none' | 'same_day' | '1d' | '2d' | '3d' | '1w'

interface NotificationReminderSectionProps {
  defaultTime: string
  onDefaultTimeChange: (time: string) => void
  preReminder: PreReminderOption
  onPreReminderChange: (value: PreReminderOption) => void
  reReminderOn: boolean
  onToggleReReminder: () => void
  streakOn: boolean
  onToggleStreak: () => void
}

const PRE_REMINDER_LABEL: Record<PreReminderOption, string> = {
  none: '없음',
  same_day: '당일',
  '1d': '1일 전',
  '2d': '2일 전',
  '3d': '3일 전',
  '1w': '1주일 전',
}

export function NotificationReminderSection({
  defaultTime,
  onDefaultTimeChange,
  preReminder,
  onPreReminderChange,
  reReminderOn,
  onToggleReReminder,
  streakOn,
  onToggleStreak,
}: NotificationReminderSectionProps) {
  const preReminderLabel = PRE_REMINDER_LABEL[preReminder]

  return (
    <>
      {/* 기본 알림 시간 */}
      <div className="px-4 py-3 border-t border-border-subtle flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-foreground font-medium">기본 알림 시간</span>
          <span className="text-xs text-muted-foreground mt-1">
            새 리마인더 생성 시 기본 적용
          </span>
        </div>
        <div className="w-[120px]">
          <TimePicker value={defaultTime} onChange={onDefaultTimeChange} />
        </div>
      </div>

      {/* 기본 사전 알림 */}
      <div className="px-4 py-3 border-t border-border-subtle flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-foreground font-medium">기본 사전 알림</span>
          <span className="text-xs text-muted-foreground mt-1">
            새 리마인더 생성 시 기본 적용
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="min-w-[120px] justify-between rounded-2xl h-11 px-3 text-sm font-normal"
            >
              <span>{preReminderLabel}</span>
              <CaretDown className="w-4 h-4 text-foreground-subtle" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[160px]">
            {(
              ['none', 'same_day', '1d', '2d', '3d', '1w'] as PreReminderOption[]
            ).map((option) => (
              <DropdownMenuItem
                key={option}
                inset
                onSelect={(event) => {
                  event.preventDefault()
                  onPreReminderChange(option)
                }}
              >
                {PRE_REMINDER_LABEL[option]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 미완료 재알림 */}
      <div className="px-4 py-3 border-t border-border-subtle flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-foreground font-medium">미완료 재알림</span>
          <span className="text-xs text-muted-foreground mt-1">
            투자일이 지나도 완료 안 하면 다시 알려드려요.
          </span>
        </div>
        <Switch checked={reReminderOn} onCheckedChange={onToggleReReminder} />
      </div>

      {/* 연속 투자 알림 */}
      <div className="px-4 py-3 border-t border-border-subtle flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-foreground font-medium">연속 투자 알림</span>
          <span className="text-xs text-muted-foreground mt-1">
            streak를 유지할 수 있도록 동기부여 알림을 보내드려요.
          </span>
        </div>
        <Switch checked={streakOn} onCheckedChange={onToggleStreak} />
      </div>
    </>
  )
}

