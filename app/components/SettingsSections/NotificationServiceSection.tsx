'use client'

import { Switch } from '@/components/ui/switch'
import { LockSimple } from '@phosphor-icons/react'

interface NotificationServiceSectionProps {
  serviceAnnouncementsOn: boolean
  onToggleServiceAnnouncements: () => void
}

export function NotificationServiceSection({
  serviceAnnouncementsOn,
  onToggleServiceAnnouncements,
}: NotificationServiceSectionProps) {
  return (
    <>
      {/* 공지사항 푸시 */}
      <div className="px-4 py-3 border-t border-border-subtle flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-foreground font-medium">공지사항 푸시</span>
          <span className="text-xs text-muted-foreground mt-1">
            OFF로 설정하면 인앱 알림함에서만 확인할 수 있어요.
          </span>
        </div>
        <Switch
          checked={serviceAnnouncementsOn}
          onCheckedChange={onToggleServiceAnnouncements}
        />
      </div>

      {/* 계정/보안 알림 */}
      <div className="px-4 py-3 border-t border-border-subtle flex items-center justify-between gap-4 opacity-70">
        <div className="flex flex-col">
          <span className="inline-flex items-center gap-1 text-foreground font-medium">
            <LockSimple className="w-4 h-4 text-foreground-subtle" weight="fill" />
            <span>계정/보안 알림</span>
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            로그인, 비밀번호 변경 등 중요한 알림은 항상 전송돼요.
          </span>
        </div>
        <Switch checked disabled aria-label="계정 및 보안 알림은 항상 켜져 있습니다" />
      </div>
    </>
  )
}

