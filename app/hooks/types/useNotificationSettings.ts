export type PreReminderOption = 'none' | 'same_day' | '1d' | '2d' | '3d' | '1w'

export interface NotificationSettingsState {
  defaultTime: string
  preReminder: PreReminderOption
  reReminderOn: boolean
  streakOn: boolean
  serviceAnnouncementsOn: boolean
  dndOn: boolean
  dndStart: string
  dndEnd: string
}

export interface UseNotificationSettingsReturn {
  settings: NotificationSettingsState
  setDefaultTime: (time: string) => void
  setPreReminder: (preReminder: PreReminderOption) => void
  toggleReReminder: () => void
  toggleStreak: () => void
  toggleServiceAnnouncements: () => void
  toggleDnd: () => void
  setDndStart: (time: string) => void
  setDndEnd: (time: string) => void
}
