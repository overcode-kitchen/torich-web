export type PreReminderOption = 'none' | 'same_day' | '1d' | '2d' | '3d' | '1w'

export interface NotificationSettingsState {
  defaultTime: string
  preReminder: PreReminderOption
  reReminderOn: boolean
  serviceAnnouncementsOn: boolean
  skipWeekendHolidayOn: boolean
}

export interface UseNotificationSettingsReturn {
  settings: NotificationSettingsState
  setDefaultTime: (time: string) => void
  setPreReminder: (preReminder: PreReminderOption) => void
  toggleReReminder: () => void
  toggleServiceAnnouncements: () => void
  toggleSkipWeekendHoliday: () => void
}
