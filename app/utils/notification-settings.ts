import type { PreReminderOption, NotificationSettingsState } from '@/app/hooks/types/useNotificationSettings'

export const defaultNotificationSettings: NotificationSettingsState = {
  defaultTime: '09:00',
  preReminder: '1d',
  reReminderOn: true,
  streakOn: true,
  serviceAnnouncementsOn: true,
}

/**
 * DB 데이터를 NotificationSettingsState로 변환
 */
export function mapDbDataToSettings(data: any): NotificationSettingsState {
  return {
    defaultTime: data.notification_default_time || defaultNotificationSettings.defaultTime,
    preReminder: (data.notification_pre_reminder as PreReminderOption) || defaultNotificationSettings.preReminder,
    reReminderOn: data.notification_re_reminder_enabled ?? defaultNotificationSettings.reReminderOn,
    streakOn: data.notification_streak_enabled ?? defaultNotificationSettings.streakOn,
    serviceAnnouncementsOn: data.notification_service_announcement_enabled ?? defaultNotificationSettings.serviceAnnouncementsOn,
  }
}

/**
 * NotificationSettingsState를 DB 업데이트 형식으로 변환
 */
export function mapSettingsToDbUpdates(
  partial: Partial<NotificationSettingsState>,
  userId: string
): Record<string, any> {
  const updates: Record<string, any> = { user_id: userId }

  if (partial.defaultTime !== undefined) updates.notification_default_time = partial.defaultTime
  if (partial.preReminder !== undefined) updates.notification_pre_reminder = partial.preReminder
  if (partial.reReminderOn !== undefined) updates.notification_re_reminder_enabled = partial.reReminderOn
  if (partial.streakOn !== undefined) updates.notification_streak_enabled = partial.streakOn
  if (partial.serviceAnnouncementsOn !== undefined) updates.notification_service_announcement_enabled = partial.serviceAnnouncementsOn

  return updates
}
