'use client'

export interface NotificationItem {
  id: string
  title: string
  body?: string
  readAt?: string
  createdAt: string
}

/**
 * 알림 생성일 기준 상대 시간 포맷. 페이지·목록 등에서 재사용.
 */
export function formatNotificationTime(createdAt: string): string {
  const date = new Date(createdAt)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return '방금 전'
  if (diffMins < 60) return `${diffMins}분 전`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}시간 전`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}일 전`
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

/**
 * 알림함 데이터 훅. 추후 푸시/알림 API 연동 시 이 훅만 수정하면 됨.
 */
export function useNotificationInbox(): {
  notifications: NotificationItem[]
  unreadCount: number
} {
  // 스텁: 실제 API 없음. 추후 연동 시 여기서 fetch/구독
  return {
    notifications: [],
    unreadCount: 0,
  }
}
