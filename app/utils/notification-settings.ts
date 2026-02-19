import type { PreReminderOption, NotificationSettingsState } from '@/app/hooks/types/useNotificationSettings'

export const defaultNotificationSettings: NotificationSettingsState = {
  defaultTime: '09:00',
  preReminder: '1d',
  reReminderOn: true,
  streakOn: true,
  serviceAnnouncementsOn: true,
  dndOn: false,
  dndStart: '22:00',
  dndEnd: '08:00',
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
    dndOn: data.notification_dnd_enabled ?? defaultNotificationSettings.dndOn,
    dndStart: data.notification_dnd_start || defaultNotificationSettings.dndStart,
    dndEnd: data.notification_dnd_end || defaultNotificationSettings.dndEnd,
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
  if (partial.dndOn !== undefined) updates.notification_dnd_enabled = partial.dndOn
  if (partial.dndStart !== undefined) updates.notification_dnd_start = partial.dndStart
  if (partial.dndEnd !== undefined) updates.notification_dnd_end = partial.dndEnd

  return updates
}
