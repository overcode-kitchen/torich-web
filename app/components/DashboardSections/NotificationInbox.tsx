'use client'

import Link from 'next/link'
import { Bell } from '@phosphor-icons/react'
import { useNotificationInbox } from '@/app/hooks/notification/useNotificationInbox'
import { cn } from '@/lib/utils'

export default function NotificationInbox() {
  const { unreadCount } = useNotificationInbox()

  return (
    <Link
      href="/notifications"
      className="relative flex items-center justify-center p-2 text-foreground hover:text-foreground-soft transition-colors rounded-xl -mr-1"
      aria-label="알림함"
    >
      <Bell className="w-6 h-6" weight="regular" />
      {unreadCount > 0 && (
        <span
          className={cn(
            'absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] rounded-full',
            'bg-primary text-primary-foreground text-xs font-medium'
          )}
          aria-hidden
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
