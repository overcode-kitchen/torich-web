'use client'

import { TimePicker } from '@/components/ui/time-picker'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

interface NotificationDndSectionProps {
  dndOn: boolean
  onToggleDnd: () => void
  dndStart: string
  dndEnd: string
  onDndStartChange: (time: string) => void
  onDndEndChange: (time: string) => void
}

export function NotificationDndSection({
  dndOn,
  onToggleDnd,
  dndStart,
  dndEnd,
  onDndStartChange,
  onDndEndChange,
}: NotificationDndSectionProps) {
  const dimmed = !dndOn

  return (
    <>
      {/* 방해금지 토글 */}
      <div className="px-4 py-3  flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-foreground font-medium">방해금지</span>
          <span className="text-xs text-muted-foreground mt-1">
            설정한 시간 동안에는 알림을 보내지 않아요.
          </span>
        </div>
        <Switch checked={dndOn} onCheckedChange={onToggleDnd} />
      </div>

      {/* 시작 시간 */}
      <div
        className={cn(
          'px-4 py-3 flex items-center justify-between gap-4',
          dimmed && 'opacity-60'
        )}
      >
        <div className="flex flex-col">
          <span className="text-foreground font-medium">시작 시간</span>
          <span className="text-xs text-muted-foreground mt-1">
            방해금지 모드가 시작되는 시간이에요.
          </span>
        </div>
        <div className="w-[120px]">
          <TimePicker value={dndStart} onChange={onDndStartChange} disabled={dimmed} />
        </div>
      </div>

      {/* 종료 시간 */}
      <div
        className={cn(
          'px-4 py-3 flex items-center justify-between gap-4',
          dimmed && 'opacity-60'
        )}
      >
        <div className="flex flex-col">
          <span className="text-foreground font-medium">종료 시간</span>
          <span className="text-xs text-muted-foreground mt-1">
            방해금지 모드가 해제되는 시간이에요.
          </span>
        </div>
        <div className="w-[120px]">
          <TimePicker value={dndEnd} onChange={onDndEndChange} disabled={dimmed} />
        </div>
      </div>
    </>
  )
}

