'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  useNotificationInbox,
  formatNotificationTime,
  type NotificationItem,
} from '@/app/hooks/useNotificationInbox'

function minutesAgo(mins: number): string {
  return new Date(Date.now() - mins * 60_000).toISOString()
}

// ... existing MOCK_NOTIFICATIONS ...

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'demo-1',
    title: '이번 주에 입금 예정인 투자금이 있어요',
    body: '오늘까지 30만원, 이번 주 안에 총 50만원이 입금될 예정이에요.',
    createdAt: minutesAgo(5),
  },
  {
    id: 'demo-2',
    title: '목표까지 절반을 넘었어요 🎉',
    body: '“내 집 마련” 목표 달성률이 52%를 돌파했어요. 지금 속도 그대로만 가도 충분해요.',
    createdAt: minutesAgo(60),
  },
  {
    id: 'demo-3',
    title: '지난달보다 투자 속도가 느려졌어요',
    body: '지난달 대비 입금 속도가 20% 정도 느려졌어요. 여유 있을 때 한 번 점검해 볼까요?',
    createdAt: minutesAgo(60 * 24),
  },
] as const

const isDev = process.env.NODE_ENV === 'development'

function NotificationsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { notifications } = useNotificationInbox()

  const isDemo = isDev && searchParams.get('demo') === '1'
  const displayNotifications = isDemo ? MOCK_NOTIFICATIONS : notifications

  return (
    <main className="min-h-screen bg-surface">
      <header className="h-[52px] flex items-center px-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 text-foreground-soft hover:text-foreground transition-colors -ml-1"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="w-6 h-6" weight="regular" />
        </button>
      </header>

      <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto px-4 py-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            알림
          </h1>
          {isDev && !isDemo && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-full h-8 px-3 text-xs font-medium"
              onClick={() => router.push('/notifications?demo=1')}
            >
              알림 예시보기
            </Button>
          )}
        </div>

        {displayNotifications.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-base text-muted-foreground">
              아직 알림이 없어요
            </p>
            <p className="text-sm text-foreground-subtle mt-1">
              푸시 알림이 켜지면 여기에 알림이 쌓여요
            </p>
            {isDev && !isDemo && (
              <div className="mt-6 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs font-medium"
                  onClick={() => router.push('/notifications?demo=1')}
                >
                  알림 예시보기
                </Button>
              </div>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-border-subtle rounded-xl overflow-hidden">
            {displayNotifications.map((item) => (
              <li key={item.id}>
                <div className="py-4 px-1 hover:bg-muted/50 transition-colors">
                  <p className="text-base font-medium text-foreground">
                    {item.title}
                  </p>
                  {item.body && (
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                      {item.body}
                    </p>
                  )}
                  <p className="text-xs text-foreground-subtle mt-1">
                    {formatNotificationTime(item.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <NotificationsContent />
    </Suspense>
  )
}
