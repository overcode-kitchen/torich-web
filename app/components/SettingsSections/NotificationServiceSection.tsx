'use client'

import { Switch } from '@/components/ui/switch'

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
      <div className="px-4 py-3 flex items-center justify-between gap-4">
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
    </>
  )
}

